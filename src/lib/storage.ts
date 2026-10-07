import { DEFAULT_CONFIG, type HistoryEntry, type TestConfig } from '../engine/types'

const KEY_CONFIG = 'typeflow:config'
const KEY_HISTORY = 'typeflow:history'
const KEY_THEME = 'typeflow:theme'
const MAX_HISTORY = 300

// localStorage can throw (private mode, blocked storage), so every access is guarded.
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: the app still works, it just will not remember */
  }
}

export const loadConfig = (): TestConfig => ({ ...DEFAULT_CONFIG, ...read<Partial<TestConfig>>(KEY_CONFIG, {}) })
export const saveConfig = (c: TestConfig) => write(KEY_CONFIG, c)

export const loadHistory = (): HistoryEntry[] => {
  const h = read<HistoryEntry[]>(KEY_HISTORY, [])
  return Array.isArray(h) ? h : []
}

export function appendHistory(entry: HistoryEntry): HistoryEntry[] {
  const next = [...loadHistory(), entry].slice(-MAX_HISTORY)
  write(KEY_HISTORY, next)
  return next
}

export const clearHistory = () => write(KEY_HISTORY, [])

export type ThemeName = 'midnight' | 'paper' | 'matcha'
export const THEMES: ThemeName[] = ['midnight', 'paper', 'matcha']
export const loadTheme = (): ThemeName => {
  const t = read<string>(KEY_THEME, 'midnight')
  return (THEMES as string[]).includes(t) ? (t as ThemeName) : 'midnight'
}
export const saveTheme = (t: ThemeName) => write(KEY_THEME, t)

/** Key identifying a comparable test setup, used for personal bests. */
export function configKey(c: TestConfig): string {
  const base = c.mode === 'time' ? `time ${c.time}` : c.mode === 'words' ? `words ${c.words}` : `quote ${c.quoteLength}`
  return base + (c.punctuation ? ' +punct' : '') + (c.numbers ? ' +num' : '')
}

export function personalBest(history: HistoryEntry[], c: TestConfig): number {
  const k = configKey(c)
  return history.reduce((best, h) => (configKey(h.config) === k ? Math.max(best, h.wpm) : best), 0)
}
