import cssText from "data-text:~style.css"
import type {
  PlasmoCSConfig,
  PlasmoGetInlineAnchorList,
  PlasmoRender
} from "plasmo"
import { useCallback, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import { sendToBackground } from "@plasmohq/messaging"

import type { AllowanceData } from "~background/messages/fetch-allowance"
import type { FidData } from "~background/messages/fetch-fid-from-handle"
import * as storage from "~utils/storage"

export const config: PlasmoCSConfig = {
  matches: ["https://warpcast.com/*"],
  css: ["degen-font.css"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const selectors = [
  //testing "#root > div > div > div > main > div > div > div:nth-child(1) > div.flex.flex-row.items-center.space-x-1.border-b.p-2.border-default",
  "#modal-root > div > div > div > div > div.w-full.px-4 > span.block > div > div.flex.w-full.flex-row > div > div.flex.w-full.grow-0.flex-col"
] as const

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  const fullSelectors = selectors.join(", ")
  const anchors = document.querySelectorAll(fullSelectors)
  return Array.from(anchors).map((element) => ({
    element,
    insertPosition: "afterend"
  }))
}

function HatIcon() {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 789 668"
      className="h-3 w-auto text-violet-500">
      <path d="M115.185 411.477L118.367 469.444C118.575 473.392 120.055 477.107 122.552 480.15C140.007 501.282 218.264 575.014 394.616 575.014C570.968 575.014 648.278 502.234 666.38 480.544C669.108 477.27 670.68 473.206 670.934 468.933L674.089 411.517C695.084 399.997 716.758 386.98 716.758 386.98C750.835 368.518 788.866 395.038 788.935 433.936C789.051 496.87 739.877 561.545 673.548 602.301C598.758 648.258 487.117 667.324 394.664 667.324C302.211 667.324 190.57 648.258 115.78 602.301C49.4513 561.545 0.277187 496.893 0.392781 433.936C0.462138 395.038 38.4929 368.518 72.5702 386.98C72.5702 386.98 94.207 399.965 115.185 411.477Z"></path>
      <path d="M394.641 0.113525C538.834 0.113525 577.929 3.48079 636.558 10.2154H636.535C663.561 13.3272 685.224 33.438 683.212 60.6782L661.616 354.872C654.858 356.83 647.488 359.303 639.223 362.077C595.905 376.615 527.997 399.404 394.64 399.404C261.283 399.404 193.376 376.615 150.057 362.077C141.784 359.3 134.407 356.825 127.643 354.866L106.047 60.6782C104.059 33.438 125.652 12.8395 152.724 10.2154C210.637 4.59548 270.932 0.113525 394.641 0.113525ZM137.991 495.835L138.067 496.869L139.557 497.212C139.024 496.748 138.502 496.289 137.991 495.835ZM649.85 497.178L651.193 496.869L651.262 495.928C650.8 496.341 650.329 496.757 649.85 497.178Z"></path>
    </svg>
  )
}

function RefreshIcon({ spin }: { spin?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={`size-4 ${spin ? "animate-spin" : ""}`}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  )
}

function AllowanceComponent({
  fid,
  defaultData
}: {
  fid: number
  defaultData: AllowanceData | null
}) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AllowanceData | null>(defaultData)
  const handleRefresh = useCallback(() => {
    setLoading(true)
    fetchAllowance(fid)
      .then((r) => {
        if (r.data) {
          setDefaultData(fid, r.data)
        }
        setData(r.data)
      })
      .finally(() => setLoading(false))
  }, [setLoading, setData, fid])
  useEffect(() => handleRefresh(), [handleRefresh])

  useEffect(() => {
    if (data?.expirationTimestamp == null) {
      return
    }
    const expiresIn = data.expirationTimestamp - Date.now()
    const delay = expiresIn <= 0 ? 60 * 1000 : expiresIn
    const timeout = setTimeout(() => {
      handleRefresh()
    }, delay)

    return () => clearTimeout(timeout)
  }, [handleRefresh, data])

  return (
    <AllowancePanel data={data} isLoading={loading} onRefresh={handleRefresh} />
  )
}

function ProgressCircle({
  value,
  maxValue
}: {
  value: number
  maxValue: number
}) {
  const ratio = value / maxValue
  const circleRadius = 100
  const progressRadius = 50
  const progressCircumference = 2 * Math.PI * progressRadius
  const progressLength = ratio * progressCircumference
  return (
    <div className="flex items-center justify-end w-3 h-3 bg-lime-500/15 rounded-full relative text-lime-500">
      <svg
        width={"0.75rem"}
        height={"0.75rem"}
        viewBox="0 0 200 200"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: "rotate(-90deg)" }}>
        <circle
          r={progressRadius}
          cx="100"
          cy="100"
          stroke="currentColor"
          strokeWidth={(circleRadius - progressRadius) * 2}
          // strokeLinecap="round"
          strokeDashoffset={`${progressLength}px`}
          fill="transparent"
          strokeDasharray={`${progressLength}px ${
            progressCircumference - progressLength
          }px`}></circle>
      </svg>
    </div>
  )
}

