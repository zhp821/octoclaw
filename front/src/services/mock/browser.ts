import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

export async function startMockWorker() {
  try {
    await worker.start({
      onUnhandledRequest: 'warn',
      quiet: false,
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    })
    console.log('[MSW] Mock Service Worker started')
  } catch (error) {
    console.warn('[MSW] Failed to start MSW, continuing without mock:', error)
  }
}
