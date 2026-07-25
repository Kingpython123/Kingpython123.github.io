---
title: '公式渲染测试'
description: '验证 KaTeX 在构建时的渲染效果，确认无误后可以删掉这篇。'
pubDate: '2026-07-25'
---

这是一篇临时的验证文章，确认公式管线正常后可以直接删除。

## 行内公式

设注意力头数为 $h$，模型维度为 $d_{\text{model}}$，则每个头的维度是 $d_k = d_{\text{model}} / h$。当 $h = 8$、$d_{\text{model}} = 512$ 时 $d_k = 64$。

行内公式不应该影响行高，这一段里混着 $\alpha$、$\sum_{i=1}^{n} x_i$ 和 $\mathcal{O}(n \log n)$，行距应当保持均匀。

## 行间公式

缩放点积注意力：

$$
\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right) V
$$

多行对齐环境：

$$
\begin{aligned}
\nabla_\theta \mathcal{L}(\theta) &= \nabla_\theta \left[ -\frac{1}{N} \sum_{i=1}^{N} \log p_\theta(y_i \mid x_i) \right] \\
&= -\frac{1}{N} \sum_{i=1}^{N} \nabla_\theta \log p_\theta(y_i \mid x_i)
\end{aligned}
$$

矩阵和分段函数：

$$
W = \begin{bmatrix} w_{11} & \cdots & w_{1n} \\ \vdots & \ddots & \vdots \\ w_{m1} & \cdots & w_{mn} \end{bmatrix}
\qquad
\text{ReLU}(x) = \begin{cases} x & x > 0 \\ 0 & x \le 0 \end{cases}
$$

一条很长的公式，用来检查窄屏下是否横向滚动而不是撑破版面：

$$
p(x_1, \dots, x_T) = \prod_{t=1}^{T} p(x_t \mid x_{<t}) = \prod_{t=1}^{T} \frac{\exp(z_{t, x_t})}{\sum_{v \in \mathcal{V}} \exp(z_{t, v})} \quad \text{where} \quad z_t = W_o \, \text{LayerNorm}(h_t) + b_o
$$

## 与代码块共存

公式和代码块的字体、字号应当各自独立：

```python
d_k = d_model // n_heads
scores = (q @ k.transpose(-2, -1)) / math.sqrt(d_k)
```

## 错误降级

下面这条公式故意写错（`\frac` 缺参数），应当降级成带颜色的等宽原文，并在构建日志里出现一条 warning，但构建仍然成功：

$$
\frac{1}
$$
