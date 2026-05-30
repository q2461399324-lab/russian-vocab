import { useState, useEffect, useCallback } from 'react'
import { getDueReviews, recordLearnResult, getStats } from '../db/importService'
import type { WordData, LearnResult } from '../db/database'
import WordDetailPopup from '../components/WordDetailPopup'

interface ReviewItem {
  word: WordData
  progress: { ease: number; interval: number; reviewCount: number; nextReview: number }
}

export default function ReviewPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
const [_doneCount, setDoneCount] = useState(0)
  const [showDetail, setShowDetail] = useState(false)
  const [finished, setFinished] = useState(false)
  const [stats, setStats] = useState({ known: 0, fuzzy: 0, unknown: 0 })

  const loadReviews = useCallback(async () => {
    setLoading(true)
    const items = await getDueReviews()
    setReviews(items)
    setCurrentIdx(0)
    setFlipped(false)
    setDoneCount(0)
    setFinished(false)
    setStats({ known: 0, fuzzy: 0, unknown: 0 })
    setLoading(false)
  }, [])

  useEffect(() => { loadReviews() }, [loadReviews])

  const handleResult = async (result: LearnResult) => {
    const item = reviews[currentIdx]
    if (!item) return
    await recordLearnResult(item.word.id, result)
    setStats((s) => ({ ...s, [result]: s[result] + 1 }))
    setDoneCount((c) => c + 1)

    if (currentIdx < reviews.length - 1) {
      setCurrentIdx(currentIdx + 1)
      setFlipped(false)
    } else {
      setFinished(true)
    }
  }

  const item = reviews[currentIdx]
  const isNoun = item?.word.type === 'noun'

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800">复习</h1>
          {!finished && reviews.length > 0 && (
            <span className="text-sm font-medium text-slate-500">
              {currentIdx + 1} / {reviews.length}
            </span>
          )}
        </div>
        {reviews.length > 0 && !finished && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
              style={{ width: `${Math.round(((currentIdx + 1) / reviews.length) * 100)}%` }} />
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-1 items-center justify-center"><p className="text-sm text-slate-400">加载中…</p></div>
      )}

      {!loading && !finished && reviews.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center px-8">
          <div className="text-5xl">✅</div>
          <p className="mt-3 text-slate-600">没有待复习的单词</p>
          <p className="mt-1 text-sm text-slate-400">完成学习后会自动安排复习</p>
          <button onClick={loadReviews} className="mt-4 rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-medium text-slate-600 active:scale-95">刷新</button>
        </div>
      )}

      {finished && (
        <div className="flex flex-1 flex-col items-center justify-center px-6">
          <div className="text-5xl">🎯</div>
          <h2 className="mt-4 text-xl font-bold text-slate-800">复习完成</h2>
          <div className="mt-5 flex gap-4">
            <div className="rounded-xl bg-emerald-50 px-5 py-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.known}</div>
              <div className="text-xs text-emerald-500">记得</div>
            </div>
            <div className="rounded-xl bg-amber-50 px-5 py-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.fuzzy}</div>
              <div className="text-xs text-amber-500">模糊</div>
            </div>
            <div className="rounded-xl bg-red-50 px-5 py-3 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.unknown}</div>
              <div className="text-xs text-red-500">忘了</div>
            </div>
          </div>
          <button onClick={loadReviews} className="mt-6 text-sm font-medium text-blue-600 active:scale-95">刷新</button>
        </div>
      )}

      {!loading && !finished && item && (
        <>
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            {/* Review meta */}
            <div className="mb-3 flex items-center gap-3 text-xs text-slate-400">
              <span>熟练度 {'●'.repeat(item.progress.ease)}{'○'.repeat(5 - item.progress.ease)}</span>
              <span>复习 {item.progress.reviewCount + 1} 次</span>
              {item.progress.nextReview < Date.now() && (
                <span className="text-red-400">已过期</span>
              )}
            </div>

            <div onClick={() => setFlipped(!flipped)}
              className="w-full max-w-sm cursor-pointer rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all active:scale-[0.98]">
              {!flipped ? (
                <div className="text-center">
                  <p className="text-xs text-slate-400">回想这个词的意思和变格</p>
                  <p className="mt-3 text-[42px] font-bold leading-tight text-slate-800">{item.word.word}</p>
                  <p className="mt-1.5 text-sm text-slate-400">{item.word.accented}</p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-700">{isNoun ? '名词' : '动词'}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">间隔 {item.progress.interval}天</span>
                  </div>
                  <p className="mt-6 text-sm text-slate-300">点击翻转查看答案</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-800">{item.word.word}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.word.accented}</p>
                  <p className="mt-3 text-xl text-slate-700">{item.word.meaning}</p>
                  {item.word.example && <p className="mt-3 text-xs italic text-slate-400">{item.word.example}</p>}
                  {item.word.example_cn && <p className="text-xs text-slate-400">{item.word.example_cn}</p>}
                  <button onClick={(e) => { e.stopPropagation(); setShowDetail(true) }}
                    className="mt-3 text-xs font-medium text-blue-600 active:scale-95">查看变格/变位详情 →</button>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-4 safe-area-bottom">
            {flipped ? (
              <div className="flex gap-3">
                <button onClick={() => handleResult('unknown')}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white shadow-sm active:scale-95 active:bg-red-600">忘了</button>
                <button onClick={() => handleResult('fuzzy')}
                  className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white shadow-sm active:scale-95 active:bg-amber-600">模糊</button>
                <button onClick={() => handleResult('known')}
                  className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-sm active:scale-95 active:bg-emerald-600">记得</button>
              </div>
            ) : (
              <p className="text-center text-xs text-slate-400">点击卡片翻转后作答</p>
            )}
          </div>
        </>
      )}

      {showDetail && item && <WordDetailPopup word={item.word} onClose={() => setShowDetail(false)} />}
    </div>
  )
}
