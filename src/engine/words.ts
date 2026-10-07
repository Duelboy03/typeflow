import { mulberry32 } from './prng'
import { QUOTES, quoteBucket, type Quote } from './quotes'
import type { TestConfig } from './types'
import { WORDS } from './wordlist'

const PUNCT_END = ['.', ',', '?', '!', ';', ':']

/**
 * Build the word list for a test. Pass a seed to get a reproducible list,
 * which keeps tests deterministic and lets "repeat test" replay the same text.
 */
export function generateWords(config: TestConfig, count: number, seed: number): string[] {
  const rand = mulberry32(seed)
  const out: string[] = []
  let capitalizeNext = config.punctuation

  for (let i = 0; i < count; i++) {
    let w: string
    if (config.numbers && rand() < 0.12) {
      const digits = 1 + Math.floor(rand() * 4)
      w = Array.from({ length: digits }, () => Math.floor(rand() * 10)).join('')
    } else {
      w = WORDS[Math.floor(rand() * WORDS.length)]
    }

    if (config.punctuation && !/^\d+$/.test(w)) {
      if (capitalizeNext) {
        w = w[0].toUpperCase() + w.slice(1)
        capitalizeNext = false
      }
      const r = rand()
      if (r < 0.14) {
        const p = PUNCT_END[Math.floor(rand() * PUNCT_END.length)]
        w += p
        if (p === '.' || p === '?' || p === '!') capitalizeNext = true
      } else if (r < 0.2) {
        w = `"${w}"`
      } else if (r < 0.24) {
        w = `${w}-${WORDS[Math.floor(rand() * WORDS.length)]}`
      }
    }
    out.push(w)
  }
  return out
}

export function pickQuote(config: TestConfig, seed: number): Quote {
  const pool = QUOTES.filter((q) => quoteBucket(q) === config.quoteLength)
  const list = pool.length ? pool : QUOTES
  return list[Math.floor(mulberry32(seed)() * list.length)]
}

/** Initial words for a config. Time mode gets a long buffer that grows on demand. */
export function initialWords(config: TestConfig, seed: number): { words: string[]; quote?: Quote } {
  if (config.mode === 'quote') {
    const quote = pickQuote(config, seed)
    return { words: quote.text.split(' '), quote }
  }
  const count = config.mode === 'words' ? config.words : 120
  return { words: generateWords(config, count, seed) }
}
