---
title: '卷积神经网络'
date: '2026-07-13'
tags: ['深度学习', '李沐课程']
draft: true
---
## 背景

MLP的参数比较大，100个神经元有3.6B的参数，需要14G的内存

对于图像来说效率很低

图像识别有两个原则

**平移不变**

**局部**

## 从全连接层到卷积层

把输入输出变形成为矩阵，权重也做变形

![image.png](./convolutional-neural-network/image.png)

**但是这违反了原则1，平移不变性**

![image.png](./convolutional-neural-network/image-1.png)

**同样也违反了原则2，局部性**

![image.png](./convolutional-neural-network/image-2.png)

## 图像卷积

交叉相关实际上就是卷积

![image.png](./convolutional-neural-network/image-3.png)

![image.png](./convolutional-neural-network/image-4.png)

**一些具体的例子**

![image.png](./convolutional-neural-network/image-5.png)

kernel矩阵的大小是超参数

kernel矩阵的具体内容和偏移是可学习的参数

### 填充（padding）

![image.png](./convolutional-neural-network/image-6.png)

这样就会导致输出的图片很小，为了解决这个问题

我们需要做填充—在输入周围添加额外的行/列

具体的填充操作

![image.png](./convolutional-neural-network/image-7.png)

卷积kernel的大小一般是奇数

### 步幅（stride）

当输入图片比较大时，需要卷积多次，才能得到小的输出

步幅指的是行/列的滑动步长，可以增大步幅来

具体的计算

![image.png](./convolutional-neural-network/image-8.png)

stride2  相当于降了两倍高宽

QA：

![image.png](./convolutional-neural-network/image-9.png)

填充一般设置为：kernel-1

步幅一般设置为：1

kernel大小：一般取奇数

### 卷积层中的多输入和多输出通道

多输入：彩色图片有RGB三个通道

有多个输入通道时：每个通道都有一个卷积核，结果是所有的通道卷积结果的和

好处：输入通道的核可以识别并且组合输入中的模式

多输出通道

![image.png](./convolutional-neural-network/image-10.png)

这样的好处是，每一个输出通道可以识别特定的模式

### 1x1卷积层

不识别空间模式，只是一个融合通道，等价于一个全连接层

不看空间信息，只看通道信息

![image.png](./convolutional-neural-network/image-11.png)

### 卷积层的总结

![image.png](./convolutional-neural-network/image-12.png)

## 池化层

![image.png](./convolutional-neural-network/image-13.png)

### 二维最大池化

![image.png](./convolutional-neural-network/image-14.png)

用卷积的方式但是没有核，只是取最大值

### 参数设置

![image.png](./convolutional-neural-network/image-15.png)

**和卷积层一模一样，但是没有kernel这个可学习的参数**

### 平均池化层

能柔和信号

## 批量归一化层BN

### 原理

![image.png](./convolutional-neural-network/image-16.png)

**γ和β是两个可学习的参数，让均值和方差变化的小一点**

**可以加快收敛速度，但一般不会改变模型精度**

**why作用？**

它可能通过在每一个小批量里面加入噪音来控制模型复杂度，所以不要和dropout混在一起用

### 位置

![image.png](./convolutional-neural-network/image-17.png)

## Le-Net

### 架构

![image.png](./convolutional-neural-network/image-18.png)

用卷积层学习空间信息，用全连接层转换类别空间

### QA

1：时序可以用卷积

2：大的图片不能用MLP

![image.png](./convolutional-neural-network/image-19.png)

输出通道等价于匹配的模式数

![image.png](./convolutional-neural-network/image-20.png)

一般用max

![image.png](./convolutional-neural-network/image-21.png)

3d是视频，医学图片之类的

2d是图片

![image.png](./convolutional-neural-network/image-22.png)

会overfitting

## Alex-Net

### 架构

![image.png](./convolutional-neural-network/image-23.png)

![image.png](./convolutional-neural-network/image-24.png)

![image.png](./convolutional-neural-network/image-25.png)

![image.png](./convolutional-neural-network/image-26.png)

### QA

![image.png](./convolutional-neural-network/image-27.png)

很正常

![image.png](./convolutional-neural-network/image-28.png)

保证高宽比，然后扣几块出来

## VGG

### 背景

![image.png](./convolutional-neural-network/image-29.png)

### 架构

#### VGG块

3x3卷积层深但窄，这个效果更好

![image.png](./convolutional-neural-network/image-30.png)

![image.png](./convolutional-neural-network/image-31.png)

#### VGG架构

多个全连接层后接全连接层就是VGG的架构

### QA

![image.png](./convolutional-neural-network/image-32.png)

1：代码写错

2：过拟合

## NIN

### 背景

![image.png](./convolutional-neural-network/image-33.png)

### NIN块

![image.png](./convolutional-neural-network/image-34.png)

### 架构

![image.png](./convolutional-neural-network/image-35.png)

**最大池化层就是把高宽减半**

总结：

使用全局平均池化层来替代全连接层

## GoogLeNet

### inception块

通过填充来改变通道数

![image.png](./convolutional-neural-network/image-36.png)

计算复杂度

![image.png](./convolutional-neural-network/image-37.png)

### 架构

![image.png](./convolutional-neural-network/image-38.png)

和NIN很像

#### stage1&2

![image.png](./convolutional-neural-network/image-39.png)

#### stage3

![image.png](./convolutional-neural-network/image-40.png)

#### stage4&5

![image.png](./convolutional-neural-network/image-41.png)

### 后续变种

![image.png](./convolutional-neural-network/image-42.png)

### QA

1：通道数不一样是1x1卷积输出的通道数造成的

2：3x3，5x5卷积也能降通道数，为什么要用1x1去降低呢？

因为卷积计算贵

3：超参数最好设置2^n次方，这样计算快

4：最好去用经典网络，不要去改代码

5：3x3 改成1x3加上3x1的好处是可以降低计算量，坏处是效果降低

6：liner是全连接层，但是flatten是把4D变成2D，把批量大小保持住

## ResNet

### 背景

![image.png](./convolutional-neural-network/image-43.png)

### 残差块

![image.png](./convolutional-neural-network/image-44.png)

#### 实现细节

右边是通道数改变的情况

**用了1x1的卷积之后以后会把高宽同时减半然后通道数加倍**

![image.png](./convolutional-neural-network/image-45.png)

### 架构（like VGG&GoogleNet）

### QA

![image.png](./convolutional-neural-network/image-46.png)

在训练的时候要是发现g（x）训练不动，就会把g(x)的梯度和权重置为0，这样不会影响模型的性能

![image.png](./convolutional-neural-network/image-47.png)

cos学习率挺好的

### residual 怎么处理梯度消失

我们的目标是不要让梯度变的很小，所以我们把乘法换成加法-回到数值稳定性那一章

![image.png](./convolutional-neural-network/image-48.png)
