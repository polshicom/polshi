export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensureWorkerRunning } = await import('./lib/scanner-worker.js')
    ensureWorkerRunning()
    console.log('[instrumentation] Scanner worker started on boot')
  }
}
