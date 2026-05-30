import type { VerbData } from '../db/database'

interface VerbConjugationTableProps {
  verb: VerbData
}

const PERSON_LABELS: Record<string, string> = {
  'я': 'я 我',
  'ты': 'ты 你',
  'он/она': 'он/она 他/她',
  'мы': 'мы 我们',
  'вы': 'вы 你们/您',
  'они': 'они 他们',
}

const PAST_LABELS: Record<string, string> = {
  'm': '阳性 он',
  'f': '阴性 она',
  'n': '中性 оно',
  'pl': '复数 они',
}

const IMPERATIVE_LABELS: Record<string, string> = {
  'sg': '单数 (ты)',
  'pl': '复数 (вы)',
}

export default function VerbConjugationTable({ verb }: VerbConjugationTableProps) {
  const { conjugation } = verb
  const hasPresent = Object.values(conjugation.present).some((v) => v)
  const hasPast = Object.values(conjugation.past).some((v) => v)
  const hasImperative = Object.values(conjugation.imperative).some((v) => v)

  return (
    <div className="space-y-4">
      {/* Present / Future */}
      {hasPresent && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-700">
              {verb.aspect === 'perfective' ? '将来时变位' : '现在时变位'}
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {Object.entries(conjugation.present).map(([person, form]) => (
              <div key={person} className="flex items-center px-4 py-3">
                <div className="w-28 shrink-0">
                  <span className="text-xs text-slate-500">
                    {PERSON_LABELS[person] || person}
                  </span>
                </div>
                <div>
                  <span className="text-base font-medium text-slate-800">{form || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {hasPast && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-700">过去时</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {Object.entries(conjugation.past).map(([form, value]) => (
              <div key={form} className="flex items-center px-4 py-3">
                <div className="w-28 shrink-0">
                  <span className="text-xs text-slate-500">
                    {PAST_LABELS[form] || form}
                  </span>
                </div>
                <div>
                  <span className="text-base font-medium text-slate-800">{value || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Imperative */}
      {hasImperative && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-700">命令式</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {Object.entries(conjugation.imperative).map(([form, value]) => (
              <div key={form} className="flex items-center px-4 py-3">
                <div className="w-28 shrink-0">
                  <span className="text-xs text-slate-500">
                    {IMPERATIVE_LABELS[form] || form}
                  </span>
                </div>
                <div>
                  <span className="text-base font-medium text-slate-800">{value || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
