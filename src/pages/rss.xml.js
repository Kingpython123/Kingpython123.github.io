import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { getPublishedNotes } from '../lib/posts';

export async function GET(context) {
	// 显式过滤草稿：getPublishedNotes 在 dev 下会放行草稿，但 RSS 任何时候都不该带上
	const notes = (await getPublishedNotes()).filter((note) => !note.data.draft);

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		// 逐字段显式映射，不用 ...note.data 整体展开。
		// @astrojs/rss 认的字段名是 pubDate，而 schema 里叫 date，
		// 展开的写法会让日期静默消失（不报错，RSS 里就是没有时间）。
		items: notes.map((note) => ({
			title: note.data.title,
			description: note.data.description ?? SITE_DESCRIPTION,
			pubDate: note.data.date,
			categories: note.data.tags,
			link: `/notes/${note.id}/`,
		})),
	});
}
