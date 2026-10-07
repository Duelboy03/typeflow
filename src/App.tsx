import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConfigBar } from './components/ConfigBar'
import { Header } from './components/Header'
import { Results } from './components/Results'
import { StatsPage } from './components/StatsPage'
import { TestRunner } from './components/TestRunner'
import { computeResult } from './engine/metrics'
import { initialWords } from './engine/words'
import type { HistoryEntry, Session, TestConfig, TestResult } from './engine/types'
import {
  appendHistory,
  clearHistory,
  configKey,
  loadConfig,
  loadHistory,
  loadTheme,
  personalBest,
  saveConfig,
  saveTheme,
  type ThemeName,
} from './lib/storage'

const newSeed = () => Math.floor(Math.random() * 2 ** 31)

export default function App() {
  const [view, setView] = useState<'test' | 'stats'>('test')
  const [config, setConfig] = useState<TestConfig>(loadConfig)
  const [theme, setTheme] = useState<ThemeName>(loadTheme)
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory)
  const [seed, setSeed] = useState(newSeed)
  const [run, setRun] = useState(0)
  const [outcome, setOutcome] = useState<{ result: TestResult; isPb: boolean } | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    saveTheme(theme)
  }, [theme])

  const { words, quote } = useMemo(() => initialWords(config, seed), [config, seed])

  const restart = useCallback((keepSeed = false) => {
    if (!keepSeed) setSeed(newSeed())
    setRun((r) => r + 1)
    setOutcome(null)
  }, [])

  // opening the Test tab always starts a fresh test rather than resurrecting old results
  const goTo = (v: 'test' | 'stats') => {
    setView(v)
    if (v === 'test') restart()
  }

  const changeConfig = (c: TestConfig) => {
    setConfig(c)
    saveConfig(c)
    restart()
  }

  const onFinish = useCallback(
    (s: Session) => {
      const result = computeResult(s)
      const prior = personalBest(loadHistory(), config)
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        at: Date.now(),
        config,
        wpm: result.wpm,
        raw: result.raw,
        accuracy: result.accuracy,
        consistency: result.consistency,
        durationMs: result.durationMs,
      }
      setHistory(appendHistory(entry))
      setOutcome({ result, isPb: prior > 0 && result.wpm > prior })
    },
    [config],
  )

  // Enter on the results screen starts the next test
  useEffect(() => {
    if (!outcome || view !== 'test') return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        restart()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [outcome, view, restart])

  return (
    <div className="flex min-h-full flex-col">
      <Header view={view} onView={goTo} theme={theme} onTheme={setTheme} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 pt-6">
        {view === 'stats' ? (
          <StatsPage
            history={history}
            onClear={() => {
              clearHistory()
              setHistory([])
            }}
          />
        ) : outcome ? (
          <Results
            result={outcome.result}
            config={config}
            isPb={outcome.isPb}
            onNext={() => restart()}
            onRepeat={() => restart(true)}
          />
        ) : (
          <div className="flex flex-1 flex-col justify-center gap-10 pb-12">
            <ConfigBar config={config} onChange={changeConfig} />
            <TestRunner
              key={`${configKey(config)}-${seed}-${run}`}
              config={config}
              words={words}
              seed={seed}
              quote={quote}
              onFinish={onFinish}
              onRestart={() => restart()}
            />
          </div>
        )}
      </main>
      <footer className="px-5 pb-6 text-center text-xs text-muted">
        Built with React, TypeScript and Vite · results are stored only in your browser
      </footer>
    </div>
  )
}
