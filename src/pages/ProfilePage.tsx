import { useState, useEffect } from 'react'
import { getStats, getDailyTarget, setDailyTarget, exportData, importData, getDueReviewCount } from '../db/importService'

export default function ProfilePage() {
  const [stats, setStats] = useState({ total: 0, mastered: 0, learning: 0, remaining: 0 })
  const [target, setTarget] = useState(20)
  const [dueReviews, setDueReviews] = useState(0)
  const [showTargetPicker, setShowTargetPicker] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const [s, t, d] = await Promise.all([getStats(), getDailyTarget(), getDueReviewCount()])
      setStats(s)
      setTarget(t)
      setDueReviews(d)
    })()
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const handleTargetChange = async (n: number) => {
    setTarget(n)
    await setDailyTarget(n)
    setShowTargetPicker(false)
    showToast(`每日新词目标已更新为 ${n} 个`)
  }

  const handleExport = async () => {
    try {
      const json = await exportData()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `俄语背词_备份_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('数据已导出')
    } catch { showToast('导出失败') }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        await importData(text)
        showToast('数据已导入，请刷新页面')
        setTimeout(() => window.location.reload(), 1500)
      } catch { showToast('导入失败：文件格式不正确') }
    }
    input.click()
  }

  return (
    <div className="page-content px-4 pt-6">
      <h1 className="text-2xl font-bold text-slate-800">我的</h1>

      {/* Stats */}
      <section className="mt-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">学习概览</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-blue-50 p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.mastered}</div>
              <div className="mt-1 text-xs text-blue-500">已掌握</div>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 text-center">
              <div className="text-3xl font-bold text-amber-600">{stats.learning}</div>
              <div className="mt-1 text-xs text-amber-500">学习中</div>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 text-center">
              <div className="text-3xl font-bold text-emerald-600">{stats.remaining}</div>
              <div className="mt-1 text-xs text-emerald-500">未学习</div>
            </div>
            <div className="rounded-xl bg-purple-50 p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{dueReviews}</div>
              <div className="mt-1 text-xs text-purple-500">待复习</div>
            </div>
          </div>
        </div>
      </section>

      {/* Target setting */}
      <section className="mt-4">
        <button
          onClick={() => setShowTargetPicker(!showTargetPicker)}
          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left active:scale-[0.98]"
        >
          <div>
            <h3 className="text-sm font-semibold text-slate-700">每日新词目标</h3>
            <p className="mt-0.5 text-xs text-slate-400">每天学习新词数量</p>
          </div>
          <span className="text-lg font-bold text-blue-600">{target} 词</span>
        </button>

        {showTargetPicker && (
          <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 20, 25, 30, 40, 50, 100].map((n) => (
                <button
                  key={n}
                  onClick={() => handleTargetChange(n)}
                  className={`rounded-xl py-2.5 text-sm font-medium transition-all active:scale-95 ${
                    target === n
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Data management */}
      <section className="mt-4 space-y-2">
        <button
          onClick={handleExport}
          className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left active:scale-[0.98]"
        >
          <span className="text-xl">📤</span>
          <div>
            <div className="text-sm font-semibold text-slate-700">导出数据</div>
            <div className="text-xs text-slate-400">备份学习进度</div>
          </div>
        </button>

        <button
          onClick={handleImport}
          className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left active:scale-[0.98]"
        >
          <span className="text-xl">📥</span>
          <div>
            <div className="text-sm font-semibold text-slate-700">导入数据</div>
            <div className="text-xs text-slate-400">恢复之前的备份</div>
          </div>
        </button>
      </section>

      <section className="mt-8 mb-4 text-center">
        <p className="text-xs text-slate-400">🇷🇺 俄语背词 · v0.2.0</p>
      </section>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-800 px-5 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
