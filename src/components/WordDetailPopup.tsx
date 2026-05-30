import type { WordData, NounData, VerbData } from '../db/database'
import CaseTable from './CaseTable'
import VerbConjugationTable from './VerbConjugationTable'

interface Props { word: WordData; onClose: () => void }

export default function WordDetailPopup({ word, onClose }: Props) {
  const isNoun = word.type === 'noun'

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Sheet */}
      <div
        className="relative max-h-[80vh] overflow-y-auto rounded-t-3xl bg-slate-50 px-4 pb-8 pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300" />

        {/* Word header */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-slate-800">{word.word}</h2>
          <p className="text-sm text-slate-500">{word.accented}</p>
          <p className="mt-1 text-base text-slate-600">{word.meaning}</p>
        </div>

        {/* Noun cases */}
        {isNoun && (
          <>
            <CaseTable cases={(word as NounData).cases} title="单数变格" />
            <CaseTable cases={(word as NounData).plural_cases} title="复数变格" />
            {(word as NounData).confused_with?.length > 0 && (
              <div className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm font-semibold text-orange-800">易混辨析</p>
                <p className="mt-1 text-xs text-orange-700">易混词：{(word as NounData).confused_with.join('、')}</p>
                {(word as NounData).confused_note && <p className="mt-1 text-xs text-orange-600">{(word as NounData).confused_note}</p>}
              </div>
            )}
          </>
        )}

        {/* Verb conjugation */}
        {!isNoun && (
          <>
            <VerbConjugationTable verb={word as VerbData} />
            {(word as VerbData).government && (
              <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-800">支配格</p>
                <p className="mt-1 text-sm text-blue-700">{(word as VerbData).government}</p>
              </div>
            )}
            {(word as VerbData).aspect_usage && (
              <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <p className="text-sm font-semibold text-violet-800">体用法</p>
                <p className="mt-1 text-sm text-violet-700">{(word as VerbData).aspect_usage}</p>
              </div>
            )}
          </>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-xl bg-slate-200 py-3 text-sm font-medium text-slate-600 active:scale-95"
        >
          关闭
        </button>
      </div>
    </div>
  )
}
