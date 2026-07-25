// @ts-check

import { satteri } from '@astrojs/markdown-satteri';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

import { satteriKatex } from './src/plugins/satteri-katex.mjs';

// https://astro.build/config
export default defineConfig({
	// 仓库名匹配 <username>.github.io，因此不需要配置 base
	site: 'https://kingpython123.github.io',

	integrations: [mdx(), sitemap()],

	markdown: {
		// Astro 7 的默认 Markdown 管线是 Sätteri（不是 remark/rehype），
		// 所以数学公式走它的 math 解析特性 + 自写的 KaTeX 渲染插件，
		// 不需要换成 unified，也就不用引入整套 remark 生态。
		// mdx() 默认继承这份配置，.mdx 文件同样生效。
		processor: satteri({
			features: {
				// $$...$$ 行间公式，$...$ 行内公式
				math: { singleDollarTextMath: true },
			},
			mdastPlugins: [satteriKatex()],
		}),
	},

	fonts: [
		{
			// Astro 在构建时下载并自托管字体文件，运行时不请求 Google
			provider: fontProviders.google(),
			name: 'Source Serif 4',
			cssVariable: '--font-source-serif',
			// 只取正文和小标题两档字重，斜体用于强调和术语
			weights: [400, 600],
			styles: ['normal', 'italic'],
			fallbacks: ['Georgia', 'serif'],
		},
	],

	vite: {
		plugins: [tailwindcss()],
	},
});
