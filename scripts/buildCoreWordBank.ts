/**
 * Build 1500-word core vocabulary bank.
 * Phase A: Structure from OpenRussian, frequency-filtered.
 * Phase B: Chinese content enrichment (built-in dictionary + templates).
 *
 * Run: npx tsx scripts/buildCoreWordBank.ts
 */

import * as fs from 'fs'
import * as path from 'path'

// ── Types ──
interface WordEntry {
  id: string
  word: string
  accented: string
  type: 'noun' | 'verb'
  gender?: 'm' | 'f' | 'n' | 'pl'
  animate?: boolean
  aspect?: 'imperfective' | 'perfective'
  partner: string
  meaning: string       // Chinese
  meaningEn: string     // English fallback
  scene: string
  practicality: number
  cases?: Record<string, CaseForm>
  plural_cases?: Record<string, CaseForm>
  conjugation?: VerbConj
  government: string
  example: string       // Scene example sentence
  example_cn: string    // Chinese translation of example
  confused_with: string[]
  confused_note: string
  aspect_usage: string
}

interface CaseForm { form: string; usage: string; highlight: boolean }
interface VerbConj {
  present: Record<string, string>
  past: Record<string, string>
  imperative: Record<string, string>
}

// ── Config ──
const TARGET_WORDS = 1500
const FREQ_CUTOFF = 4000  // Look at top 4000 frequency words
const OUTPUT = path.join('public', 'wordBank.json')

const SCENE_LABELS: Record<string, string> = {
  campus: '🏫 校园课堂', shopping: '🛒 日常消费', housing: '🏠 租房生活',
  medical: '🏥 就医应急', social: '💬 社交闲聊', general: '📖 通用高频',
}

