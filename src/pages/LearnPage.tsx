import { useState, useEffect, useCallback } from 'react'
import { getWordBooks, getNewWordsForToday, recordLearnResult, getRemainingNewCount, getDailyTarget, getDueReviewCount } from '../db/importService'
import { useLayout } from '../components/LayoutContext'
import type { WordData, WordBook, LearnResult } from '../db/database'
import WordDetailPopup from '../components/WordDetailPopup'

export default function LearnPage() {
  const [view, setView] = useState<'books' | 'learning' | 'done'>('books')
  const [books, setBooks] = useState<WordBook[]>([])
  const [currentBook, setCurrentBook] = useState<WordBook | null>(null)
  const [words, setWords] = useState<WordData[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [dailyTarget, setDailyTarget] = useState(20)
  const [learnedToday, setLearnedToday] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [dueReviews, setDueReviews] = useState(0)
  const [showDetail, setShowDetail] = useState(false)
  const [showMeaning, setShowMeaning] = useState(false)
  const [fadingIn, setFadingIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const { setShowTabBar } = useLayout()

  const loadBooks = useCallback(async () => {
    setLoading(true)
    try {
      const [b, target, due] = await Promise.all([getWordBooks(), getDailyTarget(), getDueReviewCount()])
      setBooks(b)
      setDailyTarget(target)
      setDueReviews(due)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadBooks() }, [loadBooks])
  useEffect(() => { return () => setShowTabBar(true) }, [setShowTabBar])

  const goToBooks = useCallback(() => { setShowTabBar(true); setView('books'); loadBooks() }, [loadBooks, setShowTabBar])

  const startLearning = async (book: WordBook) => {
    setCurrentBook(book)
    const daily = await getDailyTarget()
    const newWords = await getNewWordsForToday(book.id, daily)
    const rem = await getRemainingNewCount(book.id)
    setWords(newWords)
    setCurrentIdx(0)
    setLearnedToday(0)
    setRemaining(rem)
    setShowMeaning(false)
    setShowTabBar(false)
    setView('learning')
  }

  const nextWord = async () => {
    setShowMeaning(false)
    setFadingIn(false)
    if (currentIdx < words.length - 1) {
      setCurrentIdx(currentIdx + 1)
    } else if (currentBook) {
      const daily = await getDailyTarget()
      const more = await getNewWordsForToday(currentBook.id, daily)
      const rem = await getRemainingNewCount(currentBook.id)
      const due = await getDueReviewCount()
      if (more.length > 0) { setWords(more); setCurrentIdx(0); setRemaining(rem); setDueReviews(due) }
      else { setView('done'); setDueReviews(due) }
    }
  }

  const handleResult = async (result: LearnResult) => {
    const word = words[currentIdx]
    if (!word) return
    await recordLearnResult(word.id, result)
    setLearnedToday((c) => c + 1)
    await nextWord()
  }

  const handleReveal = () => {
    setShowMeaning(true)
    setFadingIn(true)
  }

  // ── Book List ──
  if (view === 'books') {
    return (
      <div className="page-content px-4 pt-6">
        <h1 className="text-2xl font-bold text-slate-800">俄语背词</h1>
        <p className="mt-1 text-sm text-slate-500">实用变格单词 · 高效记忆</p>
        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-700">我的词书</h2>
          {loading && <p className="py-8 text-center text-sm text-slate-400">加载中…</p>}
          {!loading && books.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <div className="text-4xl">📖</div><p className="mt-3 text-sm text-slate-500">还没有词书</p>
            </div>
          )}
          {books.map((book) => (
            <button key={book.id} onClick={() => startLearning(book)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all active:scale-[0.98]">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">{book.name}</h3>
                <span className="text-xl">→</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500"
                  style={{ width: `${book.wordCount > 0 ? Math.max(2, Math.round((book.learnedCount / book.wordCount) * 100)) : 0}%` }} />
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                <span>{book.wordCount} 词</span>
                <span>已学 {book.learnedCount}</span>
                {dueReviews > 0 && <span className="text-amber-500 font-medium">待复习 {dueReviews}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Done ──
  if (view === 'done') {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <div className="text-6xl">🎉</div>
        <h2 className="mt-4 text-xl font-bold text-slate-800">今日新词已学完</h2>
        <p className="mt-2 text-sm text-slate-500">已学 {learnedToday} 个新词</p>
        {dueReviews > 0 ? (
          <a href="/review" className="mt-6 inline-block rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg active:scale-95">
            🔄 去复习巩固（{dueReviews}词待复习）
          </a>
        ) : (
          <p className="mt-4 text-sm text-slate-400">暂无待复习单词</p>
        )}
        <button onClick={goToBooks} className="mt-4 text-sm font-medium text-blue-600 active:scale-95">← 返回词书</button>
      </div>
    )
  }

  // ── Learning ──
  const word = words[currentIdx]
  if (!word) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4">
        <div className="text-5xl">🎉</div>
        <p className="mt-3 text-slate-600">今日新词已学完</p>
        <button onClick={goToBooks} className="mt-4 rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-medium text-white active:scale-95">返回词书</button>
      </div>
    )
  }

  const isNoun = word.type === 'noun'
  const progressPct = dailyTarget > 0 ? Math.round((learnedToday / dailyTarget) * 100) : 0

  return (
    <div className="flex h-full flex-col">
      {/* Top bar — gradient progress */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          <button onClick={goToBooks} className="text-sm font-medium text-blue-600 active:scale-95">← 返回</button>
          <span className="text-xs font-medium text-slate-500">今日 {learnedToday}/{dailyTarget}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500"
            style={{ width: `${Math.min(progressPct, 100)}%` }} />
        </div>
      </div>

      {/* Card + buttons — centered as one group */}
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
        <button onClick={showMeaning ? undefined : handleReveal}
          className="w-full max-w-sm text-center active:scale-[0.98]">
          <p className="text-[42px] font-bold leading-tight text-slate-800">{word.word}</p>
          <p className="mt-1.5 text-sm text-slate-400">{word.accented}</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {isNoun ? '名词' : '动词'}
            </span>
            {isNoun && (
              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                {word.gender === 'm' ? '阳性' : word.gender === 'f' ? '阴性' : word.gender === 'n' ? '中性' : '复数'}
              </span>
            )}
            {!isNoun && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                {word.aspect === 'perfective' ? '完成体' : '未完成体'}
              </span>
            )}
          </div>

          {/* Meaning — fade in */}
          <div className={`mt-4 transition-all duration-300 ${fadingIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
            {showMeaning ? (
              <>
                <p className="text-xl text-slate-700">{word.meaning}</p>
                {word.example && <p className="mt-2 text-xs italic text-slate-400">{word.example}</p>}
                {word.example_cn && <p className="text-xs text-slate-400">{word.example_cn}</p>}
              </>
            ) : (
              <p className="text-sm text-slate-300">点击卡片显示释义</p>
            )}
          </div>

          <button onClick={(e) => { e.stopPropagation(); setShowDetail(true) }}
            className={`mt-2 text-xs font-medium text-blue-500 active:scale-95 transition-opacity ${showMeaning ? 'opacity-100' : 'opacity-0'}`}>
            查看变格/变位详情 →
          </button>
        </button>

        {/* Three buttons + quick skip */}
        <div className="w-full max-w-sm space-y-2.5">
          {showMeaning ? (
            <div className="flex gap-3">
              <button onClick={() => handleResult('unknown')}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white shadow-sm active:scale-95 active:bg-red-600">
                不认识
              </button>
              <button onClick={() => handleResult('fuzzy')}
                className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white shadow-sm active:scale-95 active:bg-amber-600">
                模糊
              </button>
              <button onClick={() => handleResult('known')}
                className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-sm active:scale-95 active:bg-emerald-600">
                认识
              </button>
            </div>
          ) : (
            <button onClick={() => handleResult('unknown')}
              className="w-full rounded-xl border-2 border-red-200 py-2.5 text-sm font-medium text-red-500 active:scale-95 active:bg-red-50">
              完全不认识，直接跳过
            </button>
          )}
        </div>
      </div>

      {showDetail && <WordDetailPopup word={word} onClose={() => setShowDetail(false)} />}
    </div>
  )
}
