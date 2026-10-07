import { useCallback, useEffect, useReducer, useRef } from 'react'
import { createSession, limitFor, reduce, type Action } from '../engine/session'
import { correctChars, wpmFromChars } from '../engine/metrics'
import type { Session, TestConfig } from '../engine/types'
import { generateWords } from '../engine/words'

/** Keep the word buffer ahead of the cursor in timed tests. */
const REFILL_AT = 30
const REFILL_COUNT = 60
const TICK_MS = 100

export function useTypingTest(config: TestConfig, initialWords: string[], seed: number) {
  const [session, dispatch] = useReducer(reduce, initialWords, createSession)
  const startedAt = useRef<number | null>(null)
  const sessionRef = useRef<Session>(session)
  useEffect(() => {
    sessionRef.current = session
  })

  const elapsed = () => (startedAt.current === null ? 0 : performance.now() - startedAt.current)

  const send = useCallback((a: Action) => dispatch(a), [])

  const onChar = useCallback((char: string) => {
    if (sessionRef.current.status === 'idle') startedAt.current = performance.now()
    send({ type: 'char', char, t: elapsed() })
  }, [send])

  const onSpace = useCallback(() => send({ type: 'space', t: elapsed() }), [send])
  const onBackspace = useCallback(
    (word: boolean) => send({ type: 'backspace', t: elapsed(), word }),
    [send],
  )

  // clock: drives the countdown, live WPM and the per-second chart samples
  useEffect(() => {
    if (session.status !== 'running') return
    const limitMs = limitFor(config.mode, config.time)
    const id = window.setInterval(() => send({ type: 'tick', t: elapsed(), limitMs }), TICK_MS)
    return () => window.clearInterval(id)
  }, [session.status, config.mode, config.time, send])

  const { current, words: allWords } = session
  const wordCount = allWords.length

  // timed tests have no fixed length, so top the buffer up as the cursor advances
  useEffect(() => {
    if (config.mode !== 'time') return
    if (current > wordCount - REFILL_AT) {
      send({ type: 'append', words: generateWords(config, REFILL_COUNT, seed + wordCount) })
    }
  }, [config, seed, current, wordCount, send])

  const liveWpm = session.status === 'idle' ? 0 : wpmFromChars(correctChars(session), session.clock)

  return { session, liveWpm, onChar, onSpace, onBackspace }
}
