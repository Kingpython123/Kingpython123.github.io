// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// 仓库名匹配 <username>.github.io，因此不需要配置 base
	site: 'https://kingpython123.github.io',

	integrations: [mdx(), sitemap()],

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