// ── Built-in Chinese Dictionary (most common ~1200 Russian words) ──
const CN: Record<string, { m: string; scene?: string }> = {
  // === TOP NOUNS ===
  'человек': { m: '人；人们', scene: 'general' },
  'год': { m: '年；年份', scene: 'general' },
  'время': { m: '时间；时代', scene: 'general' },
  'рука': { m: '手；手臂', scene: 'general' },
  'дело': { m: '事情；事务；案件', scene: 'general' },
  'раз': { m: '次；回；倍', scene: 'general' },
  'глаз': { m: '眼睛', scene: 'general' },
  'день': { m: '天；日子；白天', scene: 'general' },
  'жизнь': { m: '生活；生命', scene: 'general' },
  'слово': { m: '词；话语', scene: 'general' },
  'место': { m: '地方；位置；座位', scene: 'general' },
  'лицо': { m: '脸；面孔；人', scene: 'general' },
  'друг': { m: '朋友', scene: 'social' },
  'дом': { m: '房子；家；楼', scene: 'housing' },
  'сила': { m: '力量；力气', scene: 'general' },
  'сторона': { m: '方面；方向；侧面', scene: 'general' },
  'конец': { m: '结束；尽头；末尾', scene: 'general' },
  'вид': { m: '样子；种类；视图', scene: 'general' },
  'голова': { m: '头；头部；头脑', scene: 'general' },
  'город': { m: '城市', scene: 'general' },
  'час': { m: '小时；钟点', scene: 'general' },
  'работа': { m: '工作；劳动', scene: 'campus' },
  'земля': { m: '土地；地球；地面', scene: 'general' },
  'дверь': { m: '门', scene: 'housing' },
  'нога': { m: '腿；脚', scene: 'general' },
  'вода': { m: '水', scene: 'general' },
  'путь': { m: '道路；途径；旅程', scene: 'general' },
  'вопрос': { m: '问题；疑问', scene: 'campus' },
  'право': { m: '权利；法律；右边', scene: 'general' },
  'стол': { m: '桌子；餐桌', scene: 'housing' },
  'отец': { m: '父亲', scene: 'social' },
  'женщина': { m: '女人；女性', scene: 'social' },
  'мать': { m: '母亲', scene: 'social' },
  'свет': { m: '光；世界；灯', scene: 'general' },
  'машина': { m: '汽车；机器', scene: 'shopping' },
  'ночь': { m: '夜晚', scene: 'general' },
  'мир': { m: '世界；和平', scene: 'general' },
  'ребёнок': { m: '孩子；儿童', scene: 'social' },
  'утро': { m: '早晨；上午', scene: 'general' },
  'вечер': { m: '晚上', scene: 'general' },
  'комната': { m: '房间', scene: 'housing' },
  'письмо': { m: '信；信件；书写', scene: 'campus' },
  'мысль': { m: '思想；想法', scene: 'general' },
  'война': { m: '战争', scene: 'general' },
  'страна': { m: '国家', scene: 'general' },
  'улица': { m: '街道', scene: 'general' },
  'язык': { m: '语言；舌头', scene: 'campus' },
  'мама': { m: '妈妈', scene: 'social' },
  'любовь': { m: '爱；爱情', scene: 'social' },
  'окно': { m: '窗户', scene: 'housing' },
  'брат': { m: '兄弟；哥哥；弟弟', scene: 'social' },
  'хлеб': { m: '面包', scene: 'shopping' },
  'лес': { m: '森林', scene: 'general' },
  'душа': { m: '心灵；灵魂', scene: 'general' },
  'плечо': { m: '肩膀', scene: 'general' },
  'вещь': { m: '东西；物品', scene: 'general' },
  'зуб': { m: '牙齿', scene: 'medical' },
  'кровь': { m: '血；血液', scene: 'medical' },
  'смерть': { m: '死亡', scene: 'general' },
  'история': { m: '历史；故事', scene: 'campus' },
  'помощь': { m: '帮助；援助', scene: 'general' },
  'разговор': { m: '谈话；对话', scene: 'social' },
  'болезнь': { m: '疾病', scene: 'medical' },
  'проблема': { m: '问题；难题', scene: 'general' },
  'закон': { m: '法律；规律', scene: 'general' },
  'внимание': { m: '注意；关注', scene: 'general' },
  'учеба': { m: '学习', scene: 'campus' },
  'университет': { m: '大学', scene: 'campus' },
  'студент': { m: '大学生', scene: 'campus' },
  'преподаватель': { m: '大学教师', scene: 'campus' },
  'учитель': { m: '教师（中小学）', scene: 'campus' },
  'урок': { m: '课；课程', scene: 'campus' },
  'экзамен': { m: '考试', scene: 'campus' },
  'оценка': { m: '评分；评价；分数', scene: 'campus' },
  'задание': { m: '任务；作业', scene: 'campus' },
  'группа': { m: '小组；班级；群体', scene: 'campus' },
  'лекция': { m: '讲座；大课', scene: 'campus' },
  'семестр': { m: '学期', scene: 'campus' },
  'библиотека': { m: '图书馆', scene: 'campus' },
  'общежитие': { m: '宿舍', scene: 'housing' },
  'квартира': { m: '公寓；住宅', scene: 'housing' },
  'комната': { m: '房间', scene: 'housing' },
  'кухня': { m: '厨房', scene: 'housing' },
  'ванна': { m: '浴室；浴缸', scene: 'housing' },
  'мебель': { m: '家具', scene: 'housing' },
  'ключ': { m: '钥匙；关键', scene: 'housing' },
  'сосед': { m: '邻居', scene: 'housing' },
  'аренда': { m: '租赁；租金', scene: 'housing' },
  'ремонт': { m: '维修；修理', scene: 'housing' },
  'хозяин': { m: '主人；房东', scene: 'housing' },
  'отопление': { m: '供暖；暖气', scene: 'housing' },
  'электричество': { m: '电；电力', scene: 'housing' },
  'магазин': { m: '商店', scene: 'shopping' },
  'продукты': { m: '食品；食品杂货', scene: 'shopping' },
  'цена': { m: '价格', scene: 'shopping' },
  'деньги': { m: '钱', scene: 'shopping' },
  'касса': { m: '收银台；售票处', scene: 'shopping' },
  'скидка': { m: '折扣', scene: 'shopping' },
  'чек': { m: '收据；小票', scene: 'shopping' },
  'ресторан': { m: '餐厅', scene: 'shopping' },
  'меню': { m: '菜单', scene: 'shopping' },
  'такси': { m: '出租车', scene: 'shopping' },
  'метро': { m: '地铁', scene: 'shopping' },
  'билет': { m: '票', scene: 'shopping' },
  'автобус': { m: '公交车', scene: 'shopping' },
  'остановка': { m: '车站；停车站', scene: 'shopping' },
  'врач': { m: '医生', scene: 'medical' },
  'больница': { m: '医院', scene: 'medical' },
  'лекарство': { m: '药；药品', scene: 'medical' },
  'аптека': { m: '药店', scene: 'medical' },
  'боль': { m: '疼痛', scene: 'medical' },
  'температура': { m: '温度；体温；发烧', scene: 'medical' },
  'здоровье': { m: '健康', scene: 'medical' },
  'скорая': { m: '急救；救护车', scene: 'medical' },
  'рецепт': { m: '处方；食谱', scene: 'medical' },
  'прививка': { m: '疫苗；接种', scene: 'medical' },
  'страховка': { m: '保险', scene: 'medical' },
  'друг': { m: '朋友', scene: 'social' },
  'подруга': { m: '女性朋友', scene: 'social' },
  'вечеринка': { m: '聚会；派对', scene: 'social' },
  'праздник': { m: '节日；庆祝', scene: 'social' },
  'подарок': { m: '礼物', scene: 'social' },
  'встреча': { m: '会面；见面', scene: 'social' },
  'кино': { m: '电影；电影院', scene: 'social' },
  'музыка': { m: '音乐', scene: 'social' },
  'спорт': { m: '运动', scene: 'social' },
  'путешествие': { m: '旅行', scene: 'social' },
  'фото': { m: '照片', scene: 'social' },
  'кафе': { m: '咖啡馆', scene: 'social' },
  'гость': { m: '客人', scene: 'social' },
  'имя': { m: '名字', scene: 'general' },
  'фамилия': { m: '姓氏', scene: 'general' },
  'адрес': { m: '地址', scene: 'general' },
  'телефон': { m: '电话', scene: 'general' },
  'паспорт': { m: '护照', scene: 'general' },
  'виза': { m: '签证', scene: 'general' },
  'погода': { m: '天气', scene: 'general' },
  'дождь': { m: '雨', scene: 'general' },
  'снег': { m: '雪', scene: 'general' },
  'ветер': { m: '风', scene: 'general' },
  'солнце': { m: '太阳', scene: 'general' },
  'воздух': { m: '空气', scene: 'general' },
  'огонь': { m: '火', scene: 'general' },
  'дерево': { m: '树；木头', scene: 'general' },
  'цветок': { m: '花', scene: 'general' },
  'птица': { m: '鸟', scene: 'general' },
  'собака': { m: '狗', scene: 'general' },
  'кошка': { m: '猫', scene: 'general' },
  'рыба': { m: '鱼', scene: 'shopping' },
  'мясо': { m: '肉', scene: 'shopping' },
  'молоко': { m: '牛奶', scene: 'shopping' },
  'чай': { m: '茶', scene: 'shopping' },
  'кофе': { m: '咖啡', scene: 'shopping' },
  'сахар': { m: '糖', scene: 'shopping' },
  'соль': { m: '盐', scene: 'shopping' },
  'масло': { m: '油；黄油', scene: 'shopping' },
  'сыр': { m: '奶酪', scene: 'shopping' },
  'яйцо': { m: '鸡蛋', scene: 'shopping' },
  'фрукт': { m: '水果', scene: 'shopping' },
  'овощ': { m: '蔬菜', scene: 'shopping' },
  'суп': { m: '汤', scene: 'shopping' },
  'салат': { m: '沙拉', scene: 'shopping' },
  'пиво': { m: '啤酒', scene: 'shopping' },
  'вино': { m: '葡萄酒', scene: 'shopping' },
  'сок': { m: '果汁', scene: 'shopping' },
  'вода': { m: '水', scene: 'shopping' },
  'одежда': { m: '衣服', scene: 'shopping' },
  'обувь': { m: '鞋子', scene: 'shopping' },
  'сумка': { m: '包；袋子', scene: 'shopping' },
  'книга': { m: '书', scene: 'campus' },
  'тетрадь': { m: '练习本', scene: 'campus' },
  'ручка': { m: '笔', scene: 'campus' },
  'карандаш': { m: '铅笔', scene: 'campus' },
  'газета': { m: '报纸', scene: 'general' },
  'журнал': { m: '杂志', scene: 'general' },
  'интернет': { m: '互联网', scene: 'general' },
  'компьютер': { m: '电脑', scene: 'campus' },
  'телевизор': { m: '电视', scene: 'general' },
  'радио': { m: '广播', scene: 'general' },
  'фильм': { m: '电影', scene: 'social' },
  'песня': { m: '歌曲', scene: 'social' },
  'танец': { m: '舞蹈', scene: 'social' },
  'игра': { m: '游戏', scene: 'social' },
  'футбол': { m: '足球', scene: 'social' },
  'море': { m: '海', scene: 'general' },
  'река': { m: '河流', scene: 'general' },
  'гора': { m: '山', scene: 'general' },
  'дорога': { m: '路', scene: 'general' },
  'магаз': { m: '商店（口语）', scene: 'shopping' },
  'рынок': { m: '市场', scene: 'shopping' },
  'банк': { m: '银行', scene: 'shopping' },
  'почта': { m: '邮局', scene: 'general' },
  'полиция': { m: '警察', scene: 'general' },
  'посольство': { m: '大使馆', scene: 'general' },
  'аэропорт': { m: '机场', scene: 'general' },
  'вокзал': { m: '火车站', scene: 'general' },
  'поезд': { m: '火车', scene: 'shopping' },
  'самолёт': { m: '飞机', scene: 'shopping' },
  'машина': { m: '汽车', scene: 'shopping' },
  'велосипед': { m: '自行车', scene: 'shopping' },
  'номер': { m: '号码；房间号；编号', scene: 'general' },
  'карта': { m: '地图；卡片；银行卡', scene: 'shopping' },
  'документ': { m: '文件；证件', scene: 'general' },
  'справка': { m: '证明；证书', scene: 'general' },
  'заявление': { m: '申请；声明', scene: 'campus' },
  'студентческий': { m: '学生的', scene: 'campus' },
  'общественный': { m: '公共的；社会的', scene: 'general' },
  'российский': { m: '俄罗斯的', scene: 'general' },
  'русский': { m: '俄罗斯的；俄语的', scene: 'general' },
  'китайский': { m: '中国的；中文的', scene: 'general' },
  'новый': { m: '新的', scene: 'general' },
  'старый': { m: '旧的；老的', scene: 'general' },
  'хороший': { m: '好的', scene: 'general' },
  'плохой': { m: '坏的；不好的', scene: 'general' },
  'большой': { m: '大的', scene: 'general' },
  'маленький': { m: '小的', scene: 'general' },
  'красивый': { m: '漂亮的', scene: 'general' },
  'важный': { m: '重要的', scene: 'general' },
  'нужный': { m: '需要的', scene: 'general' },
  'разный': { m: '不同的', scene: 'general' },
  'последний': { m: '最后的', scene: 'general' },
  'первый': { m: '第一的', scene: 'general' },
  'второй': { m: '第二的', scene: 'general' },
  'чёрный': { m: '黑色的', scene: 'general' },
  'белый': { m: '白色的', scene: 'general' },
  'красный': { m: '红色的', scene: 'general' },
  'синий': { m: '蓝色的', scene: 'general' },
  'зелёный': { m: '绿色的', scene: 'general' },
  'жёлтый': { m: '黄色的', scene: 'general' },
  'горячий': { m: '热的', scene: 'shopping' },
  'холодный': { m: '冷的', scene: 'general' },
  'тёплый': { m: '温暖的', scene: 'general' },
  'свежий': { m: '新鲜的', scene: 'shopping' },
  'вкусный': { m: '好吃的', scene: 'shopping' },
  'сладкий': { m: '甜的', scene: 'shopping' },
  'солёный': { m: '咸的', scene: 'shopping' },
  'кислый': { m: '酸的', scene: 'shopping' },
  'горький': { m: '苦的', scene: 'shopping' },
  'острый': { m: '辣的；尖锐的', scene: 'shopping' },
  'дешёвый': { m: '便宜的', scene: 'shopping' },
  'дорогой': { m: '贵的；亲爱的', scene: 'shopping' },
  'свободный': { m: '自由的；空闲的', scene: 'general' },
  'занятый': { m: '忙碌的；被占用的', scene: 'general' },
  'готовый': { m: '准备好的', scene: 'general' },
  'открытый': { m: '开着的；开放的', scene: 'general' },
  'закрытый': { m: '关着的', scene: 'general' },
  'чистый': { m: '干净的', scene: 'housing' },
  'грязный': { m: '脏的', scene: 'housing' },
  'быстрый': { m: '快的', scene: 'general' },
  'медленный': { m: '慢的', scene: 'general' },
  'сильный': { m: '强壮的；强烈的', scene: 'general' },
  'слабый': { m: '弱的', scene: 'general' },
  'лёгкий': { m: '轻的；容易的', scene: 'general' },
  'тяжёлый': { m: '重的；困难的', scene: 'general' },
  'простой': { m: '简单的', scene: 'general' },
  'сложный': { m: '复杂的', scene: 'general' },
  'удобный': { m: '方便的；舒适的', scene: 'general' },
  'интересный': { m: '有趣的', scene: 'social' },
  'скучный': { m: '无聊的', scene: 'social' },
  'весёлый': { m: '快乐的', scene: 'social' },
  'грустный': { m: '悲伤的', scene: 'social' },
  'злой': { m: '生气的；凶恶的', scene: 'social' },
  'добрый': { m: '善良的', scene: 'social' },
  'умный': { m: '聪明的', scene: 'campus' },
  'глупый': { m: '愚蠢的', scene: 'social' },
  'богатый': { m: '富有的', scene: 'general' },
  'бедный': { m: '贫穷的', scene: 'general' },

  // === TOP VERBS ===
  'быть': { m: '是；在；有' },
  'сказать': { m: '说；告诉（完成体）' },
  'мочь': { m: '能；能够' },
  'знать': { m: '知道；了解' },
  'говорить': { m: '说；说话；讲' },
  'есть': { m: '吃' },
  'хотеть': { m: '想；想要' },
  'видеть': { m: '看见；看到' },
  'идти': { m: '走；去（步行）' },
  'стоять': { m: '站；站立' },
  'думать': { m: '想；思考；认为' },
  'спросить': { m: '问；询问（完成体）' },
  'жить': { m: '生活；居住' },
  'смотреть': { m: '看；观看' },
  'иметь': { m: '有；拥有' },
  'понять': { m: '明白；理解（完成体）' },
  'сидеть': { m: '坐' },
  'делать': { m: '做（未完成体）' },
  'сделать': { m: '做；完成（完成体）' },
  'взять': { m: '拿；取（完成体）' },
  'любить': { m: '爱；喜欢' },
  'дать': { m: '给（完成体）' },
  'пойти': { m: '出发；去（完成体）' },
  'писать': { m: '写' },
  'читать': { m: '阅读；读' },
  'работать': { m: '工作' },
  'пить': { m: '喝' },
  'понимать': { m: '理解；明白（未完成体）' },
  'ехать': { m: '乘行；去（乘车）' },
  'спать': { m: '睡觉' },
  'ждать': { m: '等待' },
  'помнить': { m: '记住；记得' },
  'начать': { m: '开始（完成体）' },
  'помочь': { m: '帮助（完成体）' },
  'уйти': { m: '离开；走开（完成体）' },
  'увидеть': { m: '看见（完成体）' },
  'прийти': { m: '来到；到达（完成体）' },
  'остаться': { m: '留下；剩余（完成体）' },
  'получить': { m: '收到；获得（完成体）' },
  'найти': { m: '找到（完成体）' },
  'рассказать': { m: '讲述；叙述（完成体）' },
  'звонить': { m: '打电话；按铃' },
  'отвечать': { m: '回答；负责' },
  'платить': { m: '付款；支付' },
  'покупать': { m: '购买（未完成体）' },
  'купить': { m: '购买（完成体）' },
  'продавать': { m: '出售（未完成体）' },
  'заказывать': { m: '订购；预订' },
  'готовить': { m: '准备；做饭', scene: 'shopping' },
  'варить': { m: '煮；熬', scene: 'shopping' },
  'жарить': { m: '煎；炸；烤', scene: 'shopping' },
  'мыть': { m: '洗', scene: 'housing' },
  'убирать': { m: '收拾；整理', scene: 'housing' },
  'стирать': { m: '洗（衣物）；擦', scene: 'housing' },
  'чинить': { m: '修理', scene: 'housing' },
  'ломать': { m: '弄坏；折断', scene: 'housing' },
  'открывать': { m: '打开（未完成体）' },
  'закрывать': { m: '关上；关闭（未完成体）' },
  'включать': { m: '打开（电器）；包括' },
  'выключать': { m: '关闭（电器）' },
  'болеть': { m: '生病；疼痛', scene: 'medical' },
  'лечить': { m: '治疗', scene: 'medical' },
  'принимать': { m: '接受；服（药）', scene: 'medical' },
  'вызывать': { m: '叫来；引起', scene: 'medical' },
  'осматривать': { m: '检查；查看', scene: 'medical' },
  'записываться': { m: '预约；登记', scene: 'medical' },
  'встречаться': { m: '见面；约会', scene: 'social' },
  'общаться': { m: '交流；交往', scene: 'social' },
  'знакомиться': { m: '认识；结识', scene: 'social' },
  'приглашать': { m: '邀请', scene: 'social' },
  'гулять': { m: '散步；逛', scene: 'social' },
  'танцевать': { m: '跳舞', scene: 'social' },
  'петь': { m: '唱歌', scene: 'social' },
  'играть': { m: '玩；演奏', scene: 'social' },
  'отдыхать': { m: '休息', scene: 'social' },
  'путешествовать': { m: '旅行', scene: 'social' },
  'фотографировать': { m: '拍照', scene: 'social' },
  'учиться': { m: '学习；上学', scene: 'campus' },
  'изучать': { m: '研究；学习', scene: 'campus' },
  'преподавать': { m: '教学；教授', scene: 'campus' },
  'объяснять': { m: '解释；讲解', scene: 'campus' },
  'повторять': { m: '重复；复习', scene: 'campus' },
  'переводить': { m: '翻译；转移', scene: 'campus' },
  'запоминать': { m: '记忆', scene: 'campus' },
  'сдавать': { m: '通过（考试）；交出', scene: 'campus' },
  'поступать': { m: '进入（大学）； поступать', scene: 'campus' },
  'ходить': { m: '走；去（不定向）' },
  'бежать': { m: '跑' },
  'лететь': { m: '飞' },
  'плыть': { m: '游泳；航行' },
  'везти': { m: '运输；运送' },
  'носить': { m: '携带；穿（不定向）' },
  'водить': { m: '驾驶；带领' },
  'слышать': { m: '听见' },
  'слушать': { m: '听' },
  'чувствовать': { m: '感觉' },
  'дышать': { m: '呼吸', scene: 'medical' },
  'улыбаться': { m: '微笑' },
  'смеяться': { m: '笑' },
  'плакать': { m: '哭' },
  'кричать': { m: '喊叫' },
  'молчать': { m: '沉默' },
  'верить': { m: '相信' },
  'надеяться': { m: '希望' },
  'бояться': { m: '害怕' },
  'нравиться': { m: '喜欢；使…喜欢' },
  'казаться': { m: '似乎；好像' },
  'оказаться': { m: '原来是；结果是（完成体）' },
  'начинать': { m: '开始（未完成体）' },
  'кончать': { m: '结束（未完成体）' },
  'продолжать': { m: '继续' },
  'повторять': { m: '重复；复习' },
  'менять': { m: '改变；更换' },
  'оставлять': { m: '留下' },
  'терять': { m: '丢失' },
  'искать': { m: '寻找' },
  'находить': { m: '找到（未完成体）' },
  'присылать': { m: '寄来' },
  'отправлять': { m: '发送；派遣' },
  'посылать': { m: '寄；发送' },
  'получать': { m: '收到（未完成体）' },
  'давать': { m: '给（未完成体）' },
  'брать': { m: '拿；取（未完成体）' },
  'класть': { m: '放（平放）' },
  'ставить': { m: '放（立放）' },
  'вешать': { m: '挂' },
  'держать': { m: '拿着；握住；保持' },
  'поднимать': { m: '举起；抬起' },
  'опускать': { m: '放下；降低' },
  'тянуть': { m: '拉；拖' },
  'толкать': { m: '推' },
  'бросать': { m: '扔；抛' },
  'падать': { m: '落下；跌倒' },
  'вставать': { m: '站起来；起床' },
  'ложиться': { m: '躺下' },
  'садиться': { m: '坐下；乘上' },
  'выходить': { m: '出去（未完成体）' },
  'входить': { m: '进入（未完成体）' },
  'проходить': { m: '通过；走过' },
  'возвращаться': { m: '返回' },
  'приезжать': { m: '来到（乘车，未完成体）' },
  'уезжать': { m: '离开（乘车，未完成体）' },
  'опаздывать': { m: '迟到' },
  'успевать': { m: '来得及' },
  'забывать': { m: '忘记（未完成体）' },
  'вспоминать': { m: '回忆起（未完成体）' },
  'решать': { m: '决定；解决（未完成体）' },
  'выбирать': { m: '选择' },
  'проверять': { m: '检查；核对' },
  'просить': { m: '请求；要求' },
  'требовать': { m: '要求；需要' },
  'разрешать': { m: '允许' },
  'запрещать': { m: '禁止' },
  'обещать': { m: '承诺；答应' },
  'советовать': { m: '建议' },
  'благодарить': { m: '感谢' },
  'поздравлять': { m: '祝贺', scene: 'social' },
  'желать': { m: '祝愿；希望' },
  'извинять': { m: '原谅；抱歉' },
  'рождаться': { m: '出生' },
  'умирать': { m: '死亡' },
  'расти': { m: '成长；增长' },
  'строить': { m: '建设；建造', scene: 'housing' },
  'рисовать': { m: '画画', scene: 'campus' },
  'показывать': { m: '展示；给…看' },
  'считать': { m: '数数；认为' },
  'казаться': { m: '似乎' },
  'стоить': { m: '值…；花费', scene: 'shopping' },
  'весить': { m: '重…；称重' },
  'содержать': { m: '包含；含有' },
  'состоять': { m: '由…组成' },
  'принадлежать': { m: '属于' },
  'зависеть': { m: '取决于；依赖于' },
  'отличаться': { m: '区别于；不同于' },
  'называться': { m: '叫做' },
  'являться': { m: '是；作为' },
  'существовать': { m: '存在' },
  'образовывать': { m: '形成；构成' },
  'развиваться': { m: '发展' },
  'изменяться': { m: '改变；变化' },
  'увеличиваться': { m: '增加；增大' },
  'уменьшаться': { m: '减少；减小' },
  'улучшаться': { m: '改善；好转' },
  'ухудшаться': { m: '恶化' },
  'участвовать': { m: '参加' },
  'организовывать': { m: '组织' },
  'руководить': { m: '领导；管理' },
  'управлять': { m: '管理；操控' },
  'обслуживать': { m: '服务', scene: 'shopping' },
  'зарабатывать': { m: '挣钱', scene: 'shopping' },
  'тратить': { m: '花费（钱/时间）', scene: 'shopping' },
  'экономить': { m: '节省；节约', scene: 'shopping' },
  'брать в долг': { m: '借（入）', scene: 'shopping' },
  'занимать': { m: '借入；占用' },
  'возвращать': { m: '归还' },
  'подписывать': { m: '签字；签署', scene: 'campus' },
  'заполнять': { m: '填写（表格）', scene: 'campus' },
  'регистрироваться': { m: '注册；登记', scene: 'campus' },
  'оформлять': { m: '办理（手续）； оформлять', scene: 'general' },
}

