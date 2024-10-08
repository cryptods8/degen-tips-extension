import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllowanceFromDegenTips,
  fetchAllowanceFromDownshift,
} from "./fetch-allowance";

export const dynamic = "force-dynamic";

function getRegularExpirationTimestamp() {
  const now = new Date();
  const expiration = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  // trim to day
  expiration.setUTCHours(0);
  expiration.setUTCMinutes(0);
  expiration.setUTCSeconds(0);
  expiration.setUTCMilliseconds(0);
  //
  return expiration.getTime();
}

function getExpirationTimestamp(timeUntilReset: string) {
  // e.g. "16h 56m"
  const match = /(\d+)h\s?(\d+)m/.exec(timeUntilReset);
  if (!match) {
    return null;
  }
  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  const now = new Date();
  const expiration = new Date(
    now.getTime() + hours * 60 * 60 * 1000 + minutes * 60 * 1000
  );
  // trim to minutes
  expiration.setSeconds(0);
  expiration.setMilliseconds(0);
  //
  return expiration.getTime();
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const fidStr = q.get("fid");
  const fid = fidStr ? parseInt(fidStr, 10) : undefined;
  const apiKey = req.headers.get("x-dte-api-key");

  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!fid) {
      return NextResponse.json({ error: "Missing fid" }, { status: 400 });
    }

    // const allo = await fetchAllowanceFromDownshift(fid);
    // const data = allo
    //   ? {
    //       allowance: allo.allowance,
    //       remaining: allo.remainingAllowance,
    //       expirationTimestamp: getExpirationTimestamp(allo.timeUntilReset),
    //     }
    //   : undefined;
    const allo = await fetchAllowanceFromDegenTips(fid);
    const data =
      allo && allo.tip_allowance && allo.remaining_tip_allowance
        ? {
            allowance: parseInt(allo.tip_allowance, 10),
            remaining: parseInt(allo.remaining_tip_allowance, 10),
            expirationTimestamp: getRegularExpirationTimestamp(),
          }
        : undefined;
    return NextResponse.json({ data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: (e as any).message }, { status: 500 });
  }
}
