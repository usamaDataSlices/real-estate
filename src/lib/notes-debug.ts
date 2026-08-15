/** Dev-only breadcrumbs for note editor image save debugging. */
const ENABLED = import.meta.env.DEV

export function noteDebug(step: string, detail?: Record<string, unknown>) {
  if (!ENABLED) return
  const prefix = `[notes:${step}]`
  if (detail) {
    console.log(prefix, detail)
  } else {
    console.log(prefix)
  }
}

export function noteDebugJson(step: string, payload: unknown) {
  if (!ENABLED) return
  console.log(`[notes:${step}]`, JSON.parse(JSON.stringify(payload)))
}
