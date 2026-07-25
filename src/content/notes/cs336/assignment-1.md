---
title: 'Assignment 1'
date: '2026-07-23'
tags: ['CS336']
draft: true
---
整个作业的任务可以大致分成四个阶段

**阶段 1:BPE Tokenizer**

**阶段 2:Transformer 架构组件**

**阶段 3:训练相关工具**

**阶段 4:训练脚本 + 实验** 

## BPE Tokenizer

Byte Pair Encoding

### 背景

现在切词有三种切法，一种是字节（byte）另一种是字符（character），还有一种是词级（word-level）

#### 词级

如果按字符切会有一个问题，词级的表太大了，而且会有OOV（out-of-vocabulary）问题，即看到不会的词就不懂了。好处是序列端，attention的计算量小

#### 字符级

词表极小,永远不会遇到没见过的字符,但序列长得离谱,计算代价爆炸

#### 字节级

一个 Unicode 字符在 UTF-8 编码下可能占 1 到 4 个字节。英文字母是 1 字节,但中文字符、emoji 等往往是 2-4 字节。字节的取值范围是固定的 0-255,一共只有 256 种可能

### 算法

给定一份初始语料

先做预分词，用一个规则(通常基于正则表达式)把原始文本切成一个个"预分词单元"(pre-token),比如把 "Hello, world!" 切成 ["Hello", ",", " world", "!"] 这样的片段。

之后

#### 初始状态

把语料中每一段文本都表示成字节序列,每个字节自己就是一个 token,词表初始只有这 256 个字节。

#### 核心循环

1. **统计 pair 频次**
    
    在当前语料的所有 token 序列里，遍历并统计所有“相邻 token 对”(pair) 的出现次数（如 \[t, h, e\] 产生 (t,h)、(h,e)）。
    
2. **选出最高频 pair**
    
    在统计结果中找到出现频率最高的那个 pair（若并列，按预设规则决定取哪个，例如先出现者/字典序等）。
    
3. **生成新 token 并记录合并规则**
    
    将该 pair 合并成一个新 token（例如把 A+B 合成 AB），把新 token 加入词表，同时记录本轮 merge 规则：`(A, B) -> AB`。
    
4. **全语料替换更新**
    
    在整个语料的 token 序列中，把所有出现该 pair 的相邻位置都替换为合并后的新 token，得到更新后的 token 序列集合。
    
5. **循环直到满足停止条件**
    
    回到第 1 步，在新状态下重新统计 pair 频次并继续合并，直到达到目标词表大小/合并次数上限/或没有可合并 pair 为止（如词表达到 10000）。
    

训练结束后,会得到两个东西:

**vocab**:一个从 token ID 到字节串的映射(最终词表)
**merges**:一个有序列表,记录了训练过程中依次发生的合并规则(哪两个 token 合并、合并了多少次、按什么顺序)

special token（比如 <|endoftext|>,用来标记一篇文档的结尾） 单独处理,不参与字节级的合并统计

#### encoder

有了 vocab 和 merges 之后,给一段新文本做 tokenize(变成 token ID 序列)的过程是

1. **按 special tokens 扫描并切段**
    - **输入**：原始字符串 `text`，special token 列表（如 `["<|endoftext|>", ...]`）
    - **做法**：在字符串里把 special token 作为“不可再分”的整体找出来，把文本切成交替片段：`[(is_special, chunk_str), ...]`
    - **输出**：片段序列。
        - special 片段：后面直接查表变 ID
        - normal 片段：进入后续预分词/BPE
2. **对每段 normal 文本做预分词（pre-tokenize）**
    - **输入**：normal `chunk_str`，预分词规则/正则（例如 GPT-2 那种把空格、字母、数字、标点分开）
    - **做法**：`pre_tokens = regex_findall(chunk_str)`
    - **输出**：预分词单元列表 `["Hello", ",", " world", "!"]`
    （注意这里经常会**保留前导空格**，比如 `" world"`）
3. **把每个 pre-token 转成字节序列（UTF-8 bytes）**
    - **输入**：单个 `pre_token` 字符串
    - **做法**：
        1. `b = utf8_encode(pre_token)` 得到 bytes（0-255）
        2. 初始化 token 序列：`tokens = [byte0, byte1, ...]`
        （实现里 tokens 常表示为“字节串片段”，初始每个 token 就是单字节）
    - **输出**：初始 token 序列（按字节）
