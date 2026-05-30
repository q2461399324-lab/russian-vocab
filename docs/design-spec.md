# 俄语背词 APP - 设计规范

## 配色方案

| 用途 | 颜色 | Tailwind |
|------|------|----------|
| 背景 | 浅灰 #f8fafc | `bg-slate-50` |
| 卡片 | 白色 #ffffff | `bg-white` |
| 主文字 | 深灰 #1e293b | `text-slate-800` |
| 次文字 | 中灰 #64748b | `text-slate-500` |
| 主色调 | 蓝色 #4c6ef5 | `text-blue-600` |
| 认识按钮 | 绿色 #10b981 | `bg-emerald-50 text-emerald-600` |
| 模糊按钮 | 橙色 #f59e0b | `bg-amber-50 text-amber-600` |
| 不认识按钮 | 红色 #ef4444 | `bg-red-50 text-red-600` |
| 变格常用格 | 红色标注 | `text-red-600` |
| 变格表背景 | 淡黄底 | `bg-amber-50/50` |

## 排版

- 系统字体栈：`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`
- 单词展示：text-3xl, font-bold（大而清晰）
- 释义：text-base, text-slate-600
- 按钮文字：text-sm, font-medium
- 页面标题：text-2xl, font-bold

## 布局

- 最大宽度 430px（iPhone Pro Max）
- 底部Tab高度 64px
- 安全区域适配：`safe-area-inset-*`
- 卡片圆角：rounded-2xl（16px）

## 交互

- 按钮按压：`active:scale-95` 缩放反馈
- 卡片切换：滑动或按钮触发
- 变格浮层：从底部滑入，点击遮罩关闭
- 复习翻转：点击翻转卡片
- 单手操作：核心按钮在屏幕下半部

## 图标
- 使用Emoji（📚🔄👤✅🤔❌），无需额外图标库
- App图标：蓝底+俄文字母Я的SVG
