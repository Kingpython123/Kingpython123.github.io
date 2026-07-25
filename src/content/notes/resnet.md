---
title: 'ResNet 论文精读'
date: '2026-07-06'
tags: ['论文精读', 'CV']
draft: true
---
## ReLu

是一个激活层

## residual connect

### 残差连接处理输入输出不同的情况

1：输入输出添加额外的0
2：投影

## 颜色增强

用RGB做颜色增强

## dropout

没有用全连接层，所以没有用dropout

## FLOPs

卷积层的浮点运算等价于：输入的高x宽x通道数x输出的通道数x窗口的高和宽
