import type { QuoteLength } from './types'

export interface Quote {
  text: string
  source: string
}

export const QUOTES: Quote[] = [
  { text: 'Well done is better than well said.', source: 'Benjamin Franklin' },
  { text: 'Call me Ishmael.', source: 'Herman Melville, Moby-Dick' },
  { text: 'Knowledge is power.', source: 'Francis Bacon' },
  { text: 'I think, therefore I am.', source: 'René Descartes' },
  { text: 'All that glitters is not gold.', source: 'William Shakespeare' },
  { text: 'Talk is cheap. Show me the code.', source: 'Linus Torvalds' },
  { text: 'Make it work, make it right, make it fast.', source: 'Kent Beck' },
  { text: 'The unexamined life is not worth living.', source: 'Socrates, in Plato’s Apology' },
  { text: 'A journey of a thousand miles begins with a single step.', source: 'Lao Tzu' },
  { text: 'The best way to predict the future is to invent it.', source: 'Alan Kay' },
  { text: 'Premature optimization is the root of all evil.', source: 'Donald Knuth' },
  { text: 'Simple things should be simple, complex things should be possible.', source: 'Alan Kay' },
  { text: 'To be, or not to be, that is the question.', source: 'William Shakespeare, Hamlet' },
  { text: 'That which does not kill us makes us stronger.', source: 'Friedrich Nietzsche' },
  {
    text: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.',
    source: 'Martin Fowler',
  },
  {
    text: 'Programs must be written for people to read, and only incidentally for machines to execute.',
    source: 'Abelson and Sussman, SICP',
  },
  {
    text: 'Everyone knows that debugging is twice as hard as writing a program in the first place. So if you are as clever as you can be when you write it, how will you ever debug it?',
    source: 'Brian Kernighan',
  },
  {
    text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    source: 'Jane Austen, Pride and Prejudice',
  },
  {
    text: 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.',
    source: 'Charles Dickens, A Tale of Two Cities',
  },
  {
    text: 'There is nothing either good or bad, but thinking makes it so.',
    source: 'William Shakespeare, Hamlet',
  },
  {
    text: 'The only thing we have to fear is fear itself, nameless, unreasoning, unjustified terror which paralyzes needed efforts to convert retreat into advance.',
    source: 'Franklin D. Roosevelt',
  },
  {
    text: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in liberty, and dedicated to the proposition that all men are created equal.',
    source: 'Abraham Lincoln, Gettysburg Address',
  },
]

export function quoteBucket(q: Quote): QuoteLength {
  const n = q.text.length
  if (n < 70) return 'short'
  if (n < 140) return 'medium'
  return 'long'
}
