"""BPE tokenizer training (最简写法版本)。

本文件刻意只用最基础的 Python 语法: 普通 for 循环、if 判断、list、dict。
不使用推导式、lambda、zip、enumerate、Counter 等简写工具, 方便逐行理解。

核心数据结构:
- words:  list[list[bytes]]   每个元素是一个 pre-token(预分词单元), 内容是字节 token 的列表
                              例如 "low" -> [b'l', b'o', b'w']
- counts: list[int]           counts[i] 是 words[i] 在语料里出现的次数
                              words 和 counts 下标一一对应
- vocab:  dict[int, bytes]    词表, token id -> 字节串
- merges: list[tuple]         按创建顺序记录的合并规则
"""

import os

import regex as re

# GPT-2 的预分词正则(来自 assignment 文档)。
# 它把文本切成: 常见缩写('s 'll 've 're 't 'd 'm)、带前导空格的字母串、
# 带前导空格的数字串、带前导空格的符号串、以及各种空白。
PAT = r"""'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+"""


def _pretokenize(text, special_tokens):
    """把一段文本预分词, 返回 dict: pre-token(字节 tuple) -> 出现次数。

    特殊 token 会先把文本切开, 这样后续的合并不会跨越特殊 token 边界,
    并且特殊 token 本身不参与统计(它们已经作为整体加入词表)。
    """
    counts = {}

    # ---- 用特殊 token 把文本切成若干段 ----
    if special_tokens:
        # 按长度从大到小排序, 保证像 "<|eot|><|eot|>" 这种更长的 token 优先匹配。
        sorted_specials = sorted(special_tokens, key=len, reverse=True)

        # 把每个特殊 token 转义后收进一个列表, 再用 | 连成 "a|b|c" 形式的正则。
        escaped_specials = []
        for tok in sorted_specials:
            escaped_specials.append(re.escape(tok))
        split_pat = "|".join(escaped_specials)

        segments = re.split(split_pat, text)
    else:
        segments = [text]

    # ---- 对每一段(不含特殊 token)做 GPT-2 正则预分词 ----
    for segment in segments:
        for match in re.finditer(PAT, segment):
            piece = match.group()

            # 把 pre-token 编码成 UTF-8 字节, 再拆成"单字节 token"的列表。
            byte_list = []
            for b in piece.encode("utf-8"):
                byte_list.append(bytes([b]))

            # 转成 tuple 才能当字典的键(list 不能当键, 因为它是可变的)。
            token = tuple(byte_list)

            # 查字典累加: 没见过就从 0 开始。
            if token in counts:
                counts[token] = counts[token] + 1
            else:
                counts[token] = 1

    return counts


def _find_best_pair(pair_counts):
    """在 pair_counts 里找出最该合并的 pair。

    规则: 频率最高; 频率相同时取字典序更大的 pair。
    如果没有任何有效 pair(频率都 <= 0), 返回 None。
    """
    best_pair = None
    best_count = 0

    for pair in pair_counts:
        count = pair_counts[pair]

        # 频率 <= 0 的是"已经失效"的残留记录, 跳过。
        if count <= 0:
            continue

        if best_pair is None:
            best_pair = pair
            best_count = count
        elif count > best_count:
            best_pair = pair
            best_count = count
        elif count == best_count and pair > best_pair:
            # bytes 之间的比较就是字典序, tuple 会逐个元素比较。
            best_pair = pair
            best_count = count

    return best_pair


def _remove_word_pairs(word, word_index, word_count, pair_counts, pair_to_words):
    """把一个 word 当前贡献的所有相邻 pair 从统计里扣掉。"""
    i = 0
    while i < len(word) - 1:
        pair = (word[i], word[i + 1])

        pair_counts[pair] = pair_counts[pair] - word_count

        if pair in pair_to_words:
            pair_to_words[pair].discard(word_index)

        i = i + 1


