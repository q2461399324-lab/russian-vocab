# 俄语背词 - Claude 工作指引

## 项目概述
面向俄罗斯留学场景的个人俄语单词学习PWA，专注高频词变格/变位实用记忆。
纯本地运行，零服务器成本，iPhone Safari添加到主屏幕使用。

## 文档索引

| 文档 | 路径 | 说明 |
|------|------|------|
| 需求文档 | [docs/requirements.md](docs/requirements.md) | 完整用户需求与功能定义 |
| 技术规范 | [docs/tech-spec.md](docs/tech-spec.md) | 技术栈、数据库设计、项目结构 |
| 设计规范 | [docs/design-spec.md](docs/design-spec.md) | 配色、排版、布局、交互规范 |
| 执行计划 | [docs/execution-plan.md](docs/execution-plan.md) | 分阶段执行清单 |

## 开发日志
- 目录：[devlogs/](devlogs/)
- 每次开发会话结束后自动记录完成事项和待办
- 文件命名：`YYYY-MM-DD.md`

## 技术要点

### 命令
- 开发服务器：`npx vite --host 0.0.0.0 --port 5173`
- 构建生产版：`npx vite build`
- 类型检查：`npx tsc --noEmit`
- 运行脚本：`npx tsx scripts/xxx.ts`

### 注意事项
1. 数据库版本变更时需更新 `database.ts` 中的 version 号
2. 词库 JSON 超过 2MB，PWA 配置中已调大缓存限制
3. iOS Safari PWA 需在 `<head>` 中有 `apple-mobile-web-app-capable` 等 meta 标签
4. 所有样式使用 Tailwind CSS v4 类名，不写自定义 CSS
5. 中文翻译使用直接 HTTP 调用 Google Translate（非 npm 包）

### 代码规范
- 组件按功能拆分，单文件不超过 300 行
- 使用 TypeScript 严格类型
- 数据库查询放在 `importService.ts` 中
- 页面组件放在 `pages/`，可复用组件放在 `components/`
