/**
 * Fix verb translations — re-translate with "to " prefix to disambiguate.
 * Run: npx tsx scripts/fixVerbs.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const FILE = path.join('public', 'wordBank.json')
const SEP = ' =+= '

async function translateBatch(texts: string[]): Promise<string[]> {
  const joined = texts.join(SEP)
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(joined)}`
  const resp = await fetch(url)
  const raw: any = await resp.json()
  const results: string[] = []
  if (Array.isArray(raw) && Array.isArray(raw[0])) {
    for (const item of raw[0]) {
      if (Array.isArray(item) && item[0]) {
        results.push(String(item[0]).replace(/\s*= \+= \s*/g, '').trim())
      }
    }
  }
  while (results.length < texts.length) results.push('')
  return results.slice(0, texts.length)
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  const words: any[] = JSON.parse(fs.readFileSync(FILE, 'utf-8'))
  const verbs = words.filter((w: any) => w.type === 'verb')
  console.log(`🔧 Fixing ${verbs.length} verbs...`)

  const BATCH = 20
  let done = 0

  for (let i = 0; i < verbs.length; i += BATCH) {
    const batch = verbs.slice(i, i + BATCH)
    // Prefix "to " to disambiguate verb vs noun
    const texts = batch.map((v: any) => `to ${v.meaningEn}`)

    let translations: string[] = []
    try { translations = await translateBatch(texts) }
    catch { await sleep(2000); try { translations = await translateBatch(texts) } catch {} }

    for (let j = 0; j < batch.length && j < translations.length; j++) {
      if (translations[j]) {
        // Clean up "to " in translation result (sometimes Google keeps it)
        let clean = translations[j]
          .replace(/^去\s*/, '')  // "去吃" → "吃"
          .replace(/^到\s*/, '')
          .trim()
        if (clean) batch[j].meaning = clean
      }
    }

    done += batch.length
    if (done % 100 === 0) console.log(`   ${done}/${verbs.length}`)
    if (i + BATCH < verbs.length) await sleep(1500)
  }

  fs.writeFileSync(FILE, JSON.stringify(words, null, 2), 'utf-8')
  console.log('✅ Verb translations updated.')

  // Show a few samples
  console.log('\n📋 Samples:')
  verbs.slice(0, 15).forEach((v: any) => console.log(`   ${v.word} → ${v.meaning}`))
}

main().catch(console.error)
