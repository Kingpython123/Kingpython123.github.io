/**
 * Notion 导出处理的公用逻辑。
 *
 * 清点、取日期、正式导入这三个脚本都从这里取筛选规则，
 * 保证「哪些页面要迁移」只有一处定义，不会三处走偏。
 */
import fs from 'node:fs';
import path from 'node:path';

/** Notion 附加在文件名/文件夹名尾部的 32 位十六进制 page id */
const NOTION_ID = /\b[0-9a-f]{32}\b/;
const NOTION_ID_GLOBAL = / ?\b[0-9a-f]{32}\b/g;
/** 同名冲突时 Notion 会退化成短 id，形如 " 2da5-c0c5" */
const NOTION_SHORT_ID = / \b[0-9a-f]{4}-[0-9a-f]{4}\b/g;

export function stripNotionId(name) {
	return name.replace(NOTION_ID_GLOBAL, '').replace(NOTION_SHORT_ID, '').trim();
}

/** 从文件名里取出 Notion page id，并补成带连字符的 UUID 形式 */
export function extractPageId(filePath) {
	const match = path.basename(filePath).match(NOTION_ID);
	if (!match) return null;
	const raw = match[0];
	return [
		raw.slice(0, 8),
		raw.slice(8, 12),
		raw.slice(12, 16),
		raw.slice(16, 20),
		raw.slice(20),
	].join('-');
}

export function walk(dir, acc = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, acc);
		else acc.push(full);
	}
	return acc;
}

/**
 * 丢弃规则。Notion 全量导出会带进来大量与技术笔记无关的东西：
 * 自带的示例模板、数据库索引页、空白页，以及涉及个人信息或不宜公开的内容。
 */
const DISCARD_RULES = [
	// 这个目录下只有三类内容：thunderscope 实验室项目、本科毕设提示词、
	// FPGA 板级记录（文件名叫 cnn，实际是 Quartus + Sobel 边缘检测，与深度学习无关）。
	// 全部属于不公开范围，整棵子树排除。
	{ test: (r) => /^不是垃圾的垃圾箱/.test(r), why: '实验室/毕设/FPGA 内容，经确认不公开' },
	{ test: (r) => /资源库名称（示例/.test(r), why: 'Notion 模板示例' },
	{ test: (r) => /^主页/.test(r), why: 'Notion 首页/视图，无正文' },
	{ test: (r) => /^库\.md$/.test(r), why: '数据库容器页，无正文' },
	{ test: (r) => /^People/.test(r), why: '含真实姓名，且无技术内容' },
	{ test: (r) => /无标题/.test(r), why: '无标题空页' },
	{ test: (r) => /本科毕设论文提示词/.test(r), why: '毕设相关，含个人学业信息' },
];

/**
 * 扫描导出目录，返回每个 Markdown 文件的元信息和处置建议。
 */
export function collectNotes(exportDir) {
	const notes = [];

	for (const abs of walk(exportDir).filter((f) => f.toLowerCase().endsWith('.md'))) {
		const rel = path.relative(exportDir, abs);
		const cleanRel = stripNotionId(rel);
		const raw = fs.readFileSync(abs, 'utf8');
		const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== '');
		const title = (lines[0] ?? '').replace(/^#\s*/, '').trim();

		// 正文行数：去掉标题、纯图片行、纯链接行（Notion 索引页全是纯链接）
		const bodyLines = lines.slice(1).filter((l) => !/^!\[/.test(l) && !/^\[.*\]\(.*\)$/.test(l));
		const images = (raw.match(/!\[[^\]]*\]\(/g) ?? []).length;
		const hasMath = /\$\$|(?<!\$)\$(?!\$)/.test(raw);

		let action = '迁移';
		let why = '';

		const discard = DISCARD_RULES.find((r) => r.test(cleanRel));

		if (discard) {
			action = '丢弃';
			why = discard.why;
		} else if (bodyLines.length === 0) {
			action = '丢弃';
			why = '只有标题，没有正文';
		} else if (bodyLines.length <= 2 && images === 0) {
			action = '丢弃';
			why = `正文仅 ${bodyLines.length} 行，疑为索引页`;
		}

		notes.push({
			abs,
			rel,
			cleanRel,
			pageId: extractPageId(abs),
			title,
			bytes: fs.statSync(abs).size,
			bodyLines: bodyLines.length,
			images,
			hasMath,
			action,
			why,
		});
	}

	return notes;
}

export function keptNotes(exportDir) {
	return collectNotes(exportDir).filter((n) => n.action === '迁移');
}
