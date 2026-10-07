import { describe, expect, it } from 'vitest'
import { accuracy, consistency, correctChars, keyStats, wpmFromChars } from './metrics'
import { createSession, reduce, type Action } from './session'
import { DEFAULT_CONFIG } from './types'
import { generateWords, initialWords, pickQuote } from './words'

function run(words: string[], text: string, step = 100): ReturnType<typeof createSession> {
  let s = createSession(words)
  let t = 0
  for (const ch of text) {
    t += step
    const a: Action = ch === ' ' ? { type: 'space', t } : { type: 'char', char: ch, t }
    s = reduce(s, a)
  }
  return s
}

describe('wpmFromChars', () => {
  it('uses the five-characters-per-word convention', () => {
    expect(wpmFromChars(50, 60_000)).toBe(10)
    expect(wpmFromChars(300, 60_000)).toBe(60)
  })
  it('is zero for no elapsed time', () => {
    expect(wpmFromChars(100, 0)).toBe(0)
  })
})

describe('session reducer', () => {
  it('starts on the first character and ignores a leading space', () => {
    let s = createSession(['hello', 'world', 'again'])
    s = reduce(s, { type: 'space', t: 10 })
    expect(s.status).toBe('idle')
    s = reduce(s, { type: 'char', char: 'h', t: 500 })
    expect(s.status).toBe('running')
    expect(s.keystrokes[0].t).toBe(0)
  })

  it('counts correct words with their trailing space', () => {
    const s = run(['hi', 'there', 'friend'], 'hi there ')
    expect(correctChars(s)).toBe(3 + 6)
  })

  it('does not count an incorrect word', () => {
    const s = run(['hello', 'world', 'again'], 'hellx world ')
    expect(correctChars(s)).toBe(6)
  })

  it('treats a space typed early as an error and skips to the next word', () => {
    const s = run(['hello', 'world', 'again'], 'hel world ')
    expect(s.current).toBe(2)
    expect(s.typed[0]).toBe('hel')
    expect(s.keystrokes.filter((k) => !k.correct)).toHaveLength(1)
  })

  it('caps overflow so a stuck key cannot grow a word forever', () => {
    let s = createSession(['ab', 'cd', 'ef'])
    for (let i = 0; i < 40; i++) s = reduce(s, { type: 'char', char: 'x', t: i * 10 })
    expect(s.input.length).toBe(12)
  })

  it('backspace removes the last character, or the whole word with the modifier', () => {
    let s = run(['hello', 'world', 'again'], 'hel')
    s = reduce(s, { type: 'backspace', t: 1, word: false })
    expect(s.input).toBe('he')
    s = reduce(s, { type: 'backspace', t: 2, word: true })
    expect(s.input).toBe('')
  })

  it('lets you go back into an incorrect previous word but not a correct one', () => {
    let s = run(['cat', 'dog', 'fox'], 'cax ')
    s = reduce(s, { type: 'backspace', t: 1, word: false })
    expect(s.current).toBe(0)
    expect(s.input).toBe('cax')

    let ok = run(['cat', 'dog', 'fox'], 'cat ')
    ok = reduce(ok, { type: 'backspace', t: 1, word: false })
    expect(ok.current).toBe(1)
  })

  it('finishes a words test as soon as the last word is complete', () => {
    const s = run(['go', 'now'], 'go now')
    expect(s.status).toBe('finished')
    expect(s.endedAt).toBe(600)
    expect(correctChars(s)).toBe(3 + 3)
  })

  it('finishes a timed test on the limit and ignores later input', () => {
    let s = run(['a', 'b', 'c', 'd'], 'a ')
    s = reduce(s, { type: 'tick', t: 30_000, limitMs: 30_000 })
    expect(s.status).toBe('finished')
    expect(s.endedAt).toBe(30_000)
    const after = reduce(s, { type: 'char', char: 'b', t: 31_000 })
    expect(after).toBe(s)
    expect(s.samples).toHaveLength(30)
  })

  it('records one sample per elapsed second', () => {
    let s = run(['alpha', 'beta', 'gamma'], 'alpha ', 1000)
    s = reduce(s, { type: 'tick', t: 8000 })
    expect(s.samples.map((x) => x.second)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(s.samples.every((x) => x.wpm >= 0)).toBe(true)
  })
})

describe('accuracy and consistency', () => {
  it('is 100% with no keystrokes', () => {
    expect(accuracy([])).toBe(100)
  })
  it('counts corrected mistakes against accuracy', () => {
    let s = createSession(['cat', 'dog'])
    s = reduce(s, { type: 'char', char: 'x', t: 0 })
    s = reduce(s, { type: 'backspace', t: 10, word: false })
    for (const [i, c] of ['c', 'a', 't'].entries()) s = reduce(s, { type: 'char', char: c, t: 20 + i })
    expect(accuracy(s.keystrokes)).toBe(75)
  })
  it('scores perfectly steady typing as 100', () => {
    expect(consistency([80, 80, 80, 80])).toBe(100)
  })
  it('scores erratic typing lower than steady typing', () => {
    expect(consistency([20, 140, 30, 150])).toBeLessThan(consistency([78, 82, 80, 79]))
  })
})

describe('keyStats', () => {
  it('tracks misses against the expected key, not the typed key', () => {
    const s = run(['aa', 'bb'], 'ax')
    const stats = keyStats(s.keystrokes)
    expect(stats.find((k) => k.key === 'a')).toMatchObject({ hits: 1, misses: 1 })
  })
})

describe('word generation', () => {
  it('is deterministic for a seed', () => {
    expect(generateWords(DEFAULT_CONFIG, 40, 7)).toEqual(generateWords(DEFAULT_CONFIG, 40, 7))
    expect(generateWords(DEFAULT_CONFIG, 40, 7)).not.toEqual(generateWords(DEFAULT_CONFIG, 40, 8))
  })
  it('adds punctuation and capitals when asked', () => {
    const w = generateWords({ ...DEFAULT_CONFIG, punctuation: true }, 200, 3).join(' ')
    expect(w).toMatch(/[.,?!;:]/)
    expect(w).toMatch(/[A-Z]/)
  })
  it('mixes in numbers when asked', () => {
    const w = generateWords({ ...DEFAULT_CONFIG, numbers: true }, 200, 3)
    expect(w.some((x) => /^\d+$/.test(x))).toBe(true)
  })
  it('serves a quote in the requested length bucket', () => {
    const q = pickQuote({ ...DEFAULT_CONFIG, mode: 'quote', quoteLength: 'long' }, 1)
    expect(q.text.length).toBeGreaterThanOrEqual(140)
    expect(initialWords({ ...DEFAULT_CONFIG, mode: 'quote' }, 1).words.length).toBeGreaterThan(2)
  })
})
