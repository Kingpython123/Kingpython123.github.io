import { getCollection, type CollectionEntry } from 'astro:content';

export type Note = CollectionEntry<'notes'>;

/**
 * 取笔记列表，按日期倒序。
 *
 * 草稿只在本地 dev 可见，生产构建里连页面都不生成。
 *
 * 所有消费点（首页、/notes 列表、[...slug] 的 getStaticPaths、RSS）都必须走这里，
 * 不要各自调 getCollection。漏一处就会泄漏草稿，其中 getStaticPaths 漏了最严重——
 * 页面会直接可访问，只是没有入口链接。
 */
export async function getPublishedNotes(): Promise<Note[]> {
	const notes = await getCollection('notes', ({ data }) =>
		import.meta.env.PROD ? !data.draft : true,
	);

	return notes.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** 按年份分组，用于列表页；返回的年份已倒序 */
export function groupByYear(notes: Note[]): Array<[number, Note[]]> {
	const byYear = new Map<number, Note[]>();

	for (const note of notes) {
		const year = note.data.date.getUTCFullYear();
		const group = byYear.get(year);
		if (group) {
			group.push(note);
		} else {
			byYear.set(year, [note]);
		}
	}

	return [...byYear.entries()].sort((a, b) => b[0] - a[0]);
}
