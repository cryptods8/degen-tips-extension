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
