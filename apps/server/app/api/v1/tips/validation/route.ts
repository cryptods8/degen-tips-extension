import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

function redis() {
  if (!process.env.REDIS_API_URL || !process.env.REDIS_API_TOKEN) {
    return null;
  }
  const redis = new Redis({
    url: process.env.REDIS_API_URL,
    token: process.env.REDIS_API_TOKEN,
  });
  return redis;
}

const cache = {
  get: async <V>(key: string): Promise<V | null> => {
    const r = redis();
    if (!r) {
      return Promise.resolve(null);
    }
    const value = await r.get(key);
    return value as V | null;
  },
  set: async <V>(
    key: string,
    value: V,
    customExpiry?: number
  ): Promise<void> => {
    const r = redis();
    if (!r) {
      return;
    }
    // 7-day expiry
    r.setex(key, customExpiry ?? 7 * 24 * 60 * 60, value);
  },
};

export const dynamic = "force-dynamic";

interface Cast {
  hash: string;
  text: string;
}
interface CastResponse {
  cast?: Cast;
}

async function fetchCast(castUrl: string) {
  if (!process.env.NEYNAR_API_KEY) {
    throw new Error("NEYNAR_API_KEY not set");
  }
  const url = `https://api.neynar.com/v2/farcaster/cast?identifier=${castUrl}&type=url`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      api_key: process.env.NEYNAR_API_KEY,
    },
  };
  const castResp = await fetch(url, options);
  const cast = await castResp.json();

  return cast as CastResponse;
}

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
  /*
  {
    "snapshot_day": "2024-08-19T00:00:00.000Z",
    "timestamp": "2024-08-19T09:43:26.000Z",
    "cast_hash": "\\x8807fff56ceb6a285ed5c1e092828dd189361cee",
    "fid": "11124",
    "tip_status": "valid",
    "tip_type": "regular",
    "tip_amount": "200",
    "rolling_daily_tip_amount": "400",
    "tip_allowance": "9462"
  }
  */

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
  return tipFromDegenTips ?? tip != null
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

    const { cast } = await fetchCast(castUrl);
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
