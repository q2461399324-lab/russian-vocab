/**
 * Enrich wordBank.json with Chinese translations.
 * Uses direct Google Translate HTTP endpoint (reliable, fast).
 * Run: npx tsx scripts/enrichChinese.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const FILE = path.join('public', 'wordBank.json')
const SEPARATOR = ' ||| '
const BATCH_SIZE = 25
const DELAY = 1200 // 1.2s between batches

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function translateBatch(texts: string[]): Promise<string[]> {
  const joined = texts.join(SEPARATOR)
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(joined)}`

  const resp = await fetch(url)
  const raw: any = await resp.json()

  // Parse response: [[["trans1","orig1",...],["trans2","orig2",...],...],...]
  const results: string[] = []
  if (Array.isArray(raw) && Array.isArray(raw[0])) {
    for (const item of raw[0]) {
      if (Array.isArray(item) && item[0]) {
        // Clean up: remove separator artifacts that may leak through
        let text = String(item[0]).replace(/\s*\|\|\|\s*/g, '').trim()
        results.push(text)
      }
    }
  }

  // If we got fewer results than inputs, pad with empty
  while (results.length < texts.length) results.push('')
  return results.slice(0, texts.length)
}

async function main() {
  const words: any[] = JSON.parse(fs.readFileSync(FILE, 'utf-8'))
  const needsZH = words.filter((w: any) => !w.meaning || w.meaning.trim() === '')
  console.log(`🔧 Words needing Chinese: ${needsZH.length}/${words.length}`)

  if (needsZH.length === 0) { console.log('All done!'); return }

  let done = 0, failed = 0

  for (let i = 0; i < needsZH.length; i += BATCH_SIZE) {
    const batch = needsZH.slice(i, i + BATCH_SIZE)
    const englishTexts = batch.map((w: any) => w.meaningEn)

    let translations: string[] = []
    try {
      translations = await translateBatch(englishTexts)
    } catch (e) {
      console.log(`   Batch err at ${i}: ${e}`)
      await sleep(3000)
      try { translations = await translateBatch(englishTexts) } catch { translations = [] }
    }

    for (let j = 0; j < batch.length && j < translations.length; j++) {
      if (translations[j]) {
        const word = words.find((w: any) => w.id === batch[j].id)
        if (word) word.meaning = translations[j]
      } else {
        failed++
      }
    }

    done += batch.length
    if (done % 100 === 0) {
      const pct = Math.round(done / needsZH.length * 100)
      console.log(`   ${done}/${needsZH.length} (${pct}%) - failed: ${failed}`)
    }

    if (i + BATCH_SIZE < needsZH.length) await sleep(DELAY)
  }

  const remaining = words.filter((w: any) => !w.meaning || w.meaning.trim() === '').length
  const success = needsZH.length - remaining
  console.log(`\n📊 Translated: ${success}/${needsZH.length}, failed: ${remaining}`)

  fs.writeFileSync(FILE, JSON.stringify(words, null, 2), 'utf-8')
  console.log('✅ Saved.')
}

main().catch(console.error)
