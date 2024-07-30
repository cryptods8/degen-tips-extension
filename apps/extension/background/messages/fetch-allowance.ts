import type { PlasmoMessaging } from "@plasmohq/messaging"

async function fetchAllowance(fid: number): Promise<AllowanceResponse> {
  const apiBaseUrl =
    process.env.PLASMO_PUBLIC_PROXY_URL || "http://localhost:3000"
  const apiKey = process.env.PLASMO_PUBLIC_PROXY_KEY
  if (!apiKey) {
    throw new Error("PLASMO_PUBLIC_PROXY_KEY not set")
  }
  const params = new URLSearchParams()
  params.set("fid", fid.toString())
  const resp = await fetch(
    `${apiBaseUrl}/api/v1/tips/allowance?${params.toString()}`,
    { headers: { "x-dte-api-key": apiKey } }
  )
  if (!resp.ok) {
    throw new Error(`Failed to fetch allowance data!`)
  }
  const data = await resp.json()

  return data as AllowanceResponse
}

export interface AllowanceData {
  allowance?: number
  remaining?: number
  expirationTimestamp?: number | null
}

interface AllowanceResponse {
  data: AllowanceData
  timestamp: number
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const { fid } = req.body
    const { data } = await fetchAllowance(fid)
    return res.send({ data })
  } catch (e) {
    console.error(e)
    return res.send({ error: (e as any).message })
  }
}

export default handler
