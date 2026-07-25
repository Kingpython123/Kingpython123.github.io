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
		shikiConfig: {
			// 用 themes + defaultColor: false，Shiki 会把配色输出成 CSS 变量
			// （--shiki-light 之类）而不是写死的内联 color/background-color。
			// 好处是背景色由我们自己的 CSS 决定，不必用 !important 去盖内联样式。
			// 将来要加暗色模式，这里补一个 dark 主题、CSS 里加一条媒体查询即可。
			themes: { light: 'github-light' },
			defaultColor: false,
			// 代码不折行，长行横向滚动；折行会打断缩进结构，反而更难读
			wrap: false,
		},

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
