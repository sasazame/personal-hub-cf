import { test, expect, Page } from '@playwright/test'
import { login, TEST_USER, ensureLoggedOut } from './helpers/auth'

const API_TIMEOUT = 10000
const SUBMIT_SHORTCUT = process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter'

test.describe('Moments Feature E2E Tests', () => {
  test.describe.configure({ mode: 'serial' })
  test.setTimeout(120000)

  async function cleanupMoments(page: Page) {
    await page.evaluate(async () => {
      const authRes = await fetch('/api/v1/auth/me', { credentials: 'include' })
      if (!authRes.ok) return
      const auth = await authRes.json()
      const csrfToken = auth?.csrfToken

      while (true) {
        const listRes = await fetch('/api/v1/moments?limit=100', { credentials: 'include' })
        if (!listRes.ok) break
        const data = await listRes.json()
        const items = Array.isArray(data?.items) ? data.items : []
        if (!items.length) break

        await Promise.all(
          items.map((item: { id: number }) =>
            fetch(`/api/v1/moments/${item.id}`, {
              method: 'DELETE',
              credentials: 'include',
              headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined,
            })
          )
        )
      }
    })
    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Moments' })).toBeVisible()
  }

  async function createMomentViaQuickForm(
    page: Page,
    options: { content?: string; tags?: string[] } = {}
  ) {
    const content = options.content ?? `Moment ${Date.now()}`
    const tags = options.tags ?? []

    const quickTextarea = page.locator('form textarea[placeholder="What\'s on your mind?"]').first()
    await expect(quickTextarea).toBeVisible()
    await quickTextarea.fill(content)

    for (const tag of tags) {
      await page.getByRole('button', { name: tag }).first().click()
    }

    const quickForm = quickTextarea.locator('xpath=ancestor::form')
    const [createResponse] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/moments') && resp.request().method() === 'POST',
        { timeout: API_TIMEOUT }
      ),
      quickForm.getByRole('button', { name: 'Create', exact: true }).click(),
    ])
    expect(createResponse.ok()).toBeTruthy()

    await page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/moments') && resp.request().method() === 'GET',
      { timeout: API_TIMEOUT }
    )

    await expect(page.locator('text=' + content)).toBeVisible()
    return { content, tags }
  }

  async function createMomentViaModal(
    page: Page,
    options: { content?: string; tags?: string[]; customTag?: string } = {}
  ) {
    const content = options.content ?? `Modal moment ${Date.now()}`
    const tags = options.tags ?? []
    const customTag = options.customTag

    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.getByRole('button', { name: 'New Moment' })).toBeVisible()
    await page.getByRole('button', { name: 'New Moment' }).click()

    const modalContainer = page.locator('div').filter({ has: page.getByRole('heading', { name: 'Add Moment' }) }).first()
    await expect(page.getByRole('heading', { name: 'Add Moment' })).toBeVisible()
    await expect(modalContainer).toBeVisible()
    const modalTextarea = modalContainer.locator('textarea[placeholder="What\'s on your mind?"]').last()
    await expect(modalTextarea).toBeVisible()
    await modalTextarea.scrollIntoViewIfNeeded()
    await modalTextarea.click()
    await modalTextarea.fill(content)

    for (const tag of tags) {
      await page.getByRole('button', { name: tag }).click()
    }

    if (customTag) {
      await page.getByRole('button', { name: 'Add Custom Tag' }).click()
      await page.fill('input[placeholder="Enter custom tag"]', customTag)
      await page.keyboard.press('Enter')
    }

    const [createResponse] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/moments') && resp.request().method() === 'POST',
        { timeout: API_TIMEOUT }
      ),
      page.getByRole('button', { name: 'Create' }).click(),
    ])
    expect(createResponse.ok()).toBeTruthy()

    await page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/moments') && resp.request().method() === 'GET',
      { timeout: API_TIMEOUT }
    )

    await expect(page.locator('text=' + content)).toBeVisible()

    await page.setViewportSize({ width: 1280, height: 720 })
    return { content, tags, customTag }
  }

  async function createMomentViaApi(page: Page, content: string, tags: string[] = []) {
    await page.evaluate(
      async ({ content, tags }) => {
        const authRes = await fetch('/api/v1/auth/me', { credentials: 'include' })
        if (!authRes.ok) throw new Error('Unable to fetch auth context')
        const auth = await authRes.json()
        const csrfToken = auth?.csrfToken

        const response = await fetch('/api/v1/moments', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
          },
          body: JSON.stringify({
            content,
            tags: tags.length ? tags.join(',') : undefined,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create moment via API')
        }
      },
      { content, tags }
    )
  }

  function momentCardLocator(page: Page, content: string) {
    return page.locator('div.rounded-lg').filter({
      hasText: content,
      has: page.locator('button[aria-label="Edit"]'),
    }).first()
  }

  test.beforeEach(async ({ page }) => {
    console.log('Moments beforeEach: start')
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.context().addCookies([{ name: 'locale', value: 'en', domain: 'localhost', path: '/' }])
    await ensureLoggedOut(page)
    console.log('Moments beforeEach: after ensureLoggedOut')
    await page.goto('/login')
    console.log('Moments beforeEach: on /login')
    await login(page, TEST_USER.email, TEST_USER.password)
    console.log('Moments beforeEach: logged in')
    await page.goto('/moments')
    console.log('Moments beforeEach: on /moments')
    await expect(page.getByRole('heading', { name: 'Moments' })).toBeVisible()
    await cleanupMoments(page)
    console.log('Moments beforeEach: cleanup complete')
    await expect(page.getByText('No moments yet')).toBeVisible()
  })

  test('should display empty state initially', async ({ page }) => {
    await expect(page.getByText('Start recording your thoughts and experiences')).toBeVisible()
  })

  test('should create a new moment using quick form', async ({ page }) => {
    const { content } = await createMomentViaQuickForm(page, { tags: ['Ideas'] })
    const card = momentCardLocator(page, content)
    await expect(card).toBeVisible()
    await expect(card.locator('span').filter({ hasText: 'Ideas' })).toBeVisible()
  })

  test('should create a new moment using modal form', async ({ page }) => {
    const { content, customTag } = await createMomentViaModal(page, {
      tags: ['Discoveries', 'Emotions'],
      customTag: 'test-tag',
    })

    const card = momentCardLocator(page, content)
    await expect(card.locator('span').filter({ hasText: 'Discoveries' })).toBeVisible()
    await expect(card.locator('span').filter({ hasText: 'Emotions' })).toBeVisible()
    await expect(card.locator('span').filter({ hasText: `#${customTag}` })).toBeVisible()
  })

  test('should view moment details', async ({ page }) => {
    const { content } = await createMomentViaQuickForm(page)
    const card = momentCardLocator(page, content)
    await card.click()

    const viewerHeading = page.locator('text=Moment Details').first()
    await expect(viewerHeading).toBeVisible()
    await expect(page.locator('.whitespace-pre-wrap').filter({ hasText: content }).first()).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(viewerHeading).not.toBeVisible()
  })

  test('should edit existing moment', async ({ page }) => {
    const { content } = await createMomentViaQuickForm(page)
    const card = momentCardLocator(page, content)

    await card.locator('button[aria-label="Edit"]').click()
    const editModal = page.locator('div.p-6').filter({ has: page.getByRole('heading', { name: 'Edit Moment' }) }).first()
    await expect(editModal).toBeVisible()

    const updatedText = `${content} - Updated`
    await editModal.locator('textarea[placeholder="What\'s on your mind?"]').first().fill(updatedText)
    await editModal.locator('button').filter({ hasText: 'Log' }).first().click()

    const [updateResponse] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/moments/') && resp.request().method() === 'PUT',
        { timeout: API_TIMEOUT }
      ),
      editModal.getByRole('button', { name: 'Update' }).click(),
    ])
    expect(updateResponse.ok()).toBeTruthy()

    await page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/moments') && resp.request().method() === 'GET',
      { timeout: API_TIMEOUT }
    )

    const updatedCard = momentCardLocator(page, updatedText)
    await expect(updatedCard).toBeVisible()
    await expect(updatedCard.locator('span').filter({ hasText: 'Log' })).toBeVisible()
  })

  test('should delete moment with confirmation', async ({ page }) => {
    const { content } = await createMomentViaQuickForm(page)
    const card = momentCardLocator(page, content)
    await card.locator('button[aria-label="Delete"]').click()

    await expect(page.getByRole('heading', { name: 'Delete Moment' })).toBeVisible()
    const [deleteResponse] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/moments/') && resp.request().method() === 'DELETE',
        { timeout: API_TIMEOUT }
      ),
      page.getByRole('button', { name: 'Delete' }).last().click(),
    ])
    expect(deleteResponse.ok()).toBeTruthy()

    await page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/moments') && resp.request().method() === 'GET',
      { timeout: API_TIMEOUT }
    )

    await expect(momentCardLocator(page, content)).toHaveCount(0)
  })

  test('should submit quick form with keyboard shortcut', async ({ page }) => {
    const content = `Shortcut moment ${Date.now()}`
    const quickTextarea = page.locator('form textarea[placeholder="What\'s on your mind?"]').first()
    await quickTextarea.fill(content)

    const createResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/moments') && resp.request().method() === 'POST',
      { timeout: API_TIMEOUT }
    )
    await quickTextarea.press(SUBMIT_SHORTCUT)
    const createResponse = await createResponsePromise
    expect(createResponse.ok()).toBeTruthy()

    await page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/moments') && resp.request().method() === 'GET',
      { timeout: API_TIMEOUT }
    )
    await expect(page.locator('text=' + content)).toBeVisible()
    await expect(momentCardLocator(page, content).locator('span').filter({ hasText: 'Other' })).toBeVisible()
  })

  test('should search moments', async ({ page }) => {
    const moments = [
      { content: 'JavaScript insights', tags: ['Ideas'] },
      { content: 'Feeling grateful today', tags: ['Emotions'] },
      { content: 'Discovered a new technique', tags: ['Discoveries'] },
    ]

    for (const moment of moments) {
      await createMomentViaQuickForm(page, moment)
    }

    await page.reload({ waitUntil: 'networkidle' })

    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/moments') && resp.url().includes('search=JavaScript'),
        { timeout: API_TIMEOUT }
      ),
      page.fill('input[placeholder="Search moments..."]', 'JavaScript'),
    ])

    await expect(page.locator('text=JavaScript insights')).toBeVisible()
    await expect(page.locator('text=Feeling grateful today')).toHaveCount(0)
    await expect(page.locator('text=Discovered a new technique')).toHaveCount(0)

    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/moments') && !resp.url().includes('search='),
        { timeout: API_TIMEOUT }
      ),
      page.fill('input[placeholder="Search moments..."]', ''),
    ])

    for (const moment of moments) {
      await expect(page.locator('text=' + moment.content)).toBeVisible()
    }
  })

  test('should filter moments by tag', async ({ page }) => {
    const moments = [
      { content: 'Great idea for project', tags: ['Ideas'] },
      { content: 'Found interesting article', tags: ['Discoveries'] },
      { content: 'Another brilliant idea', tags: ['Ideas'] },
    ]

    for (const moment of moments) {
      await createMomentViaQuickForm(page, moment)
    }

    await page.reload({ waitUntil: 'networkidle' })

    const tagFilter = page.locator('select').filter({
      has: page.locator('option', { hasText: 'All tags' })
    }).first()
    await expect(tagFilter).toBeVisible()

    await tagFilter.selectOption({ label: 'Ideas' })
    await expect(page.locator('text=Found interesting article')).toHaveCount(0, { timeout: API_TIMEOUT })

    await expect(page.locator('text=Great idea for project')).toBeVisible()
    await expect(page.locator('text=Another brilliant idea')).toBeVisible()

    await tagFilter.selectOption('')
    await expect(page.locator('text=Found interesting article')).toBeVisible({ timeout: API_TIMEOUT })

    for (const moment of moments) {
      await expect(page.locator('text=' + moment.content)).toBeVisible()
    }
  })

  test('should handle infinite scroll', async ({ page }) => {
    for (let i = 0; i < 30; i++) {
      await createMomentViaApi(page, `Scrollable moment ${i}`, ['Ideas'])
    }

    await page.reload({ waitUntil: 'networkidle' })
    const list = page.locator('[data-testid="moments-list"], .space-y-6').last()
    await expect(list).toBeVisible()

    const cards = page.locator('.bg-card')
    const initialCount = await cards.count()
    expect(initialCount).toBeGreaterThan(0)

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForFunction(
      (previousCount) => document.querySelectorAll('.bg-card').length > previousCount,
      initialCount,
      { timeout: API_TIMEOUT }
    )
    const finalCount = await cards.count()
    expect(finalCount).toBeGreaterThan(initialCount)
  })

  test('should validate required fields', async ({ page }) => {
    const quickTextarea = page.locator('form textarea[placeholder="What\'s on your mind?"]').first()
    const quickFormButton = quickTextarea.locator('xpath=ancestor::form').getByRole('button', { name: 'Create' })
    await expect(quickFormButton).toBeDisabled()

    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'New Moment' }).click()
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(page.getByRole('heading', { name: 'Add Moment' })).toBeVisible()
  })
})
