import Dexie, { type Table } from 'dexie'

// ── Word Types ────────────────────────────────────────

export interface CaseForm {
  form: string
  usage: string
  highlight: boolean
}

export interface NounData {
  id: string
  word: string
  accented: string
  type: 'noun'
  gender: 'm' | 'f' | 'n' | 'pl'
  animate: boolean
  meaning: string
  meaningEn: string
  scene: string
  practicality: number
  bookId: string
  cases: Record<string, CaseForm>
  plural_cases: Record<string, CaseForm>
  confused_with: string[]
  confused_note: string
  partner: string
  example: string
  example_cn: string
}

export interface VerbConjugation {
  present: Record<string, string>
  past: Record<string, string>
  imperative: Record<string, string>
}

export interface VerbData {
  id: string
  word: string
  accented: string
  type: 'verb'
  aspect: 'imperfective' | 'perfective'
  partner: string
  meaning: string
  meaningEn: string
  scene: string
  practicality: number
  bookId: string
  government: string
  conjugation: VerbConjugation
  aspect_usage: string
  example: string
  example_cn: string
}

export type WordData = NounData | VerbData

// ── Progress Types ────────────────────────────────────

export type LearnResult = 'known' | 'fuzzy' | 'unknown'

export interface UserProgress {
  wordId: string
  status: 'new' | 'learning' | 'review' | 'mastered'
  ease: number              // 1-5, higher = longer intervals
  interval: number          // days until next review
  lastReview: number        // timestamp
  nextReview: number        // timestamp
  reviewCount: number
  correctCount: number
  incorrectCount: number
  learnedAt: number
}

export interface ReviewLog {
  id?: number
  wordId: string
  timestamp: number
  result: LearnResult
}

export interface WordBook {
  id: string
  name: string
  wordCount: number
  learnedCount: number
  createdAt: number
  order: number
}

export interface UsedWord {
  word: string
  bookId: string
  addedAt: number
}

export interface Settings {
  dailyNewWords: number
}

// ── Database ──────────────────────────────────────────

class RussianVocabDB extends Dexie {
  wordBank!: Table<WordData, string>
  userProgress!: Table<UserProgress, string>
  reviewLog!: Table<ReviewLog, number>
  wordBooks!: Table<WordBook, string>
  usedWords!: Table<UsedWord, string>
  settings!: Table<Settings, string>

  constructor() {
    super('RussianVocabV3')

    this.version(1).stores({
      wordBank: 'id, word, type, bookId',
      userProgress: 'wordId, status, nextReview, lastReview',
      reviewLog: '++id, wordId, timestamp, result',
      wordBooks: 'id, name, order',
      usedWords: 'word, bookId',
      settings: 'key',
    })
  }
}

export const db = new RussianVocabDB()

// ── Helpers ───────────────────────────────────────────

export async function isDataImported(): Promise<boolean> {
  const count = await db.wordBank.count()
  return count > 0
}

export async function getDailyNewWords(): Promise<number> {
  const s = await db.settings.get('dailyNewWords')
  return s ? (s as unknown as number) : 20
}

export async function setDailyNewWords(n: number): Promise<void> {
  await db.settings.put({ key: 'dailyNewWords' as any, dailyNewWords: n } as any)
}

// ── Ebbinghaus intervals (in days) based on ease ──────
// ease 1 → intervals: 1, 3, 7, 14, 30, 60, 120
// ease 5 → intervals: 30, 60, 120, 240, 360
const INTERVALS = [1, 3, 7, 14, 30, 60, 120, 240, 360]

export function getNextInterval(ease: number, reviewCount: number, result: LearnResult): number {
  // Adjust ease based on result
  let newEase = ease
  if (result === 'known') newEase = Math.min(5, ease + 1)
  else if (result === 'fuzzy') newEase = Math.max(1, ease)
  else newEase = Math.max(1, ease - 1)

  // Get interval from the table
  const idx = Math.min(reviewCount, INTERVALS.length - 1)
  const baseInterval = INTERVALS[idx] || 30

  // Scale by ease
  const multiplier = [0.3, 0.5, 1, 1.5, 2][newEase - 1] || 1
  return Math.max(1, Math.round(baseInterval * multiplier))
}
