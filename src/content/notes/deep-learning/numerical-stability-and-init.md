---
title: '数值的稳定性+模型初始化和激活函数'
date: '2026-07-10'
tags: ['深度学习', '李沐课程']
draft: true
---
![image.png](./numerical-stability-and-init/image.png)

中间向量对向量的导数实际上是在做矩阵乘法

## 数值稳定性的两个问题

当数值太大或者太小的时候会导致数值问题

### 梯度爆炸

![image.png](./numerical-stability-and-init/image-1.png)

### 梯度消失

![image.png](./numerical-stability-and-init/image-2.png)

## how to 让训练更加稳定

![image.png](./numerical-stability-and-init/image-3.png)

### 权重初始化

让每一层的方差是一个常数
将每层的输出和梯度都看做是随机变量，让他们的均值和方差都保持一致

![image.png](./numerical-stability-and-init/image-4.png)

我们不希望太小或者太大

![image.png](./numerical-stability-and-init/image-5.png)

![image.png](./numerical-stability-and-init/image-6.png)

***其实没太看懂***

### 激活函数

![image.png](./numerical-stability-and-init/image-7.png)

这个其实挺好看懂的

**所以就需要激活函数是它本身 y=x**

![image.png](./numerical-stability-and-init/image-8.png)

在零点附近，tanh和relu都满足y=x

但是sigmoid不满足，所以需要做调整

![image.png](./numerical-stability-and-init/image-9.png)
