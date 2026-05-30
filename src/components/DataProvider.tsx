import { useState, useEffect, type ReactNode } from 'react'
import { initializeDatabase } from '../db/importService'

export default function DataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('正在初始化…')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        setStatus('loading')
        setMessage('正在检查词库…')
        const result = await initializeDatabase()
        if (cancelled) return
        setMessage(result.wasNew ? `词库导入完成，共 ${result.wordCount} 词` : `词库已就绪，共 ${result.wordCount} 词`)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '未知错误')
        setStatus('error')
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8">
        <div className="mb-4 text-5xl">📚</div>
        <div className="mb-3 h-1.5 w-48 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full animate-pulse rounded-full bg-blue-500" style={{ width: '60%' }} />
        </div>
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8">
        <div className="mb-4 text-5xl">⚠️</div>
        <h2 className="mb-2 text-lg font-semibold text-slate-700">词库加载失败</h2>
        <p className="mb-4 text-center text-sm text-slate-500">{error}</p>
        <button onClick={() => window.location.reload()} className="rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-medium text-white active:scale-95">重试</button>
      </div>
    )
  }

  return <>{children}</>
}
