import type { PlasmoMessaging } from "@plasmohq/messaging"
import { getOrCompute } from "~utils/storage"

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
