---
title: 'uv 包管理器'
date: '2026-07-25'
tags: ['工具', 'Python']
draft: false
---
uv等价于

“建虚拟环境" + "装包（替代 pip）" + "锁版本”

## 安装

```jsx
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

```

## 常见的命令

```jsx
uv venv 
```

创建虚拟环境

```jsx
uv sync
```

自动在项目目录下建一个虚拟环境（一般是 .venv 文件夹）
严格按照 uv.lock 里锁定的版本号，把所有依赖（pytest、torch、regex、numpy 等等）都装进这个虚拟环境

```jsx
uv.lock
```

锁死每一个包的版本号