// ── Scene classification by keyword ──
const SCENE_KW: Record<string, string[]> = {
  campus: ['student','teacher','professor','lecture','class','lesson','exam','study','university','homework','course','grade','subject','library','semester','test','education','school','college','book','pen','write','read','learn','teach','translate','explain'],
  shopping: ['shop','store','buy','sell','price','money','cost','pay','market','cash','receipt','discount','supermarket','restaurant','food','drink','order','menu','bill','tip','taxi','bus','metro','ticket','transport','fare','cheap','expensive','sale'],
  housing: ['house','apartment','rent','landlord','tenant','room','flat','kitchen','bathroom','furniture','repair','electricity','water','heating','plumbing','lease','contract','neighbor','building','key','door','window','floor','wash','clean','break','fix'],
  medical: ['doctor','hospital','medicine','pharmacy','drug','pill','pain','sick','ill','health','emergency','symptom','fever','prescription','clinic','treatment','insurance','dental','injury','allergy','blood','breath','temperature'],
  social: ['friend','party','conversation','talk','meet','chat','gossip','social','weekend','hobby','movie','music','sport','game','travel','trip','photo','holiday','date','fun','joke','story','news','dance','sing','gift','guest','invitation','love','happy','sad'],
}

function classifyScene(meaningEn: string, wordType: string): string {
  const lower = meaningEn.toLowerCase()
  for (const [scene, kws] of Object.entries(SCENE_KW)) {
    for (const kw of kws) {
      if (lower.includes(kw)) return scene
    }
  }
  return 'general'
}

