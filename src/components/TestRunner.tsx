import { RotateCcw } from 'lucide-react'
import { useEffect } from 'react'
import { useTypingTest } from '../hooks/useTypingTest'
import type { Session, TestConfig } from '../engine/types'
import type { Quote } from '../engine/quotes'
import { TypingArea } from './TypingArea'

interface Props {
  config: TestConfig
  words: string[]
  seed: number
  quote?: Quote
  onFinish: (s: Session) => void
  onRestart: () => void
}

export function TestRunner({ config, words, seed, quote, onFinish, onRestart }: Props) {
  const { session, liveWpm, onChar, onSpace, onBackspace } = useTypingTest(config, words, seed)

  useEffect(() => {
    if (session.status === 'finished') onFinish(session)
  }, [session, onFinish])

  const remaining =
    config.mode === 'time'
      ? Math.max(0, config.time - Math.floor(session.clock / 1000))
      : null
  const progress =
    config.mode === 'time'
      ? `${remaining}`
      : `${Math.min(session.current, words.length)}/${words.length}`

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-3 flex h-10 items-baseline gap-6 font-mono">
        <span className="text-3xl text-accent" data-testid="progress" aria-live="off">
          {session.status === 'idle' && config.mode === 'time' ? config.time : progress}
        </span>
        <span className="text-xl text-sub" data-testid="live-wpm">
          {session.status === 'running' ? `${Math.round(liveWpm)} wpm` : ''}
        </span>
      </div>
      <TypingArea
        session={session}
        onChar={onChar}
        onSpace={onSpace}
        onBackspace={onBackspace}
        onRestart={onRestart}
      />
      {quote && (
        <p className="mt-4 text-sm text-sub">
          <span className="text-muted">source</span> {quote.source}
        </p>
      )}
      <div className="mt-8 flex justify-center">
        <button
          onClick={onRestart}
          aria-label="Restart test"
          className="rounded-full p-3 text-sub transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <RotateCcw size={18} />
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-sub">
        <span className="kbd">Tab</span> restart · <span className="kbd">Ctrl</span>+<span className="kbd">Backspace</span> delete word
      </p>
    </div>
  )
}