def _add_word_pairs(word, word_index, word_count, pair_counts, pair_to_words):
    """把一个 word 贡献的所有相邻 pair 加进统计。"""
    i = 0
    while i < len(word) - 1:
        pair = (word[i], word[i + 1])

        if pair in pair_counts:
            pair_counts[pair] = pair_counts[pair] + word_count
        else:
            pair_counts[pair] = word_count

        if pair not in pair_to_words:
            pair_to_words[pair] = set()
        pair_to_words[pair].add(word_index)

        i = i + 1


def _merge_in_word(word, pair, new_token):
    """在单个 word 内把所有出现的 pair 合并成 new_token, 返回新的 word 列表。"""
    new_word = []
    i = 0
    while i < len(word):
        # 当前位置和下一个正好构成要合并的 pair, 就合并成一个 token。
        if i < len(word) - 1 and word[i] == pair[0] and word[i + 1] == pair[1]:
            new_word.append(new_token)
            i = i + 2
        else:
            new_word.append(word[i])
            i = i + 1
    return new_word


def train_bpe(input_path, vocab_size, special_tokens):
    """训练一个字节级 BPE tokenizer, 返回 (vocab, merges)。

    性能关键: 每次合并后不重新扫描全部数据。我们额外维护
      - pair_counts:   pair -> 当前的加权总频率
      - pair_to_words: pair -> 含有该 pair 的 word 下标集合
    这样每轮只需要更新"含有被合并 pair"的那几个 word。
    """
    # ---- 第一步: 初始化词表 ----
    # 先放 256 个单字节, 再把特殊 token 追加在后面。
    vocab = {}
    for i in range(256):
        vocab[i] = bytes([i])
    for tok in special_tokens:
        vocab[len(vocab)] = tok.encode("utf-8")

    # ---- 第二步: 读文件, 预分词, 拆成两个并行列表 ----
    with open(input_path, encoding="utf-8") as f:
        text = f.read()

    counter = _pretokenize(text, special_tokens)

    # words[i] 是可修改的 list, counts[i] 是它出现的次数。
    words = []
    counts = []
    for word_tuple in counter:
        words.append(list(word_tuple))
        counts.append(counter[word_tuple])

    # ---- 第三步: 建立初始索引 ----
    pair_counts = {}
    pair_to_words = {}
    i = 0
    while i < len(words):
        _add_word_pairs(words[i], i, counts[i], pair_counts, pair_to_words)
        i = i + 1

    # ---- 第四步: 反复合并, 直到词表达到目标大小 ----
    merges = []
    num_merges = vocab_size - len(vocab)

    merge_round = 0
    while merge_round < num_merges:
        best_pair = _find_best_pair(pair_counts)
        if best_pair is None:
            break

        # 记录这次合并, 并把合并出的新 token 加入词表。
        new_token = best_pair[0] + best_pair[1]
        merges.append(best_pair)
        vocab[len(vocab)] = new_token

        # 只处理含有 best_pair 的 word。
        # 先拷成 list, 因为下面的循环会改动 pair_to_words 里的集合。
        if best_pair in pair_to_words:
            affected = list(pair_to_words[best_pair])
        else:
            affected = []

        for word_index in affected:
            old_word = words[word_index]
            word_count = counts[word_index]

            # 1) 扣掉这个 word 现在贡献的所有 pair
            _remove_word_pairs(old_word, word_index, word_count, pair_counts, pair_to_words)

            # 2) 在这个 word 内合并 best_pair
            new_word = _merge_in_word(old_word, best_pair, new_token)
            words[word_index] = new_word

            # 3) 加回新 word 贡献的所有 pair
            _add_word_pairs(new_word, word_index, word_count, pair_counts, pair_to_words)

        # best_pair 已经在所有 word 里被消灭, 清理它的残留记录。
        if best_pair in pair_counts:
            del pair_counts[best_pair]
        if best_pair in pair_to_words:
            del pair_to_words[best_pair]

        merge_round = merge_round + 1

    return vocab, merges
