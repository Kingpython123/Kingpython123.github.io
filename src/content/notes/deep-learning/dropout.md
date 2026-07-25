---
title: 'Dropout'
date: '2026-07-08'
tags: ['深度学习', '李沐课程']
draft: true
---
![image.png](./dropout/image.png)

![image.png](./dropout/image-1.png)

![image.png](./dropout/image-2.png)

最后期望是不变的

## 训练的用法

在全连接层去用

![image.png](./dropout/image-3.png)

## 推理的用法

dropout实质上是一个正则项，只在训练的时候用，所以推理的时候不用，直接返回输出

这样能保证确定性的输出
