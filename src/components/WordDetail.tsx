import { useState } from 'react'
import type { WordData, NounData, VerbData } from '../db/database'
import CaseTable from './CaseTable'
import VerbConjugationTable from './VerbConjugationTable'

interface WordDetailProps {
  word: WordData
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
  mode: 'fast' | 'deep'
}

export default function WordDetail({
  word,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  mode,
}: WordDetailProps) {
  const [showDeep, setShowDeep] = useState(mode === 'deep')

  const isNoun = word.type === 'noun'
  const isVerb = word.type === 'verb'

  const genderLabel: Record<string, string> = {
    m: '阳性',
    f: '阴性',
    n: '中性',
    pl: '复数',
  }

  const sceneLabel: Record<string, string> = {
    campus: '🏫 校园',
    shopping: '🛒 消费',
    housing: '🏠 租房',
    medical: '🏥 就医',
    social: '💬 社交',
    general: '📖 通用',
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 safe-area-top">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 active:scale-95"
        >
          ← 返回
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeep(!showDeep)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              showDeep
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {showDeep ? '深度模式' : '快速模式'}
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="text-sm text-blue-600 active:scale-95 disabled:opacity-30"
          >
            ←
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="text-sm text-blue-600 active:scale-95 disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {/* Word header */}
        <div className="mb-5 text-center">
          <h1 className="text-3xl font-bold text-slate-800">{word.word}</h1>
          <p className="mt-1 text-sm text-slate-500">{word.accented}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700">
              {isNoun ? '名词' : isVerb ? '动词' : '其他'}
            </span>
            {isNoun && (
              <span className="rounded-full bg-purple-100 px-3 py-0.5 text-xs font-medium text-purple-700">
                {genderLabel[(word as NounData).gender]}
              </span>
            )}
            {isVerb && (
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-medium text-emerald-700">
                {(word as VerbData).aspect === 'perfective' ? '完成体' : '未完成体'}
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-600">
              {sceneLabel[word.scene] || word.scene}
            </span>
            <span className="text-yellow-500 text-xs">
              {'★'.repeat(word.practicality)}{'☆'.repeat(5 - word.practicality)}
            </span>
          </div>
          <p className="mt-3 text-base text-slate-600">
            {word.meaning || word.meaningEn}
          </p>
        </div>

        {/* Noun case tables */}
        {isNoun && (
          <>
            <CaseTable
              cases={(word as NounData).cases}
              title="单数变格"
              subtitle="единственное число"
            />

            <CaseTable
              cases={(word as NounData).plural_cases}
              title="复数变格"
              subtitle="множественное число"
            />

            {/* Deep mode: confused words */}
            {showDeep && (word as NounData).confused_with.length > 0 && (
              <div className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <h3 className="text-sm font-semibold text-orange-800">易混辨析</h3>
                <p className="mt-2 text-sm text-orange-700">
                  易混词：{(word as NounData).confused_with.join('、')}
                </p>
                {(word as NounData).confused_note && (
                  <p className="mt-1 text-xs text-orange-600">
                    {(word as NounData).confused_note}
                  </p>
                )}
              </div>
            )}

            {/* Partner word */}
            {showDeep && (word as NounData).partner && (
              <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-700">对应词</h3>
                <p className="mt-1 text-base text-slate-800">{(word as NounData).partner}</p>
              </div>
            )}
          </>
        )}

        {/* Verb conjugation */}
        {isVerb && (
          <>
            <VerbConjugationTable verb={word as VerbData} />

            {/* Government */}
            {showDeep && (word as VerbData).government && (
              <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="text-sm font-semibold text-blue-800">支配格</h3>
                <p className="mt-1 text-sm text-blue-700">{(word as VerbData).government}</p>
              </div>
            )}

            {/* Aspect pair */}
            {showDeep && (word as VerbData).partner && (
              <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-700">体对应词</h3>
                <p className="mt-1 text-base text-slate-800">{(word as VerbData).partner}</p>
              </div>
            )}

            {/* Aspect usage */}
            {showDeep && (word as VerbData).aspect_usage && (
              <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <h3 className="text-sm font-semibold text-violet-800">体用法</h3>
                <p className="mt-1 text-sm text-violet-700">{(word as VerbData).aspect_usage}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="border-t border-slate-200 bg-white px-4 py-3 safe-area-bottom">
        <div className="flex gap-3">
          <button className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-medium text-red-600 active:scale-95">
            不记得
          </button>
          <button className="flex-1 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-sm font-medium text-amber-600 active:scale-95">
            模糊
          </button>
          <button className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-medium text-emerald-600 active:scale-95">
            已掌握
          </button>
        </div>
      </div>
    </div>
  )
}
