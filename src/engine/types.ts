export type Mode = 'time' | 'words' | 'quote'
export type QuoteLength = 'short' | 'medium' | 'long'

export interface TestConfig {
  mode: Mode
  time: number
  words: number
  quoteLength: QuoteLength
  punctuation: boolean
  numbers: boolean
}

export const TIME_OPTIONS = [15, 30, 60, 120] as const
export const WORD_OPTIONS = [10, 25, 50, 100] as const

export const DEFAULT_CONFIG: TestConfig = {
  mode: 'time',
  time: 30,
  words: 25,
  quoteLength: 'medium',
  punctuation: false,
  numbers: false,
}

export interface Keystroke {
  /** ms since the first keystroke */
  t: number
  /** character the user should have typed, or null for an extra character */
  expected: string | null
  key: string
  correct: boolean
}

export interface Sample {
  /** second index, 1-based */
  second: number
  wpm: number
  raw: number
  errors: number
}

export interface Session {
  words: string[]
  typed: string[]
  input: string
  current: number
  status: 'idle' | 'running' | 'finished'
  keystrokes: Keystroke[]
  samples: Sample[]
  /** ms at which the test ended, relative to the first keystroke */
  endedAt: number | null
  /** elapsed ms of the last tick or keystroke */
  clock: number
}

export interface CharBreakdown {
  correct: number
  incorrect: number
  extra: number
  missed: number
}

export interface KeyStat {
  key: string
  hits: number
  misses: number
  /** mean ms since the previous keystroke, 0 when unknown */
  avgLatency: number
}

export interface TestResult {
  wpm: number
  raw: number
  accuracy: number
  consistency: number
  durationMs: number
  chars: CharBreakdown
  samples: Sample[]
  keys: KeyStat[]
}

export interface HistoryEntry {
  id: string
  at: number
  config: TestConfig
  wpm: number
  raw: number
  accuracy: number
  consistency: number
  durationMs: number
}