const MINUTE_MILLIS = 60 * 1000
const HOUR_MILLIS = 60 * MINUTE_MILLIS
function formatExpiration(expirationInMillis: number): string {
  const hours = Math.floor(expirationInMillis / HOUR_MILLIS)
  const minutes = Math.floor((expirationInMillis % HOUR_MILLIS) / MINUTE_MILLIS)
  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${hours}h`
  }
  return `${minutes}m`
}

function AllowancePanel({
  data,
  isLoading,
  onRefresh
}: {
  data?: AllowanceData | undefined | null
  isLoading: boolean
  onRefresh: () => void
}) {
  const cls = "text-gray-900 dark:text-gray-200"
  const { remaining, allowance, expirationTimestamp } = data || {}
  const expirationInMillis = expirationTimestamp - Date.now()

  return (
    <div
      className={`flex items-center gap-1 text-sm w-full ${cls}`}
      onClick={(e) => e.stopPropagation()}>
      {data ? (
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-3 justify-between w-full px-2">
            <HatIcon />
            <div className="flex flex-1 justify-between gap-3">
              <div className="flex items-baseline">
                <div>{remaining.toLocaleString("en")}</div>
                <div className="opacity-60 text-xs">
                  /{allowance.toLocaleString("en")}
                </div>
              </div>
              {expirationInMillis > 0 ? (
                <div className="flex items-center text-xs gap-1.5">
                  <span>Expires in:</span>
                  <ProgressCircle
                    value={expirationInMillis}
                    maxValue={24 * HOUR_MILLIS}
                  />
                  <span>{formatExpiration(expirationInMillis)}</span>
                </div>
              ) : (
                <div className="text-xs text-red-900">Expired</div>
              )}
            </div>
          </div>
          <div className="flex w-full overflow-hidden bg-lime-500/15 relative h-2">
            <div
              className={`bg-lime-500 h-full ${remaining > 0 ? "min-w-6" : ""}`}
              style={{ width: `${(100 * remaining) / allowance}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="text-xs opacity-70">No allowance data found</div>
      )}

      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="hover:opacity-60 mx-2">
        <RefreshIcon spin={isLoading} />
      </button>
    </div>
  )
}

async function fetchAllowance(fid: number) {
  try {
    const resp = await sendToBackground({
      name: "fetch-allowance",
      body: { fid }
    })
    return resp as { data?: AllowanceData }
  } catch (e) {
    console.error("ERROR", e)
    return null
  }
}

async function fetchFid(handle: string) {
  try {
    const resp = await sendToBackground({
      name: "fetch-fid-from-handle",
      body: { handle }
    })
    return resp as { data?: FidData }
  } catch (e) {
    console.error("ERROR", e)
    return null
  }
}

function determineTheme(window?: Window): "dark" | "light" {
  const doc = window?.document
  if (doc) {
    const rootNode = doc.querySelector("html")
    const colorScheme = rootNode?.style.colorScheme
    if (colorScheme === "dark" || colorScheme === "light") {
      return colorScheme
    }
  }
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function setDefaultData(fid: number, data: AllowanceData) {
  storage.set(`allowance-${fid}`, data)
}

async function getDefaultData(fid: number) {
  return await storage.get<AllowanceData>(`allowance-${fid}`)
}

// profile button selector:
// #root > div > div > div > aside > div > div > a[title="Profile"]
async function getFid(window?: Window): Promise<number | null> {
  const doc = window?.document
  if (!doc) {
    return null
  }
  const profileButton = doc.querySelector(
    "#root > div > div > div > aside > div > div > a[title='Profile']"
  )
  if (!profileButton) {
    return null
  }
  const href = profileButton.getAttribute("href")
  if (!href) {
    return null
  }
  const match = href.match(/\/([^/]+)$/)
  const handle = match && match[1]
  if (!handle) {
    const lastFid = await storage.get<number>("lastFid")
    return lastFid || null
  }
  const fidByHandle = await storage.get<number>(`fid-${handle}`)
  if (fidByHandle) {
    return fidByHandle
  }
  const resp = await fetchFid(handle)
  const fid = resp.data?.fid
  if (fid) {
    storage.set(`fid-${handle}`, fid)
    storage.set("lastFid", fid)
  }
  return fid || null
}

export const render: PlasmoRender<any> = async (
  { anchor, createRootContainer },
  InlineCSUIContainer
) => {
  if (!anchor || !createRootContainer) {
    return
  }
  const rootContainer = await createRootContainer(anchor)
  const root = createRoot(rootContainer)

  const fid = await getFid(window)
  const defaultData = fid ? await getDefaultData(fid) : null

  root.render(
    <InlineCSUIContainer anchor={anchor}>
      {fid && (
        <div
          className={`w-full flex ${determineTheme(window)} pb-2`}
          style={{ fontFamily: "Degen" }}>
          <AllowanceComponent fid={fid} defaultData={defaultData} />
        </div>
      )}
    </InlineCSUIContainer>
  )
}
