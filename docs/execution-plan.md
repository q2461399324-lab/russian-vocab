# 俄语背词 APP - 执行计划

## 已完成 ✅

### Phase 1：项目搭建
- [x] Vite + React + TypeScript 项目初始化
- [x] Tailwind CSS v4 配置
- [x] PWA 离线能力配置
- [x] 底部3Tab导航（学习/复习/我的）
- [x] iPhone Safari访问验证

### Phase 2：词库数据
- [x] OpenRussian数据获取（名词27k + 动词15k）
- [x] 频率过滤 → 1500高频词
- [x] 完整变格/变位数据
- [x] 中文翻译（直接HTTP调用Google Translate）
- [x] 场景例句生成

---

## 已完成 ✅ (新增)

### Phase 3：数据库层重构
- [x] 更新数据库Schema（v2）
- [x] 添加 wordBooks/usedWords/settings 表
- [x] WordData 添加 bookId 字段
- [x] UserProgress 适配三按钮模型
- [x] 更新 importService

### Phase 4：学习页重写
- [x] 词书列表视图
- [x] 卡片学习视图（单词+三按钮）
- [x] 单词详情浮层（变格/变位表）
- [x] 每日新词配额 + 进度条
- [x] 随机顺序

### Phase 5：复习页重写
- [x] 艾宾浩斯复习算法
- [x] 翻转复习卡片
- [x] 三按钮反馈（记得/模糊/忘记）
- [x] 间隔动态调整

### Phase 6：个人页更新
- [x] 学习统计面板
- [x] 每日新词目标设置（10-100可调）
- [x] 数据导出/导入备份

## 待执行 📋

### Phase 7：打磨与验证
- [ ] iPhone全流程测试
- [ ] 后续词书去重验证
- [ ] UI细节优化
- [ ] 性能测试