// ── Example sentence templates ──
function generateExample(word: string, type: string, scene: string, meaning: string): { ru: string; cn: string } {
  const templates: Record<string, [string, string]> = {
    campus_noun: ['Студенты изучают {word} на уроке.', '学生们在课堂上学习{word}相关内容。'],
    campus_verb: ['Я должен {word} это к завтрашнему экзамену.', '我必须在明天考试前{meaning}。'],
    shopping_noun: ['Где можно купить {word} подешевле?', '哪里能买到便宜点的{meaning}？'],
    shopping_verb: ['Я хочу {word} это в магазине.', '我想在商店里{meaning}这个。'],
    housing_noun: ['{word} в моей квартире нужно отремонтировать.', '我公寓里的{meaning}需要修理了。'],
    housing_verb: ['Мне нужно {word} в квартире.', '我需要在公寓里{meaning}。'],
    medical_noun: ['У меня болит {word}, нужно идти к врачу.', '我的{meaning}疼，需要去看医生。'],
    medical_verb: ['Врач сказал {word} лекарство три раза в день.', '医生说一天三次{meaning}药。'],
    social_noun: ['Мы говорили о {word} с друзьями.', '我们和朋友聊了关于{meaning}的事。'],
    social_verb: ['Давай {word} вместе в выходные!', '周末一起{meaning}吧！'],
    general_noun: ['Это {word} очень важно для меня.', '这个{meaning}对我来说很重要。'],
    general_verb: ['Я хочу {word} это сейчас.', '我想现在就{meaning}。'],
  }

  const key = `${scene}_${type}` as keyof typeof templates
  const [ruTmpl, cnTmpl] = templates[key] || templates[`general_${type}`] || ['{word} — это важно.', '{meaning}很重要。']
  return {
    ru: ruTmpl.replace('{word}', word).replace('{meaning}', meaning),
    cn: cnTmpl.replace('{word}', word).replace('{meaning}', meaning),
  }
}

