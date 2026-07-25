import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * 日期一律写成 YYYY-MM-DD，并按 UTC 零点解析。
 *
 * 不用 z.coerce.date() 是因为它什么都收：'Jul 08 2022' 也能过，但那种写法会按
 * 运行机器的本地时区解析。本地是 +08、CI 是 UTC，同一篇文章渲染出的日期会差一天
 * （FormattedDate 用 getUTC* 取值）。这里写死格式，写错就构建失败，
 * 比上线后发现日期少一天要好。
 */
const isoDate = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, '日期必须写成 YYYY-MM-DD，例如 2026-07-25')
	.transform((value) => new Date(`${value}T00:00:00Z`));

const notes = defineCollection({
	loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string().min(1),
		date: isoDate,
		// 内容有实质修订时再填，纯错别字不必
		updated: isoDate.optional(),
		// 选填。用于列表页摘要、meta description 和 RSS；留空则回落到站点默认描述
		description: z.string().optional(),
		// 暂不做白名单校验，先自由填。等标签页做出来能看到词频，
		// 届时若发现「机器学习 / ML」这类漂移再收紧。
		tags: z.array(z.string().min(1)).default([]),
		// true 时本地 dev 可预览，生产构建完全不生成页面
		draft: z.boolean().default(false),
	}),
});

export const collections = { notes };
