import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, type HistoryEntry } from '../engine/types'
import { bestsByConfig, formatDuration, movingAverage, summarize } from './stats'
import { appendHistory, clearHistory, configKey, loadConfig, loadHistory, personalBest, saveConfig } from './storage'

const entry = (wpm: number, over: Partial<HistoryEntry> = {}): HistoryEntry => ({
  id: String(Math.random()),
  at: Date.now(),
  config: DEFAULT_CONFIG,
  wpm,
  raw: wpm + 5,
  accuracy: 96,
  consistency: 70,
  durationMs: 30_000,
  ...over,
})

beforeEach(() => localStorage.clear())

describe('storage', () => {
  it('round-trips config and merges defaults for missing fields', () => {
    localStorage.setItem('typeflow:config', JSON.stringify({ time: 60 }))
    expect(loadConfig()).toEqual({ ...DEFAULT_CONFIG, time: 60 })
    saveConfig({ ...DEFAULT_CONFIG, mode: 'words' })
    expect(loadConfig().mode).toBe('words')
  })

  it('survives corrupt stored data', () => {
    localStorage.setItem('typeflow:history', '{not json')
    expect(loadHistory()).toEqual([])
    localStorage.setItem('typeflow:history', '"a string"')
    expect(loadHistory()).toEqual([])
  })

  it('keeps only the most recent 300 results', () => {
    for (let i = 0; i < 305; i++) appendHistory(entry(i))
    const h = loadHistory()
    expect(h).toHaveLength(300)
    expect(h[0].wpm).toBe(5)
    clearHistory()
    expect(loadHistory()).toHaveLength(0)
  })

  it('computes personal bests per comparable setup only', () => {
    const h = [entry(70), entry(90), entry(120, { config: { ...DEFAULT_CONFIG, time: 60 } })]
    expect(personalBest(h, DEFAULT_CONFIG)).toBe(90)
    expect(personalBest(h, { ...DEFAULT_CONFIG, punctuation: true })).toBe(0)
    expect(configKey({ ...DEFAULT_CONFIG, punctuation: true })).toBe('time 30 +punct')
  })
})

describe('stats', () => {
  it('summarises history', () => {
    const s = summarize([entry(60), entry(80), entry(100)])
    expect(s).toMatchObject({ tests: 3, best: 100, avgLast10: 80, totalSeconds: 90 })
  })
  it('groups bests by setup, best first', () => {
    const rows = bestsByConfig([entry(60), entry(75), entry(90, { config: { ...DEFAULT_CONFIG, mode: 'words' } })])
    expect(rows[0]).toMatchObject({ key: 'words 25', wpm: 90, count: 1 })
    expect(rows[1]).toMatchObject({ key: 'time 30', wpm: 75, count: 2 })
  })
  it('moving average uses what is available at the start', () => {
    expect(movingAverage([10, 20, 30, 40], 2)).toEqual([10, 15, 25, 35])
  })
  it('formats durations', () => {
    expect(formatDuration(45)).toBe('45s')
    expect(formatDuration(125)).toBe('2m 5s')
    expect(formatDuration(3725)).toBe('1h 2m')
  })
})
