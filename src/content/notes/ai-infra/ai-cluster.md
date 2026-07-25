---
title: 'AI Cluster'
date: '2026-05-19'
tags: ['AI Infra']
draft: false
---
参数量分析
一个模型的参数，本质上就是它在训练过程中学习到的所有权重（weights）和偏置（biases）的总和。

vocab_size == 一共有多少个词汇；dim == 每个词用多少个数字表示

embedding本质上是一个（vocab_size，dim）的表

lookup  相当于是根据索引去取embedding表里面的层