4. **按 merges 顺序做 BPE 合并（核心循环）**
    - **输入**：当前 token 序列 `tokens`，训练得到的有序 merges 列表 `merges = [(A,B)->AB, ...]`
    - **做法（直观版）**：
        - 对 merges 从前到后遍历：对每条规则 `(A,B)->AB`
        在 `tokens` 里查找所有相邻对等于 `(A,B)` 的位置，出现就合并成 `AB`（一次 sweep 合并完所有可合并位置）
        - 重复这一轮遍历，直到整轮下来没有任何合并发生（或你实现为“每条 merge 只做一次全局替换”，很多实现其实一遍 merges 就够，因为 merges 本身已按训练顺序定义了合并层级；但为了保险/易懂可以写成“直到不再变化”）
    - **输出**：合并后的 tokens（每个 token 现在可能是多字节的字节串）
5. **用 vocab 反查把 token（字节串）映射到 token ID**
    - **输入**：最终 tokens（字节串序列），`vocab: token_bytes -> id`（或 id->bytes 的反向表）
    - **做法**：`ids = [vocab[token_bytes] for token_bytes in tokens]`
    - **输出**：该 pre-token 的 token ID 序列
6. **拼回整段结果（含 special tokens）**
    - **输入**：片段序列 `[(is_special, ...)]`
    - **做法**：
        - special chunk：直接 `ids += [special_to_id[chunk]]`
        - normal chunk：把其所有 pre-token 的 ids 依次拼接进来
    - **输出**：整段文本最终的 `token_ids`

优化：

给每条 merge 规则一个"优先级"(rank),用 rank 而不是重新扫描列表。

训练完成后,merges 列表本身自带顺序,直接把这个顺序转成一个字典:pair → rank(第几个被合并出来的,数字越小优先级越高)。

**相当与把列表查找变成了字典查找**

### 代码

#### 要求

```python
def run_train_bpe(
    input_path: str | os.PathLike,
    vocab_size: int,
    special_tokens: list[str],
    **kwargs,
) -> tuple[dict[int, bytes], list[tuple[bytes, bytes]]]:
    """Given the path to an input corpus, run train a BPE tokenizer and
    output its vocabulary and merges.

    Args:
        input_path (str | os.PathLike): Path to BPE tokenizer training data.
        vocab_size (int): Total number of items in the tokenizer's vocabulary (including special tokens).
        special_tokens (list[str]): A list of string special tokens to be added to the tokenizer vocabulary.
            These strings will never be split into multiple tokens, and will always be
            kept as a single token. If these special tokens occur in the `input_path`,
            they are treated as any other string.

    Returns:
        tuple[dict[int, bytes], list[tuple[bytes, bytes]]]:
            vocab:
                The trained tokenizer vocabulary, a mapping from int (token ID in the vocabulary)
                to bytes (token bytes)
            merges:
                BPE merges. Each list item is a tuple of bytes (<token1>, <token2>),
                representing that <token1> was merged with <token2>.
                Merges are ordered by order of creation.
    """
```

给定一个语料库输入，输出vocab和merges

[train_bpe.py](/files/cs336/assignment-1/train-bpe.py)

#### 要求

```python
def get_tokenizer(
    vocab: dict[int, bytes],
    merges: list[tuple[bytes, bytes]],
    special_tokens: list[str] | None = None,
) -> Any:
    """Given a vocabulary, a list of merges, and a list of special tokens,
    return a BPE tokenizer that uses the provided vocab, merges, and special tokens.

    Args:
        vocab (dict[int, bytes]): The tokenizer vocabulary, a mapping from int (token ID in the vocabulary)
            to bytes (token bytes)
        merges (list[tuple[bytes, bytes]]): BPE merges. Each list item is a tuple of bytes (<token1>, <token2>),
            representing that <token1> was merged with <token2>.
            Merges are ordered by order of creation.
        special_tokens (list[str] | None): A list of string special tokens for the tokenizer. These strings will never
            be split into multiple tokens, and will always be kept as a single token.

    Returns:
        A BPE tokenizer that uses the provided vocab, merges, and special tokens.
    """
```

给定vocab，merges和special token

输出一个Tokenize，可以用vocab，merge把任意新文本转成 token id 序列，也能反过来把 id 序列还原成文本。
