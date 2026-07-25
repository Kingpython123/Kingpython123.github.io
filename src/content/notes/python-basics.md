---
title: 'Python 基础'
date: '2026-07-25'
tags: ['Python', 'CS336']
draft: true
---
## 函数

def定义一个函数，括号里面是输入

->是输出

```python
def train_bpe(
    input_path: str | os.PathLike,
    vocab_size: int,
    special_tokens: list[str],
) -> tuple[dict[int, bytes], list[tuple[bytes, bytes]]]:
```

输入有三个：

输出两个：

## class

是一个把数据和函数打包在一起的类

可以用这个类来造出具体的对象（实例）

```jsx
## 1. 训练(只做一次, 结果可以存下来复用)
vocab, merges = train_bpe("语料.txt", vocab_size=10000, special_tokens=["<|endoftext|>"])

## 2. 构造 tokenizer 实例
tok = Tokenizer(vocab, merges, ["<|endoftext|>"])

## 3. 编码: 文本 -> 数字, 用来训练/推理
ids = tok.encode("Once upon a time")     # [45, 288, 102, ...]

## 4. 解码: 数字 -> 文本, 用来看模型输出
text = tok.decode([45, 288, 102])        # "Once upon a time"

```

## dict

字典

由键和值组成

{}

## tuple

元组

()

不可变

## list

列表

[]
