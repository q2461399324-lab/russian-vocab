# 俄语背词 APP - 技术规范

## 技术栈

| 层 | 技术 | 理由 |
|----|------|------|
| 框架 | React 19 + TypeScript | AI编码质量最高 |
| 构建 | Vite 8 | 快速HMR，PWA插件 |
| 样式 | Tailwind CSS v4 | 极简样式，类名拼装 |
| 路由 | React Router v7 | SPA页面切换 |
| 存储 | Dexie.js (IndexedDB) | 浏览器本地数据库 |
| PWA | vite-plugin-pwa | Service Worker + Manifest |

## 项目结构

```
俄语背词/
├── src/
│   ├── components/        # 可复用组件
│   │   ├── TabBar.tsx     # 底部导航
│   │   ├── DataProvider.tsx # 数据初始化
│   │   ├── CaseTable.tsx  # 名词变格表
│   │   ├── VerbConjugationTable.tsx # 动词变位表
│   │   └── WordDetail.tsx # 单词详情浮层
│   ├── db/
│   │   ├── database.ts    # Dexie数据库定义
│   │   └── importService.ts # 词库导入与查询
│   ├── pages/
│   │   ├── LearnPage.tsx  # 学习页
│   │   ├── ReviewPage.tsx # 复习页
│   │   └── ProfilePage.tsx # 个人页
│   ├── App.tsx            # 路由+布局
│   ├── main.tsx           # 入口
│   └── index.css          # 全局样式+Tailwind
├── public/
│   ├── wordBank.json      # 词库文件
│   └── favicon.svg        # 图标
├── scripts/               # 数据生成脚本
├── docs/                  # 项目文档
├── devlogs/               # 开发日志
└── vite.config.ts         # Vite+PWA+Tailwind配置
```

## 数据库设计 (IndexedDB via Dexie)

### 表结构

```
wordBank (词库)
├── id: string (PK)         # "n_человек" or "v_ждать"
├── word: string (索引)      # 原词
├── accented: string        # 带重音
├── type: 'noun'|'verb'     # 词性
├── bookId: string (索引)    # 所属词书
├── meaning: string         # 中文释义
├── meaningEn: string       # 英文释义(备用)
├── cases/plural_cases      # 名词变格
├── conjugation             # 动词变位
└── example/example_cn      # 例句

userProgress (学习进度)
├── wordId: string (PK)     # 关联wordBank.id
├── status: 学习状态         # new|learning|review|mastered
├── ease: number            # 熟练度 1-5
├── interval: number        # 当前间隔(天)
├── nextReview: number (索引) # 下次复习时间戳
└── reviewCount: number     # 复习次数

wordBooks (词书)
├── id: string (PK)
├── name: string            # 词书名称
├── wordCount: number       # 总词数
└── order: number           # 排序

usedWords (已用词)
├── word: string (PK)
└── bookId: string          # 来源词书

settings (设置)
├── key: string (PK)
└── dailyNewWords: number   # 每日新词量
```

## PWA配置
- display: standalone（全屏无浏览器框）
- 离线缓存：wordBank.json + 所有静态资源
- Service Worker: autoUpdate模式

## 数据来源
- OpenRussian开源词库 (CC BY-SA 4.0)
- 筛选频率：Leeds Corpus Top 4000
- 中文翻译：Google Translate HTTP API
