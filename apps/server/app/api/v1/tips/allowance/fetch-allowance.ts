/*
https://degentip.bot/allowance/degen/243719
{
"fid": 243719,
"timeUntilReset": "16h 56m",
"snapshotDate": "2024-07-26",
"allowance": 7460,
"remainingAllowance": 7460
}
*/

export interface AllowanceFromDownshift {
  fid: number;
  timeUntilReset: string;
  snapshotDate: string | boolean;
  userRank: number | null;
  allowance: number;
  remainingAllowance: number;
}

const tipAllowanceApiUrl = "https://degentip.bot/allowance/degen";

export async function fetchAllowanceFromDownshift(
  fid: number
): Promise<AllowanceFromDownshift | null> {
  try {
    const res: AllowanceFromDownshift = await fetch(
      `${tipAllowanceApiUrl}/${fid}`
    ).then((res) => res.json());
    return res;
  } catch (e) {
    console.error("Error fetching allowance from downshift: ", e);
    return null;
  }
}

export interface AllowanceFromDegenTips {
  fid: string;
  tip_allowance?: string;
  remaining_tip_allowance?: string;
}

export async function fetchAllowanceFromDegenTips(
  fid: number
): Promise<AllowanceFromDegenTips | null> {
  try {
    const res: AllowanceFromDegenTips[] = await fetch(
      `https://api.degen.tips/airdrop2/allowances?fid=${fid}&limit=1`
    ).then((res) => res.json());
    return res?.[0] ?? null;
  } catch (e) {
    console.error("Error fetching allowance from degentips: ", e);
    return null;
  }
}
