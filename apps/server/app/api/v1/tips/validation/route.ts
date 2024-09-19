import { cache } from "@/app/api/cache";
import { NextRequest, NextResponse } from "next/server";
import { fetchCastFromNeynar } from "./fetch-cast-from-neynar";

export const dynamic = "force-dynamic";

interface TipResponse {
  username?: string;
  fid: number;
  tip_amount: number;
  timestamp: string;
}

async function fetchTip(hash: string) {
  const tipResp = await fetch(
    `https://www.degentip.me/api/get_degen_successful_tips?hash=${hash}`
  );
  return (await tipResp.json()) as TipResponse;
}

async function fetchTipFromDegenTips(hash: string) {
  const tipResp = await fetch(
    `https://api.degen.tips/airdrop2/tips?hash=\\${hash.substring(1)}`
  );
  const tips = (await tipResp.json()) as {
    tip_amount: "string";
    tip_status: "valid" | "invalid";
  }[];
  return tips[0];
}

async function resolveTip(hash: string) {
  const [tip, tipFromDegenTips] = await Promise.all([
    fetchTip(hash).catch(() => null),
    fetchTipFromDegenTips(hash).catch(() => null),
  ]);
  return tipFromDegenTips ?? tip?.tip_amount != null
    ? { tip_amount: tip?.tip_amount.toString(), tip_status: "valid" }
    : null;
}

interface TipValidationResult {
  amount?: number;
}
interface CachedTipValidationResult {
  data?: TipValidationResult;
  timestamp: number;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const castUrl = q.get("castUrl");
  const forceRefresh = q.get("forceRefresh") === "true";
  const apiKey = req.headers.get("x-dte-api-key");

  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!castUrl) {
      return NextResponse.json({ error: "Missing castUrl" }, { status: 400 });
    }

    const cacheKey = `tip/v1/${castUrl}`;
    if (!forceRefresh) {
      const cached = await cache.get<CachedTipValidationResult>(cacheKey);
      if (cached) {
        return NextResponse.json({ data: cached.data });
      }
    }

    const cast = await fetchCastFromNeynar(castUrl);
    if (!cast) {
      await cache.set<CachedTipValidationResult>(
        cacheKey,
        {
          timestamp: Date.now(),
        },
        10 * 60
      );
      return NextResponse.json({ error: "Cast not found" }, { status: 404 });
    }
    const tip = cast ? await resolveTip(cast.hash) : null;
    const tipAmount =
      tip?.tip_status === "valid" && tip.tip_amount
        ? parseInt(tip.tip_amount, 10)
        : undefined;
    await cache.set<CachedTipValidationResult>(
      cacheKey,
      {
        data: { amount: tipAmount },
        timestamp: Date.now(),
      },
      !tipAmount ? 10 * 60 : undefined
    );
    return NextResponse.json({ data: { amount: tipAmount } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: (e as any).message }, { status: 500 });
  }
}
