import katex from 'katex';

/**
 * 把 Sätteri 解析出的 math / inlineMath 节点在构建时渲染成 KaTeX 的 HTML。
 *
 * Sätteri 的 math 特性只负责「解析」，把 $...$ 和 $$...$$ 变成 AST 节点，
 * 渲染需要自己接。这里返回 { raw, mdxExpressions: false }：Sätteri 文档指明
 * 注入 KaTeX 这类含花括号的生成 HTML 时必须关掉 mdxExpressions，
 * 否则在 .mdx 文件里 {} 会被当成 JS 表达式求值。
 *
 * 公式在构建时就变成静态 HTML + MathML，浏览器端零 JS。
 *
 * @param {import('katex').KatexOptions} [userOptions]
 */
export function satteriKatex(userOptions = {}) {
	// 传工厂而非定义对象，这样每篇文档拿到独立的插件实例，
	// 文档内用 \gdef 定义的宏不会泄漏到下一篇。
	return () => {
		/** @param {{ value?: string }} node */
		const render = (node, ctx, displayMode) => {
			const source = node.value ?? '';

			try {
				const html = katex.renderToString(source, {
					...userOptions,
					displayMode,
					// 出错时抛出，由下面接住并降级，而不是把红色报错直接印在页面上
					throwOnError: true,
					// 同时输出 HTML 和 MathML，屏幕阅读器能正确朗读公式
					output: 'htmlAndMathml',
					// 迁移过来的笔记里难免有非标准写法，别为此刷屏
					strict: 'ignore',
				});

				// 注意：公式需要排除出 Pagefind 索引（否则同一条公式会被抓三遍——
				// 可见字形、MathML 文本、<annotation> 里的 LaTeX 原文），
				// 但这件事不在这里做。实测往这段 HTML 里插 data-pagefind-ignore
				// 无效：Sätteri 把 { raw } 字符串重新解析时会丢掉无值属性。
				// 所以改在 package.json 的 postbuild 里用 pagefind --exclude-selectors 处理。
				return { raw: html, mdxExpressions: false };
			} catch (error) {
				// 不让一条写错的公式炸掉整个构建，降级成等宽原文。
				// 注意：实测 Astro 7.1.3 不会把 Sätteri 的 diagnostics 打到构建日志里，
				// 所以下面这条 report 目前只是留给未来（或自行调用 Sätteri 时）用的；
				// 真正能看见的信号是页面上那段带底色的 .math-error 原文。
				ctx.report({
					message: `KaTeX 渲染失败：${error instanceof Error ? error.message : String(error)}`,
					node,
					severity: 'warning',
				});
				const escaped = source
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;');
				return {
					raw: `<code class="math-error" title="KaTeX 渲染失败">${escaped}</code>`,
					mdxExpressions: false,
				};
			}
		};

		return {
			name: 'satteri-katex',
			math: (node, ctx) => render(node, ctx, true),
			inlineMath: (node, ctx) => render(node, ctx, false),
		};
	};
}