// ── Confusion pairs ──
const CONFUSION_PAIRS: Record<string, { with: string[]; note: string }> = {
  'видеть': { with: ['смотреть'], note: 'видеть = 看见（结果），смотреть = 看（过程）。Я вижу тебя. 我看见你了。vs Я смотрю фильм. 我在看电影。' },
  'слышать': { with: ['слушать'], note: 'слышать = 听见（结果），слушать = 听（过程）。Я слышу музыку. 我听见音乐。vs Я слушаю музыку. 我在听音乐。' },
  'знать': { with: ['уметь'], note: 'знать = 知道/了解（知识），уметь = 会/能（技能）。Я знаю русский язык. 我懂俄语。vs Я умею плавать. 我会游泳。' },
  'говорить': { with: ['сказать', 'рассказать'], note: 'говорить = 说话（未完成体/过程），сказать = 说（完成体/结果），рассказать = 讲述。Он говорит по-русски. 他说俄语。vs Он сказал правду. 他说了实话。' },
  'идти': { with: ['ходить', 'ехать', 'ездить'], note: 'идти-ходить = 步行，ехать-ездить = 乘车。идти/ехать = 定向（一次），ходить/ездить = 不定向（多次/往返）。' },
  'учиться': { with: ['изучать', 'учить'], note: 'учиться = 上学/学习（过程），изучать = 研究/学习（深入），учить = 教/背诵。Я учусь в университете. 我在大学读书。' },
  'преподаватель': { with: ['учитель', 'профессор'], note: 'учитель = 中小学教师，преподаватель = 大学教师，профессор = 教授（有学术头衔）。' },
  'в': { with: ['на'], note: 'в+第六格 = 在…里面（в комнате 在房间里），на+第六格 = 在…上面/在…活动（на столе 在桌上，на уроке 在课上）。' },
  'дом': { with: ['дома', 'домой'], note: 'дом = 房子/家（名词原形），дома = 在家（副词），домой = 回家（副词方向）。Я дома. 我在家。Я иду домой. 我回家。' },
  'друг': { with: ['подруга', 'товарищ'], note: 'друг = 朋友（男性或泛指），подруга = 女性朋友，товарищ = 同志/同学/同事。' },
  'ждать': { with: ['ожидать'], note: 'ждать+第四格（кого-что）= 等待具体的人/物，ожидать+第二格（кого-чего）= 期待/预期。Я жду друга. 我等朋友。' },
  'есть': { with: ['кушать', 'питаться'], note: 'есть = 吃（通用），кушать = 吃（礼貌/对客人说），питаться = 进食/营养（正式）。' },
  'боль': { with: ['болезнь', 'болеть'], note: 'боль = 疼痛（名词），болезнь = 疾病（名词），болеть = 生病/疼（动词）。У меня боль в горле. 我喉咙疼。' },
}

