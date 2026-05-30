import { db, type WordData, type WordBook, getNextInterval, type LearnResult } from './database'

// ── Import ────────────────────────────────────────────

export async function loadWordBank(): Promise<WordData[]> {
  const resp = await fetch('/wordBank.json')
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

export async function importWordBank(data: WordData[], bookName: string): Promise<string> {
  // Check for duplicate book name
  const existing = await db.wordBooks.where('name').equals(bookName).first()
  if (existing) {
    console.log(`📚 Book "${bookName}" already exists, skipping.`)
    return existing.id
  }

  const CHUNK = 500
  const bookId = `book_${Date.now()}`

  console.log(`📥 Importing ${data.length} words as "${bookName}"...`)

  // Track used words for dedup
  const used = data.map((w) => ({ word: w.word, bookId, addedAt: Date.now() }))
  await db.usedWords.bulkPut(used)

  // Import words
  for (let i = 0; i < data.length; i += CHUNK) {
    const chunk = data.slice(i, i + CHUNK)
    chunk.forEach((w) => (w.bookId = bookId))
    await db.wordBank.bulkPut(chunk)
    console.log(`   ${Math.min(i + CHUNK, data.length)}/${data.length}`)
  }

  // Create book record
  const book: WordBook = {
    id: bookId, name: bookName, wordCount: data.length,
    learnedCount: 0, createdAt: Date.now(),
    order: (await db.wordBooks.count()) + 1,
  }
  await db.wordBooks.put(book)

  console.log(`✅ Done: "${bookName}" (${data.length} words)`)
  return bookId
}

export async function initializeDatabase(): Promise<{ wordCount: number; wasNew: boolean }> {
  const count = await db.wordBank.count()
  if (count > 0) {
    console.log(`📚 ${count} words in DB.`)
    return { wordCount: count, wasNew: false }
  }
  console.log('📦 Importing word bank...')
  const data = await loadWordBank()
  await importWordBank(data, '树人常用俄语1500词（一）')
  return { wordCount: data.length, wasNew: true }
}

// ── Books ─────────────────────────────────────────────

export async function getWordBooks(): Promise<WordBook[]> {
  return db.wordBooks.orderBy('order').toArray()
}

export async function getWordsByBook(bookId: string): Promise<WordData[]> {
  return db.wordBank.where('bookId').equals(bookId).toArray()
}

// ── Learning ──────────────────────────────────────────

export async function getNewWordsForToday(bookId: string, limit: number): Promise<WordData[]> {
  const all = await getWordsByBook(bookId)
  const newWords: WordData[] = []
  for (const w of all) {
    const p = await db.userProgress.get(w.id)
    if (!p) newWords.push(w)
  }
  // Shuffle
  for (let i = newWords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newWords[i], newWords[j]] = [newWords[j], newWords[i]]
  }
  return newWords.slice(0, limit)
}

export async function getRemainingNewCount(bookId: string): Promise<number> {
  const all = await getWordsByBook(bookId)
  let count = 0
  for (const w of all) {
    const p = await db.userProgress.get(w.id)
    if (!p) count++
  }
  return count
}

export async function recordLearnResult(
  wordId: string, result: LearnResult
): Promise<void> {
  const now = Date.now()
  const existing = await db.userProgress.get(wordId)

  let ease: number, reviewCount: number, correctCount: number, incorrectCount: number

  if (existing) {
    ease = existing.ease
    reviewCount = existing.reviewCount + 1
    correctCount = existing.correctCount + (result === 'known' ? 1 : 0)
    incorrectCount = existing.incorrectCount + (result === 'unknown' ? 1 : 0)
  } else {
    ease = 3
    reviewCount = 0
    correctCount = result === 'known' ? 1 : 0
    incorrectCount = result === 'unknown' ? 1 : 0
  }

  const interval = getNextInterval(ease, reviewCount, result)
  const newEase = result === 'known' ? Math.min(5, ease + 1)
    : result === 'fuzzy' ? ease
    : Math.max(1, ease - 1)

  const status = result === 'known' && newEase >= 4 ? 'mastered'
    : result === 'known' ? 'review'
    : 'learning'

  await db.userProgress.put({
    wordId, status, ease: newEase, interval,
    lastReview: now, nextReview: now + interval * 86400000,
    reviewCount, correctCount, incorrectCount,
    learnedAt: existing?.learnedAt || now,
  })

  await db.reviewLog.add({ wordId, timestamp: now, result })
}

// ── Review ────────────────────────────────────────────

export async function getDueReviews(): Promise<{ word: WordData; progress: { ease: number; interval: number; reviewCount: number; nextReview: number } }[]> {
  const now = Date.now()
  const all = await db.userProgress
    .where('status').anyOf('learning', 'review')
    .filter((p) => p.nextReview <= now)
    .toArray()

  const results: any[] = []
  for (const p of all) {
    const word = await db.wordBank.get(p.wordId)
    if (word) results.push({ word, progress: { ease: p.ease, interval: p.interval, reviewCount: p.reviewCount, nextReview: p.nextReview } })
  }
  // Sort by urgency (overdue first)
  results.sort((a, b) => a.progress.nextReview - b.progress.nextReview)
  return results
}

export async function getDueReviewCount(): Promise<number> {
  const now = Date.now()
  return db.userProgress
    .where('status').anyOf('learning', 'review')
    .filter((p) => p.nextReview <= now)
    .count()
}

// ── Stats ─────────────────────────────────────────────

export async function getStats() {
  const [total, progress] = await Promise.all([
    db.wordBank.count(),
    db.userProgress.toArray(),
  ])
  const mastered = progress.filter((p) => p.status === 'mastered').length
  const learning = progress.filter((p) => p.status === 'learning' || p.status === 'review').length
  const remaining = total - progress.length
  return { total, mastered, learning, remaining }
}

// ── Used words ────────────────────────────────────────

export async function isWordUsed(word: string): Promise<boolean> {
  const c = await db.usedWords.where('word').equals(word).count()
  return c > 0
}

export async function getUsedWords(): Promise<string[]> {
  const all = await db.usedWords.toArray()
  return all.map((u) => u.word)
}

// ── Settings ──────────────────────────────────────────

export async function getDailyTarget(): Promise<number> {
  const s = await db.settings.get('dailyNewWords' as any)
  return (s as any)?.dailyNewWords || 20
}

export async function setDailyTarget(n: number): Promise<void> {
  await db.settings.put({ key: 'dailyNewWords' as any, dailyNewWords: n } as any)
}

// ── Export / Import ───────────────────────────────────

export async function exportData(): Promise<string> {
  const data = {
    progress: await db.userProgress.toArray(),
    reviewLogs: await db.reviewLog.toArray(),
    usedWords: await db.usedWords.toArray(),
    books: await db.wordBooks.toArray(),
    settings: await db.settings.toArray(),
    exportedAt: new Date().toISOString(),
  }
  return JSON.stringify(data, null, 2)
}

export async function importData(json: string): Promise<void> {
  const data = JSON.parse(json)
  if (data.progress) await db.userProgress.bulkPut(data.progress)
  if (data.reviewLogs) await db.reviewLog.bulkPut(data.reviewLogs)
  if (data.usedWords) await db.usedWords.bulkPut(data.usedWords)
  if (data.books) await db.wordBooks.bulkPut(data.books)
  if (data.settings) await db.settings.bulkPut(data.settings)
}
