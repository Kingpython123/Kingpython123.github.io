---
title: 'AI Infra'
date: '2026-05-19'
tags: ['AI Infra']
draft: true
---
[Scaling Laws for Neural Language Models](/notes/scaling-laws/)

Scaling Law 揭示了模型性能与模型规模、数据量及计算资源之间存在着可预测的幂律关系。Chinchilla 定律则在此基础上进行了关键修正，指出在固定计算预算下，模型与数据规模的同等扩展才是最优资源分配策略。Emergence Abilities 描述了当模型规模突破某个临界点后，性能会大幅提升的现象。这两大定律共同构成了当前我们理解和构建大模型的基础：前者指导我们如何高效地分配有限资源以达到最佳性能，后者则揭示了通往更强人工智能的道路上充满着未知的可能性与惊喜。

1：ai cluster

一个模型的参数，本质上就是它在训练过程中学习到的所有权重（weights）和偏置（biases）的总和。

[aicluster](/notes/ai-cluster/)
