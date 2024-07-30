import cssText from "data-text:~style.css"
import type {
  PlasmoCSConfig,
  PlasmoCSUIAnchor,
  PlasmoGetInlineAnchorList,
  PlasmoRender
} from "plasmo"
import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import { sendToBackground } from "@plasmohq/messaging"

import type { TipData } from "~background/messages/fetch-tip"

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
  "div.flex.flex-col.whitespace-pre-wrap.break-words.text-lg.leading-6.tracking-normal",
  "div.flex.flex-col.whitespace-pre-wrap.break-words.text-base.leading-5.tracking-normal"
] as const

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  const fullSelectors = selectors
    .map((s) => `main > div > div > div > div ${s}`)
    .join(", ")
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
      className="h-3 w-auto text-violet-600 dark:text-violet-700">
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

type TipStatus = "valid" | "invalid" | "unknown"

function TipComponent({
  data,
  amount,
  castUrl
}: {
  data: TipData | null | undefined
  amount: number
  castUrl: string
}) {
  const [loading, setLoading] = useState(false)
  const [tipData, setTipData] = useState<TipData | null | undefined>(null)

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const newTipData = await fetchTip(castUrl, true)
      setTipData(newTipData?.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchTip(castUrl)
      .then((resp) => setTipData(resp?.data))
      .finally(() => setLoading(false))
  }, [castUrl, setTipData, setLoading])

  return (
    <TipBadge
      status={
        tipData ? (tipData.amount != null ? "valid" : "invalid") : "unknown"
      }
      isLoading={loading}
      amount={amount}
      onRefresh={handleRefresh}
    />
  )
}

function TipBadge({
  amount,
  status,
  isLoading,
  onRefresh
}: {
  amount: number
  status: TipStatus
  isLoading: boolean
  onRefresh: () => void
}) {
  const formattedAmount = amount.toLocaleString("en")
  const label =
    status === "valid" ? "Valid" : status === "invalid" ? "Invalid" : "Unknown"
  const cls =
    status === "valid"
      ? "bg-lime-200 text-lime-900 dark:bg-lime-900 dark:text-lime-200"
      : status === "invalid"
        ? "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200"
        : "bg-gray-200 text-gray-900 dark:bg-gray-900 dark:text-gray-200"
  return (
    <div
      className={`px-3 flex items-center gap-1 py-1 text-sm ${cls}`}
      onClick={(e) => e.stopPropagation()}>
      <div className="pr-2">
        <HatIcon />
      </div>
      <span>{label}</span>
      <span>&middot;</span>
      <span>{`${formattedAmount} $DEGEN`}</span>
      {(status === "unknown" || status === "invalid") && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="hover:opacity-60 ml-2">
          <RefreshIcon spin={isLoading} />
        </button>
      )}
    </div>
  )
}

async function fetchTip(castUrl: string, forceRefresh = false) {
  try {
    const tipResp = await sendToBackground({
      name: "fetch-tip",
      body: { castUrl, forceRefresh }
    })
    return tipResp as { data?: TipData }
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

interface CastMetadata {
  text: string
  castUrl: string
  isRoot: boolean
  isCurrent: boolean
  isTip: boolean
  amount?: number
}

function extractCastMetadata(anchor: PlasmoCSUIAnchor): CastMetadata | null {
  const { pathname } = window.location
  const isCastContext =
    /^\/[^\/]+\/[^\/]+/.test(pathname) &&
    !pathname.startsWith("/~/") &&
    pathname.search("/quotes") === -1
  const elem = anchor.element
  const isCurrent = isCastContext && elem.matches(selectors[0])

  // clean up the text element
  const textElem = elem.cloneNode(true) as HTMLElement
  textElem
    .querySelectorAll("div.mt-2.inline-flex.flex-col.justify-center.space-y-1")
    .forEach((a) => a.remove())

  const textContent = textElem.textContent
  const regex = /(\d+) \$degen/i
  const match = textContent.match(regex)

  const linkElem = elem.parentElement.firstElementChild.querySelector(
    ":scope > div > a:last-child"
  )
  const link = linkElem
    ? (linkElem as HTMLAnchorElement).href
    : window.location.href
  // reply:
  // 1) we're in the cast context and the cast has a previous sibling
  // 2) contains "replying to" container
  // 3) does not have the border-faint class and has a previous sibling
  const rootCastElem = isCurrent
    ? elem.parentElement?.parentElement?.parentElement
    : elem.parentElement.parentElement?.parentElement?.parentElement
        .parentElement?.parentElement

  const hasPrevSibling = rootCastElem?.previousElementSibling != null
  let isReply: boolean
  if (isCastContext) {
    isReply = hasPrevSibling
  } else {
    const isNotifReply = !!rootCastElem?.querySelector(
      "div.flex.flex-row.space-x-1.pb-1.text-xs.text-muted"
    )
    const elemContainer =
      elem.parentElement?.parentElement?.parentElement?.parentElement
    const isCastReply =
      elemContainer.matches(".relative.cursor-pointer.px-4.py-2") &&
      !elemContainer.matches(".border-faint") &&
      hasPrevSibling
    isReply = isNotifReply || isCastReply
  }
  const isTip = isReply && !!match?.[1]

  return {
    text: textContent,
    castUrl: link,
    isRoot: !isReply,
    isCurrent,
    isTip,
    amount: isTip ? parseInt(match[1], 10) : undefined
  }
}

export const render: PlasmoRender<any> = async (
  { anchor, createRootContainer },
  InlineCSUIContainer
) => {
  if (!anchor || !createRootContainer) {
    return
  }
  const castMetadata = extractCastMetadata(anchor)

  const rootContainer = await createRootContainer(anchor)
  const root = createRoot(rootContainer)

  // const tipData = castMetadata.isTip
  //   ? await fetchTip(castMetadata.castUrl)
  //   : null

  root.render(
    <InlineCSUIContainer anchor={anchor}>
      {castMetadata.isTip && (
        <div
          className={`w-full flex ${determineTheme(window)}`}
          style={{ fontFamily: "Degen" }}>
          <div className={castMetadata.isCurrent ? "pt-4" : "pt-1 pb-2"}>
            <TipComponent
              castUrl={castMetadata.castUrl}
              data={null}
              amount={castMetadata.amount}
            />
          </div>
        </div>
      )}
      {/* <div className="bg-red-700 text-white">
        {castMetadata.isRoot ? "Root" : "Reply"}
      </div> */}
    </InlineCSUIContainer>
  )
}
