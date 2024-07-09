import type { PlasmoMessaging } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

const storage = new Storage({
  area: "local"
})

const get = async <T>(key: string): Promise<T | undefined> => {
  const value = await storage.get<T>(key)
  return value
}

const set = async <T>(key: string, value: T): Promise<void> => {
  await storage.set(key, value)
}

const remove = async (key: string): Promise<void> => {
  await storage.remove(key)
}

type ComputeFn<T> = (key: string) => Promise<T>

const getOrCompute = async <T>(
  key: string,
  computeFn: ComputeFn<T>,
  forceRecompute?: boolean
): Promise<T> => {
  if (!forceRecompute) {
    const val = await get<T>(key)
    if (val) {
      return val
    }
  }
  const computed = await computeFn(key)
  try {
    await set(key, computed)
  } catch (e) {
    console.warn("failed to save computed value", key, computed)
  }
  return computed
}

async function fetchTipValidation(
  castUrl: string,
  forceRefresh?: boolean
): Promise<CachedTipData> {
  const apiBaseUrl =
    process.env.PLASMO_PUBLIC_PROXY_URL || "http://localhost:3000"
  const apiKey = process.env.PLASMO_PUBLIC_PROXY_KEY
  if (!apiKey) {
    throw new Error("PLASMO_PUBLIC_PROXY_KEY not set")
  }
  const params = new URLSearchParams()
  params.set("castUrl", castUrl)
  if (forceRefresh) {
    params.set("forceRefresh", "true")
  }
  const tipResp = await fetch(
    `${apiBaseUrl}/api/v1/tips/validation?${params.toString()}`,
    { headers: { "x-dte-api-key": apiKey } }
  )
  if (!tipResp.ok) {
    throw new Error(`Failed to fetch tip data!`)
  }
  const tipData = await tipResp.json()

  return tipData as CachedTipData
}

export interface TipData {
  amount?: number
}

interface CachedTipData {
  data: TipData
  timestamp: number
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const { castUrl, forceRefresh } = req.body
    const { data } = await getOrCompute<CachedTipData>(
      `cast/v1/${castUrl}`,
      async () => {
        const { data } = await fetchTipValidation(castUrl, forceRefresh)
        if (!data) {
          throw new Error("Invalid tip cast")
        }
        return { data, timestamp: Date.now() }
      },
      forceRefresh
    )
    return res.send({ data })
  } catch (e) {
    console.error(e)
    return res.send({ error: (e as any).message })
  }
}

export default handler
