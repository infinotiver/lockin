/** Shared coin economy defaults for client and server calculations. */
export const STARTER_GRANT = 200;
export const DAY_PASS_REWARD = 10;
export const DAILY_EARN_CAP = 30;

export const WAGER_MIN = 10;
export const WAGER_MAX = 500;
export const MAX_ACTIVE_COIN_STAKES = 1;

export const WIN_BONUS_TIERS = [
  { minDays: 1, maxDays: 3, rate: 0.1 },
  { minDays: 4, maxDays: 7, rate: 0.25 },
  { minDays: 8, maxDays: 14, rate: 0.4 },
  { minDays: 15, maxDays: 30, rate: 0.6 },
] as const;

export const FREEZE_PRICE = 150;
export const MAX_FREEZES_HELD = 2;
export function getWinBonusRate(durationDays: number): number {
  return (
    WIN_BONUS_TIERS.find(
      ({ minDays, maxDays }) => durationDays >= minDays && durationDays <= maxDays,
    )?.rate ?? 0
  );
}

export function getWinBonus(wager: number, durationDays: number): number {
  return Math.floor(wager * getWinBonusRate(durationDays));
}
