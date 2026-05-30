import type { CaseForm } from '../db/database'

interface CaseTableProps {
  cases: Record<string, CaseForm>
  title: string
  subtitle?: string
}

const CASE_ORDER = ['nominative', 'genitive', 'dative', 'accusative', 'instrumental', 'prepositional']
const CASE_NUMBERS: Record<string, string> = {
  nominative: '第一格',
  genitive: '第二格',
  dative: '第三格',
  accusative: '第四格',
  instrumental: '第五格',
  prepositional: '第六格',
}

export default function CaseTable({ cases, title, subtitle }: CaseTableProps) {
  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
      <div className="divide-y divide-slate-100">
        {CASE_ORDER.map((caseKey) => {
          const data = cases[caseKey]
          if (!data) return null
          return (
            <div
              key={caseKey}
              className={`flex items-center px-4 py-3 transition-colors ${
                data.highlight
                  ? 'bg-amber-50/50'
                  : ''
              }`}
            >
              <div className="w-20 shrink-0">
                <span className="text-xs font-medium text-slate-400">
                  {CASE_NUMBERS[caseKey]}
                </span>
              </div>
              <div className="flex-1">
                <span
                  className={`text-base font-medium ${
                    data.highlight ? 'text-red-600' : 'text-slate-800'
                  }`}
                >
                  {data.form}
                </span>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xs text-slate-400">{data.usage}</span>
                {data.highlight && (
                  <span className="ml-1.5 inline-block rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                    常用
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { CASE_ORDER, CASE_NUMBERS }
