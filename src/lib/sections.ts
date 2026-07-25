/**
 * 章节定义，对应 Notion 里的父页面。
 *
 * 目录结构即层级：src/content/notes/<section>/<slug>.md 对应 /notes/<section>/<slug>/。
 * 这里只补充目录名之外的信息——中文显示名、一句话说明、排列顺序。
 *
 * 新增章节：在这里加一条，再把 md 文件放进对应目录即可。
 * 未登记的目录会以目录名本身作为显示名，不会报错，只是不好看。
 */
export interface Section {
	id: string;
	name: string;
	description?: string;
}

/** 数组顺序决定页面上的展示顺序（不按字母，也不按篇数） */
export const SECTIONS: Section[] = [
	{
		id: 'cs336',
		name: 'CS336',
		description: 'Stanford CS336，从零实现语言模型',
	},
	{
		id: 'deep-learning',
		name: '深度学习',
		description: '跟李沐《动手学深度学习》的课程笔记',
	},
	{
		id: 'paper-reading',
		name: '论文精读',
		description: '论文阅读记录，以及读论文这件事本身的方法',
	},
	{
		id: 'ai-infra',
		name: 'AI Infra',
		description: 'Scaling Law、集群与训练基础设施',
	},
	{
		id: 'kaggle',
		name: 'Kaggle',
		description: '比赛记录',
	},
];

const BY_ID = new Map(SECTIONS.map((s) => [s.id, s]));

/** 从笔记 id（形如 `cs336/assignment-1`）里取出章节 id；顶层笔记返回 null */
export function sectionIdOf(noteId: string): string | null {
	const parts = noteId.split('/');
	return parts.length > 1 ? parts[0] : null;
}

/** 取章节元信息。未登记的目录退化成用目录名当显示名，不抛错 */
export function getSection(id: string): Section {
	return BY_ID.get(id) ?? { id, name: id };
}
