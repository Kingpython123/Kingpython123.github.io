import { getCollection, type CollectionEntry } from 'astro:content';
import { getSection, SECTIONS, sectionIdOf, type Section } from './sections';

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

/**
 * 按章节分组。
 *
 * 章节顺序取自 SECTIONS 的数组顺序（人为编排，不按字母或篇数）；
 * 未登记的目录排在已登记的之后。没有章节的顶层笔记单独作为一组返回。
 */
export async function getNotesBySection(): Promise<{
	sections: Array<{ section: Section; notes: Note[] }>;
	loose: Note[];
}> {
	const notes = await getPublishedNotes();

	const grouped = new Map<string, Note[]>();
	const loose: Note[] = [];

	for (const note of notes) {
		const id = sectionIdOf(note.id);
		if (!id) {
			loose.push(note);
			continue;
		}
		const group = grouped.get(id);
		if (group) group.push(note);
		else grouped.set(id, [note]);
	}

	const order = new Map(SECTIONS.map((s, index) => [s.id, index]));
	const sections = [...grouped.entries()]
		.sort((a, b) => (order.get(a[0]) ?? 999) - (order.get(b[0]) ?? 999))
		.map(([id, group]) => ({ section: getSection(id), notes: group }));

	return { sections, loose };
}

/** 取某个章节下的笔记，按日期倒序 */
export async function getNotesInSection(sectionId: string): Promise<Note[]> {
	const notes = await getPublishedNotes();
	return notes.filter((note) => sectionIdOf(note.id) === sectionId);
}
