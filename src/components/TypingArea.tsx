import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Session } from '../engine/types'
import { MousePointer2 } from 'lucide-react'

interface Props {
  session: Session
  onChar: (c: string) => void
  onSpace: () => void
  onBackspace: (word: boolean) => void
  onRestart: () => void
}

const WordView = memo(function WordView(props: {
  word: string
  typed: string | undefined
  input: string
  active: boolean
}) {
  const { word, typed, input, active } = props
  const value = active ? input : typed
  const letters: { ch: string; s: 'c' | 'w' | 'x' | 'u' }[] = []
  for (let i = 0; i < word.length; i++) {
    const t = value?.[i]
    letters.push({ ch: word[i], s: t === undefined ? 'u' : t === word[i] ? 'c' : 'w' })
  }
  if (value && value.length > word.length) {
    for (let i = word.length; i < value.length; i++) letters.push({ ch: value[i], s: 'x' })
  }
  const bad = !active && typed !== undefined && typed !== word
  return (
    <span className="word" data-bad={bad} data-active={active}>
      {letters.map((l, i) => (
        <span key={i} className="letter" data-s={l.s}>
          {l.ch}
        </span>
      ))}
    </span>
  )
})

const LINES_VISIBLE = 3

export function TypingArea({ session, onChar, onSpace, onBackspace, onRestart }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const caretRef = useRef<HTMLSpanElement>(null)
  const [focused, setFocused] = useState(false)
  const [lineH, setLineH] = useState(52)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const { current, input, words } = session
  const wordCount = words.length

  // Place the caret and scroll lines from real layout so wrapping is always right.
  useLayoutEffect(() => {
    const inner = innerRef.current
    const caret = caretRef.current
    if (!inner || !caret) return
    const wordEl = inner.children[current] as HTMLElement | undefined
    if (!wordEl) return
    const letters = wordEl.children
    const idx = input.length
    let x: number
    let y = wordEl.offsetTop
    if (idx < letters.length) {
      const l = letters[idx] as HTMLElement
      x = wordEl.offsetLeft + l.offsetLeft
    } else if (letters.length) {
      const l = letters[letters.length - 1] as HTMLElement
      x = wordEl.offsetLeft + l.offsetLeft + l.offsetWidth
    } else {
      x = wordEl.offsetLeft
    }
    caret.style.transform = `translate(${x - 1}px, ${y}px)`
    const lh = parseFloat(getComputedStyle(inner).lineHeight) || lineH
    if (lh !== lineH) setLineH(lh)
    const line = Math.round(y / lh)
    inner.style.transform = `translateY(${-Math.max(0, line - 1) * lh}px)`
  }, [current, input, wordCount, lineH])

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const v = e.currentTarget.value
    e.currentTarget.value = ''
    for (const ch of v) {
      if (ch === ' ') onSpace()
      else if (ch.length === 1 || ch.codePointAt(0)! > 0xffff) onChar(ch)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' || e.key === 'Escape') {
      e.preventDefault()
      onRestart()
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      onBackspace(e.ctrlKey || e.altKey || e.metaKey)
    } else if (e.key === 'Enter') {
      e.preventDefault()
    }
  }

  return (
    <div
      className="relative"
      onClick={() => inputRef.current?.focus()}
      data-testid="typing-area"
    >
      <input
        ref={inputRef}
        aria-label="Typing input"
        className="absolute inset-0 h-full w-full cursor-default opacity-0"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <div
        className="words relative overflow-hidden transition-[filter,opacity] duration-150"
        style={{
          height: `${lineH * LINES_VISIBLE}px`,
          filter: focused ? 'none' : 'blur(5px)',
          opacity: focused ? 1 : 0.55,
        }}
      >
        <div ref={innerRef} className="relative will-change-transform transition-transform duration-100">
          {session.words.map((w, i) => (
            <WordView
              key={i}
              word={w}
              typed={session.typed[i]}
              input={i === session.current ? session.input : ''}
              active={i === session.current}
            />
          ))}
          <span
            ref={caretRef}
            className="caret"
            data-idle={session.status === 'idle'}
            aria-hidden
          />
        </div>
      </div>
      {!focused && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-sub shadow-lg">
            <MousePointer2 size={15} /> Click here or press any key to focus
          </div>
        </div>
      )}
    </div>
  )
}
