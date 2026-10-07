import { test, type Page } from '@playwright/test'

// Run with: SCREENSHOTS=1 npx playwright test e2e/screenshots.spec.ts
test.skip(!process.env.SCREENSHOTS, 'screenshot generation only')

function seedHistory() {
  const now = Date.now()
  let wpm = 52
  const h = Array.from({ length: 42 }, (_, i) => {
    wpm += (Math.sin(i / 3) * 3 + 0.9 + ((i * 37) % 7) - 3) * 0.9
    return {
      id: `seed-${i}`,
      at: now - (42 - i) * 3600_000 * 5,
      config: i % 3 === 0 ? { mode: 'words', time: 30, words: 25, quoteLength: 'medium', punctuation: false, numbers: false }
        : { mode: 'time', time: i % 4 === 0 ? 60 : 30, words: 25, quoteLength: 'medium', punctuation: i % 5 === 0, numbers: false },
      wpm, raw: wpm + 6, accuracy: 94 + ((i * 13) % 5), consistency: 66 + ((i * 7) % 15), durationMs: 30000,
    }
  })
  return JSON.stringify(h)
}

async function humanType(page: Page, text: string) {
  // errors on a few keys so the heatmap has something to show
  let out = ''
  for (const [i, ch] of [...text].entries()) {
    if (i % 23 === 7 && ch !== ' ') {
      await page.keyboard.type('q', { delay: 70 })
      await page.keyboard.press('Backspace')
    }
    out += ch
    await page.keyboard.type(ch, { delay: 45 + ((i * 29) % 60) })
  }
  return out
}

test('capture', async ({ page }) => {
  await page.addInitScript((h) => localStorage.setItem('typeflow:history', h), seedHistory())
  await page.setViewportSize({ width: 1280, height: 760 })
  await page.goto('/')
  await page.getByTestId('typing-area').click()
  await page.keyboard.type('a', { delay: 0 })
  await page.keyboard.press('Backspace')
  const words = await page.locator('.word').allTextContents()
  await page.keyboard.type(words.slice(0, 9).join(' ') + ' ', { delay: 55 })
  await page.screenshot({ path: 'docs/screenshots/test.png' })

  for (const theme of ['paper', 'matcha']) {
    await page.getByRole('radio', { name: `${theme} theme` }).click()
    await page.getByTestId('typing-area').click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: `docs/screenshots/test-${theme}.png` })
  }
  await page.getByRole('radio', { name: 'midnight theme' }).click()

  await page.getByRole('button', { name: 'words', exact: true }).click()
  await page.getByRole('button', { name: '25', exact: true }).click()
  await page.getByTestId('typing-area').click()
  const w = (await page.locator('.word').allTextContents()).join(' ')
  await humanType(page, w)
  await page.getByTestId('results').waitFor()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'docs/screenshots/results.png', fullPage: true })

  await page.getByRole('button', { name: 'Stats' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'docs/screenshots/stats.png', fullPage: true })

  await page.setViewportSize({ width: 390, height: 780 })
  await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Test' }).click()
  await page.getByTestId('typing-area').click()
  await page.keyboard.type('x')
  await page.keyboard.press('Backspace')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'docs/screenshots/mobile.png' })
})
