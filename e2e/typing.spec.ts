import { expect, test, type Page } from '@playwright/test'

async function targetText(page: Page): Promise<string[]> {
  return page.locator('.word').allTextContents()
}

async function startWordsTest(page: Page, n = 10) {
  await page.goto('/')
  await page.getByRole('button', { name: 'words', exact: true }).click()
  await page.getByRole('button', { name: String(n), exact: true }).click()
  await page.getByTestId('typing-area').click()
}

test('completes a words test and shows results', async ({ page }) => {
  await startWordsTest(page)
  const words = await targetText(page)
  await page.keyboard.type(words.join(' '), { delay: 35 })
  const results = page.getByTestId('results')
  await expect(results).toBeVisible()
  await expect(page.getByTestId('acc')).toHaveText('100%')
  expect(Number(await page.getByTestId('wpm').innerText())).toBeGreaterThan(20)
})

test('mistakes lower accuracy and are shown on the heatmap', async ({ page }) => {
  await startWordsTest(page)
  const words = await targetText(page)
  const typo = words.slice()
  typo[0] = '#' + typo[0].slice(1) // wrong first letter
  await page.keyboard.type(typo.join(' '), { delay: 30 })
  await expect(page.getByTestId('results')).toBeVisible()
  const acc = Number((await page.getByTestId('acc').innerText()).replace('%', ''))
  expect(acc).toBeLessThan(100)
})

test('backspace corrects a mistake before the word ends', async ({ page }) => {
  await startWordsTest(page)
  const words = await targetText(page)
  await page.keyboard.type('x')
  await page.keyboard.press('Backspace')
  await page.keyboard.type(words.join(' ').slice(0), { delay: 20 })
  await expect(page.getByTestId('results')).toBeVisible()
})

test('tab restarts with fresh text', async ({ page }) => {
  await startWordsTest(page)
  const before = (await targetText(page)).join(' ')
  await page.keyboard.press('Tab')
  await expect.poll(async () => (await targetText(page)).join(' ')).not.toBe(before)
})

test('finished tests appear on the stats page and persist across reloads', async ({ page }) => {
  await startWordsTest(page)
  await page.keyboard.type((await targetText(page)).join(' '), { delay: 25 })
  await expect(page.getByTestId('results')).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Stats' }).click()
  await expect(page.getByText('Personal bests')).toBeVisible()
  await expect(page.getByText('words 10').first()).toBeVisible()
})

test('theme choice persists', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('radio', { name: 'paper theme' }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper')
})

test('timed test counts down and ends on its own', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '15', exact: true }).click()
  await page.getByTestId('typing-area').click()
  await page.keyboard.type('a')
  await expect(page.getByTestId('results')).toBeVisible({ timeout: 20_000 })
})