// ── Verb government ──
const GOVERNMENT: Record<string, string> = {
  'ждать': 'кого-что（第四格）',
  'искать': 'кого-что（第四格）',
  'просить': 'кого-что（第四格）',
  'благодарить': 'кого-что（第四格）',
  'поздравлять': 'кого-что（第四格）',
  'любить': 'кого-что（第四格）',
  'видеть': 'кого-что（第四格）',
  'слышать': 'кого-что（第四格）',
  'знать': 'кого-что（第四格）',
  'понимать': 'кого-что（第四格）',
  'помнить': 'кого-что（第四格）',
  'забывать': 'кого-что（第四格）',
  'покупать': 'кого-что（第四格）',
  'продавать': 'кого-что（第四格）',
  'готовить': 'кого-что（第四格）',
  'открывать': 'кого-что（第四格）',
  'закрывать': 'кого-что（第四格）',
  'помогать': 'кому（第三格）',
  'звонить': 'кому（第三格）',
  'отвечать': 'кому（第三格）',
  'советовать': 'кому（第三格）',
  'мешать': 'кому（第三格）',
  'нравиться': 'кому（第三格）',
  'принадлежать': 'кому（第三格）',
  'верить': 'кому-чему（第三格）',
  'радоваться': 'кому-чему（第三格）',
  'удивляться': 'кому-чему（第三格）',
  'управлять': 'кем-чем（第五格）',
  'руководить': 'кем-чем（第五格）',
  'заниматься': 'кем-чем（第五格）',
  'интересоваться': 'кем-чем（第五格）',
  'пользоваться': 'кем-чем（第五格）',
  'гордиться': 'кем-чем（第五格）',
  'зависеть': 'от кого-чего（第二格）',
  'бояться': 'кого-чего（第二格）',
  'достигать': 'кого-чего（第二格）',
  'желать': 'кого-чего（第二格）',
  'ждать': 'кого-что/кого-чего（第四格/第二格）',
}

