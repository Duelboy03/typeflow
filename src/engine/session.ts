import { computeResult, correctChars, wpmFromChars } from './metrics'
import type { Mode, Session, TestResult } from './types'

/** Longest a word may grow beyond its target length before further input is ignored. */
export const MAX_OVERFLOW = 10

export type Action =
  | { type: 'char'; char: string; t: number }
  | { type: 'space'; t: number }
  | { type: 'backspace'; t: number; word: boolean }
  | { type: 'tick'; t: number; limitMs?: number }
  | { type: 'append'; words: string[] }
  | { type: 'finish'; t: number }

export function createSession(words: string[]): Session {
  return {
    words,
    typed: [],
    input: '',
    current: 0,
    status: 'idle',
    keystrokes: [],
    samples: [],
    endedAt: null,
    clock: 0,
  }
}

function isLastWord(s: Session) {
  return s.current === s.words.length - 1
}

/**
 * Push one sample per whole second up to `t`. Each sample is computed from the
 * state at the moment it is taken, so the chart agrees with the final result.
 */
function sampleTo(s: Session, t: number): Session {
  const have = s.samples.length
  const due = Math.floor(t / 1000)
  if (due <= have) return s
  const samples = s.samples.slice()
  const chars = correctChars(s)
  for (let sec = have + 1; sec <= due; sec++) {
    const inSecond = s.keystrokes.filter((k) => k.t > (sec - 1) * 1000 && k.t <= sec * 1000)
    samples.push({
      second: sec,
      wpm: wpmFromChars(chars, sec * 1000),
      raw: wpmFromChars(inSecond.length, 1000),
      errors: inSecond.filter((k) => !k.correct).length,
    })
  }
  return { ...s, samples }
}

function finish(s: Session, t: number): Session {
  const ended = sampleTo({ ...s, clock: t }, t)
  return { ...ended, status: 'finished', endedAt: t, clock: t }
}

export function reduce(s: Session, a: Action): Session {
  if (s.status === 'finished') return s

  switch (a.type) {
    case 'char': {
      const target = s.words[s.current] ?? ''
      if (s.input.length >= target.length + MAX_OVERFLOW) return s
      const t = s.status === 'idle' ? 0 : a.t
      const expected = s.input.length < target.length ? target[s.input.length] : null
      const next: Session = {
        ...s,
        status: 'running',
        input: s.input + a.char,
        clock: t,
        keystrokes: [...s.keystrokes, { t, expected, key: a.char, correct: expected === a.char }],
      }
      const sampled = sampleTo(next, t)
      // words/quote tests end the moment the last word is fully typed
      if (isLastWord(sampled) && sampled.input.length >= target.length && sampled.words.length > 0) {
        const committed = { ...sampled, typed: [...sampled.typed, sampled.input] }
        return finish({ ...committed, input: '', current: sampled.current }, t)
      }
      return sampled
    }
    case 'space': {
      if (s.status === 'idle' || s.input === '') return s
      const target = s.words[s.current]
      const correct = s.input.length === target.length
      const sampled = sampleTo(
        {
          ...s,
          clock: a.t,
          keystrokes: [...s.keystrokes, { t: a.t, expected: ' ', key: ' ', correct }],
        },
        a.t,
      )
      return {
        ...sampled,
        typed: [...sampled.typed, sampled.input],
        input: '',
        current: sampled.current + 1,
      }
    }
    case 'backspace': {
      if (s.status === 'idle') return s
      if (s.input.length > 0) {
        return { ...s, input: a.word ? '' : s.input.slice(0, -1) }
      }
      const prev = s.current - 1
      if (prev >= 0 && s.typed[prev] !== s.words[prev]) {
        const restored = s.typed[prev]
        return {
          ...s,
          current: prev,
          typed: s.typed.slice(0, -1),
          input: a.word ? '' : restored,
        }
      }
      return s
    }
    case 'tick': {
      if (s.status !== 'running') return s
      if (a.limitMs !== undefined && a.t >= a.limitMs) return finish(s, a.limitMs)
      return sampleTo({ ...s, clock: a.t }, a.t)
    }
    case 'append':
      return { ...s, words: [...s.words, ...a.words] }
    case 'finish':
      return s.status === 'running' ? finish(s, a.t) : s
  }
}

export function resultOf(s: Session): TestResult {
  return computeResult(s)
}

export function limitFor(mode: Mode, time: number): number | undefined {
  return mode === 'time' ? time * 1000 : undefined
}
