/**
 * 通过 Notion API 取每篇笔记的创建时间。
 *
 * Notion 的 Markdown 导出不含任何日期元数据（文件时间戳全是导出当天），
 * 但导出文件名尾部那串 32 位十六进制就是 page id，据此可以回查真实创建时间。
 *
 * 用法：
 *   $env:NOTION_TOKEN = "ntn_xxx"        # PowerShell
 *   node scripts/notion-fetch-dates.mjs <导出目录> <输出 json>
 *
 * token 只从环境变量读取，不写入任何文件，也不打印。
 */
import fs from 'node:fs';
import { keptNotes } from './notion-lib.mjs';

const [exportDir, outFile] = process.argv.slice(2);
const token = process.env.NOTION_TOKEN;

if (!exportDir || !outFile) {
	console.error('用法: node scripts/notion-fetch-dates.mjs <导出目录> <输出 json>');
	process.exit(1);
}

if (!token) {
	console.error('缺少环境变量 NOTION_TOKEN。');
	console.error('PowerShell: $env:NOTION_TOKEN = "ntn_你的token"');
	process.exit(1);
}

// 官方当前最新版本。这个 header 是必填的
const NOTION_VERSION = '2026-03-11';

const notes = keptNotes(exportDir);
console.log(`待查询 ${notes.length} 篇`);

/** Notion 的速率限制约每秒 3 次请求，这里留足余量 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const result = {};
const failures = [];

for (const [index, note] of notes.entries()) {
	if (!note.pageId) {
		failures.push({ title: note.title, reason: '文件名里没有 page id' });
		continue;
	}

	try {
		const response = await fetch(`https://api.notion.com/v1/pages/${note.pageId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Notion-Version': NOTION_VERSION,
			},
		});

		if (!response.ok) {
			const body = await response.json().catch(() => ({}));
			// object_not_found 基本都是「页面没共享给这个 connection」，不是 id 错
			failures.push({
				title: note.title,
				reason: `HTTP ${response.status} ${body.code ?? ''} ${body.message ?? ''}`.trim(),
			});
		} else {
			const page = await response.json();
			result[note.cleanRel] = {
				title: note.title,
				pageId: note.pageId,
				created: page.created_time?.slice(0, 10) ?? null,
				edited: page.last_edited_time?.slice(0, 10) ?? null,
			};
		}
	} catch (error) {
		failures.push({ title: note.title, reason: String(error) });
	}

	process.stdout.write(`\r进度 ${index + 1}/${notes.length}`);
	await sleep(350);
}

process.stdout.write('\n');

fs.writeFileSync(outFile, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(`成功 ${Object.keys(result).length} 篇，已写出 ${outFile}`);

if (failures.length > 0) {
	console.log(`\n失败 ${failures.length} 篇：`);
	for (const f of failures) console.log(`  ${f.title} — ${f.reason}`);
	console.log('\n如果报 object_not_found，说明该页面还没共享给你的 connection。');
	console.log('在 Notion 里打开对应页面（或它的顶层父页面）→ ••• → Add connections → 选中你建的那个。');
}