// ── Main ──
async function main() {
  console.log('📖 Reading CSV data...')
  const nounsRaw = fs.readFileSync('raw_nouns.csv', 'utf-8').trim().split('\n')
  const verbsRaw = fs.readFileSync('raw_verbs.csv', 'utf-8').trim().split('\n')
  const freqRaw = fs.readFileSync('freq_10k.txt', 'utf-8').trim().split('\n')

  // Build frequency set
  const freqSet = new Set<string>()
  for (const line of freqRaw) {
    const w = line.trim().toLowerCase()
    if (w.length > 1) freqSet.add(w)
  }

  // Parse noun headers
  const nHeaders = nounsRaw[0].split('\t')
  const nouns: Record<string, string>[] = []
  for (let i = 1; i < nounsRaw.length; i++) {
    const vals = nounsRaw[i].split('\t')
    const row: Record<string, string> = {}
    nHeaders.forEach((h, idx) => { row[h] = vals[idx] || '' })
    nouns.push(row)
  }

  // Parse verb headers
  const vHeaders = verbsRaw[0].split('\t')
  const verbs: Record<string, string>[] = []
  for (let i = 1; i < verbsRaw.length; i++) {
    const vals = verbsRaw[i].split('\t')
    const row: Record<string, string> = {}
    vHeaders.forEach((h, idx) => { row[h] = vals[idx] || '' })
    verbs.push(row)
  }

  console.log(`   Nouns: ${nouns.length}, Verbs: ${verbs.length}, Freq: ${freqSet.size}`)

  // Build word bank filtered by frequency
  const wordBank: WordEntry[] = []
  const seen = new Set<string>()

  for (const n of nouns) {
    const bare = n.bare.toLowerCase()
    if (!freqSet.has(bare) || seen.has(bare)) continue
    if (n.indeclinable === '1') continue
    const en = n.translations_en.split(',')[0].split(';')[0].trim()
    const cnEntry = CN[bare] || CN[n.bare]
    const scene = cnEntry?.scene || classifyScene(en, 'noun')

    const entry: WordEntry = {
      id: `n_${n.bare}`,
      word: n.bare,
      accented: n.accented || n.bare,
      type: 'noun',
      gender: (n.gender || 'm') as WordEntry['gender'],
      animate: n.animate === '1',
      partner: n.partner || '',
      meaning: cnEntry?.m || '',
      meaningEn: en,
      scene,
      practicality: scene === 'general' ? 3 : scene === 'social' ? 3 : scene === 'campus' || scene === 'shopping' ? 5 : 4,
      cases: {
        nominative: { form: n.sg_nom || '—', usage: '主语（第一格）', highlight: true },
        genitive: { form: n.sg_gen || '—', usage: '所属/否定（第二格）', highlight: true },
        dative: { form: n.sg_dat || '—', usage: '间接对象（第三格）', highlight: true },
        accusative: { form: n.sg_acc || '—', usage: '直接宾语（第四格）', highlight: true },
        instrumental: { form: n.sg_inst || '—', usage: '工具/方式（第五格）', highlight: false },
        prepositional: { form: n.sg_prep || '—', usage: '地点/话题（第六格）', highlight: false },
      },
      plural_cases: {
        nominative: { form: n.pl_nom || '—', usage: '复数主语', highlight: false },
        genitive: { form: n.pl_gen || '—', usage: '复数所属', highlight: false },
        dative: { form: n.pl_dat || '—', usage: '复数间接对象', highlight: false },
        accusative: { form: n.pl_acc || '—', usage: '复数直接宾语', highlight: false },
        instrumental: { form: n.pl_inst || '—', usage: '复数工具', highlight: false },
        prepositional: { form: n.pl_prep || '—', usage: '复数地点', highlight: false },
      },
      government: '',
      example: '',
      example_cn: '',
      confused_with: [],
      confused_note: '',
      aspect_usage: '',
    }

    // Generate example
    const ex = generateExample(n.bare, 'noun', scene, cnEntry?.m || en)
    entry.example = ex.ru
    entry.example_cn = ex.cn

    // Add confusion
    const conf = CONFUSION_PAIRS[n.bare] || CONFUSION_PAIRS[bare]
    if (conf) {
      entry.confused_with = conf.with
      entry.confused_note = conf.note
    }

    wordBank.push(entry)
    seen.add(bare)
    if (wordBank.length >= TARGET_WORDS * 0.65) break
  }

  const nounCount = wordBank.length
  console.log(`   Nouns added: ${nounCount}`)

  for (const v of verbs) {
    const bare = v.bare.toLowerCase()
    if (!freqSet.has(bare) || seen.has(bare)) continue
    const en = v.translations_en.split(',')[0].split(';')[0].trim()
    const cnEntry = CN[bare] || CN[v.bare]
    const scene = cnEntry?.scene || classifyScene(en, 'verb')

    const entry: WordEntry = {
      id: `v_${v.bare}`,
      word: v.bare,
      accented: v.accented || v.bare,
      type: 'verb',
      aspect: (v.aspect === 'perfective' ? 'perfective' : 'imperfective') as WordEntry['aspect'],
      partner: v.partner || '',
      meaning: cnEntry?.m || '',
      meaningEn: en,
      scene,
      practicality: scene === 'general' ? 3 : 4,
      conjugation: {
        present: {
          'я': v.presfut_sg1 || '', 'ты': v.presfut_sg2 || '', 'он/она': v.presfut_sg3 || '',
          'мы': v.presfut_pl1 || '', 'вы': v.presfut_pl2 || '', 'они': v.presfut_pl3 || '',
        },
        past: { m: v.past_m || '', f: v.past_f || '', n: v.past_n || '', pl: v.past_pl || '' },
        imperative: { sg: v.imperative_sg || '', pl: v.imperative_pl || '' },
      },
      government: GOVERNMENT[v.bare] || GOVERNMENT[bare] || '',
      example: '',
      example_cn: '',
      confused_with: [],
      confused_note: '',
      aspect_usage: '',
    }

    // Aspect usage
    if (entry.aspect === 'imperfective' && entry.partner) {
      entry.aspect_usage = `未完成体（过程/重复），对应完成体：${entry.partner}（结果/一次）`
    } else if (entry.aspect === 'perfective' && entry.partner) {
      entry.aspect_usage = `完成体（结果/一次），对应未完成体：${entry.partner}（过程/重复）`
    }

    // Example
    const ex = generateExample(v.bare, 'verb', scene, cnEntry?.m || en)
    entry.example = ex.ru
    entry.example_cn = ex.cn

    // Confusion
    const conf = CONFUSION_PAIRS[v.bare] || CONFUSION_PAIRS[bare]
    if (conf) {
      entry.confused_with = conf.with
      entry.confused_note = conf.note
    }

    wordBank.push(entry)
    seen.add(bare)
    if (wordBank.length >= TARGET_WORDS) break
  }

  // Sort by frequency (already in order from CSV)
  console.log(`\n📊 Total: ${wordBank.length} words (${nounCount} nouns + ${wordBank.length - nounCount} verbs)`)

  // Scene distribution
  const dist: Record<string, number> = {}
  for (const w of wordBank) {
    dist[w.scene] = (dist[w.scene] || 0) + 1
  }
  console.log('   Scene distribution:', JSON.stringify(dist))

  // Chinese coverage
  const withCN = wordBank.filter(w => w.meaning && w.meaning.trim() !== '').length
  console.log(`   Chinese coverage: ${withCN}/${wordBank.length} (${Math.round(withCN/wordBank.length*100)}%)`)

  // Write
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  fs.writeFileSync(OUTPUT, JSON.stringify(wordBank, null, 2), 'utf-8')
  const sizeKB = (fs.statSync(OUTPUT).size / 1024).toFixed(0)
  console.log(`\n✅ wordBank.json written (${sizeKB} KB)`)
  console.log(`   Path: ${OUTPUT}`)
}

main().catch(console.error)
