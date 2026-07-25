/**
 * 把 Notion 导出的笔记导入站点。
 *
 * 依赖两份人工/API 产出的数据：
 *   - scripts/notion-mapping.json  人工审核过的 slug / 标题 / 标签
 *   - notion-dates.json            由 notion-fetch-dates.mjs 从 Notion API 取回的创建时间
 *
 * 用法：node scripts/notion-import.mjs <导出目录> <dates.json> [--dry]
 *
 * 全部导入为 draft: true。策略是先整体入库，再一篇篇校对后发布。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { keptNotes, stripNotionId } from './notion-lib.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const [exportDir, datesFile, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry');

if (!exportDir || !datesFile) {
	console.error('用法: node scripts/notion-import.mjs <导出目录> <dates.json> [--dry]');
	process.exit(1);
}

const mapping = JSON.parse(fs.readFileSync(path.join(scriptDir, 'notion-mapping.json'), 'utf8')).notes;
const dates = JSON.parse(fs.readFileSync(datesFile, 'utf8'));

const NOTES_DIR = path.join(repoRoot, 'src/content/notes');
const FILES_DIR = path.join(repoRoot, 'public/files');

/** 把 Notion 的资源文件名规整成 ASCII 友好的形式：image 1.png -> image-1.png */
function normalizeAssetName(name) {
	const ext = path.extname(name);
	const base = path
		.basename(name, ext)
		.toLowerCase()
		.replace(/[\s_]+/g, '-')
		.replace(/[^a-z0-9-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
	return `${base || 'asset'}${ext.toLowerCase()}`;
}

/**
 * 让正文标题从 h2 开始。
 *
 * Notion 里的层级很随意：有的文件正文直接用 #，有的从 ### 起跳。
 * 页面标题已经由布局渲染成 h1，正文再出现 # 就会有第二个 h1。
 * 这里整体平移，使每篇最浅的标题变成 h2，相对层级保持不变。
 */
function normalizeHeadings(body) {
	const levels = [...body.matchAll(/^(#{1,6})\s+/gm)].map((m) => m[1].length);
	if (levels.length === 0) return body;

	const shift = 2 - Math.min(...levels);
	if (shift === 0) return body;

	return body.replace(/^(#{1,6})(\s+)/gm, (_, hashes, space) => {
		const level = Math.min(6, Math.max(1, hashes.length + shift));
		return '#'.repeat(level) + space;
	});
}

function yamlString(value) {
	return `'${String(value).replace(/'/g, "''")}'`;
}

const notes = keptNotes(exportDir);

// 原始相对路径（去 id 后） -> slug，用于把 Notion 站内链接改写成本站链接
const slugByCleanRel = new Map(Object.entries(mapping).map(([rel, cfg]) => [rel, cfg.slug]));

const summary = [];
const problems = [];

for (const note of notes) {
	const config = mapping[note.cleanRel];
	if (!config) {
		problems.push(`映射表缺少条目：${note.cleanRel}`);
		continue;
	}

	const dateInfo = dates[note.cleanRel];
	if (!dateInfo?.created) {
		problems.push(`缺少创建日期：${note.cleanRel}`);
		continue;
	}

	const { slug, tags } = config;
	const title = config.title?.trim() || note.title;
	const mdDir = path.dirname(note.abs);

	let body = fs.readFileSync(note.abs, 'utf8');

	// 去掉首行的 # 标题，标题由布局渲染，正文里不再重复
	body = body.replace(/^\s*#\s+.*\r?\n/, '');

	const copiedAssets = [];

	// 1) 图片：复制到 src/content/notes/<slug>/ 并改成相对引用，
	//    这样 Astro 的资源管线会接管它们（压缩、转 webp、加宽高）
	body = body.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (whole, alt, href) => {
		if (/^https?:/.test(href)) return whole;

		const decoded = decodeURIComponent(href);
		const source = path.resolve(mdDir, decoded);

		if (!fs.existsSync(source)) {
			problems.push(`${slug}: 图片不存在 ${decoded}`);
			return whole;
		}

		const target = normalizeAssetName(path.basename(decoded));
		copiedAssets.push({ source, target: path.join(NOTES_DIR, slug, target) });
		return `![${alt}](./${slug}/${target})`;
	});

	// 2) 站内链接：指向同样迁移过来的笔记就改成 /notes/<slug>/；
	//    指向未迁移页面的链接留下文字、去掉链接，避免死链
	body = body.replace(/(?<!!)\[([^\]]*)\]\(([^)]+)\)/g, (whole, text, href) => {
		if (/^(https?:|mailto:|#|\/)/.test(href)) return whole;

		const decoded = decodeURIComponent(href);

		if (decoded.toLowerCase().endsWith('.md')) {
			const targetRel = stripNotionId(path.normalize(path.join(path.dirname(note.rel), decoded)));
			const targetSlug = slugByCleanRel.get(targetRel);
			if (targetSlug) return `[${text}](/notes/${targetSlug}/)`;
			return text; // 目标未发布，降级成纯文字
		}

		// 其他附件（如代码文件）放进 public/files/<slug>/ 原样提供下载
		const source = path.resolve(mdDir, decoded);
		if (!fs.existsSync(source)) {
			problems.push(`${slug}: 附件不存在 ${decoded}`);
			return text;
		}

		const target = normalizeAssetName(path.basename(decoded));
		copiedAssets.push({ source, target: path.join(FILES_DIR, slug, target) });
		return `[${text}](/files/${slug}/${target})`;
	});

	body = body.replace(/\n{3,}/g, '\n\n').trim();
	body = normalizeHeadings(body);

	const frontmatter = [
		'---',
		`title: ${yamlString(title)}`,
		`date: ${yamlString(dateInfo.created)}`,
		`tags: [${tags.map(yamlString).join(', ')}]`,
		// 统一导入为草稿：逐篇校对（图片、标题层级、错别字）后再改成 false 发布
		'draft: true',
		'---',
		'',
	].join('\n');

	if (!dryRun) {
		fs.mkdirSync(NOTES_DIR, { recursive: true });
		fs.writeFileSync(path.join(NOTES_DIR, `${slug}.md`), `${frontmatter}${body}\n`, 'utf8');

		for (const asset of copiedAssets) {
			fs.mkdirSync(path.dirname(asset.target), { recursive: true });
			fs.copyFileSync(asset.source, asset.target);
		}
	}

	summary.push({ slug, title, date: dateInfo.created, assets: copiedAssets.length });
}

summary.sort((a, b) => a.date.localeCompare(b.date));
for (const s of summary) {
	console.log(`${s.date}  ${s.slug.padEnd(36)} ${String(s.assets).padStart(3)} 个资源  ${s.title}`);
}

console.log(`\n${dryRun ? '[试运行] ' : ''}共 ${summary.length} 篇`);

if (problems.length > 0) {
	console.log(`\n问题 ${problems.length} 条：`);
	for (const p of problems) console.log(`  ${p}`);
}
