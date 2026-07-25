/**
 * Notion 导出内容清点（只读，不改动任何文件）
 *
 * 用法：node scripts/notion-triage.mjs <导出目录> <输出文件>
 */
import fs from 'node:fs';
import { collectNotes } from './notion-lib.mjs';

const [exportDir, outFile] = process.argv.slice(2);

if (!exportDir || !outFile) {
	console.error('用法: node scripts/notion-triage.mjs <导出目录> <输出文件>');
	process.exit(1);
}

const rows = collectNotes(exportDir).sort((a, b) => {
	const order = { 迁移: 0, 待确认: 1, 丢弃: 2 };
	return order[a.action] - order[b.action] || b.bytes - a.bytes;
});

const count = (a) => rows.filter((r) => r.action === a).length;
const kb = (b) => +(b / 1024).toFixed(1);

const out = [
	'# Notion 导出清点',
	'',
	`导出目录：\`${exportDir}\``,
	`扫描到 ${rows.length} 个 Markdown 文件。`,
	'',
	`- 迁移：${count('迁移')}`,
	`- 丢弃：${count('丢弃')}`,
	'',
	'| 处置 | 标题 | KB | 正文行 | 图 | 公式 | 原路径 | 理由 |',
	'| --- | --- | --- | --- | --- | --- | --- | --- |',
	...rows.map(
		(r) =>
			`| ${r.action} | ${r.title} | ${kb(r.bytes)} | ${r.bodyLines} | ${r.images} | ${r.hasMath ? '有' : ''} | \`${r.cleanRel}\` | ${r.why} |`,
	),
	'',
].join('\n');

fs.writeFileSync(outFile, out, 'utf8');
console.log(`已写出 ${outFile}`);
console.log(`迁移 ${count('迁移')} / 丢弃 ${count('丢弃')}`);
