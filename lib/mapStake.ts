import type { Stake, QuestType, StakeRule } from "@/types/stakes";
import { localDateKey } from "@/lib/stakeTracker";

function isStakeRule(value: unknown): value is StakeRule {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as any).type === "screen_time_limit" &&
    (value as any).operator === "less_than" &&
    (value as any).scope === "overall" &&
    typeof (value as any).limitMs === "number"
  );
}

function parseRule(descriptionRaw: unknown): StakeRule | undefined {
  if (!descriptionRaw) return undefined;

  if (typeof descriptionRaw === "object" && descriptionRaw !== null) {
    return isStakeRule(descriptionRaw) ? descriptionRaw : undefined;
  }

  if (typeof descriptionRaw === "string") {
    try {
      const parsed = JSON.parse(descriptionRaw);
      return isStakeRule(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function countLocalDaysInclusive(
  startValue: Date | string,
  endValue: Date | string,
): number {
  const start = startValue instanceof Date ? startValue : new Date(startValue);
  const end = endValue instanceof Date ? endValue : new Date(endValue);
  const endKey = localDateKey(end);
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  let count = 0;

  while (localDateKey(cursor) <= endKey) {
    count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

export function mapStake(q: any): Stake {
  const now = new Date();
  const expiresMs = q.expires_at ? new Date(q.expires_at).getTime() : null;

  const daysTotal = expiresMs ? countLocalDaysInclusive(q.created_at, q.expires_at) : 0;
  const daysLeft =
    expiresMs && now.getTime() <= expiresMs
      ? countLocalDaysInclusive(now, q.expires_at)
      : 0;
  const elapsed = Math.max(0, daysTotal - daysLeft);
  const progressPercent =
    daysTotal > 0 ? Math.min(100, Math.round((elapsed / daysTotal) * 100)) : 0;

  const rule = parseRule(q.description);

  return {
    id: q.id,
    familyId: q.family_id,
    title: q.title ?? "Untitled",
    description: q.description,
    rule: rule,
    reward: Number(q.reward) || 0,
    type: q.type as QuestType,
    icon_url: q.icon_url ?? undefined,
    created_at: q.created_at,
    expires_at: q.expires_at ?? null,
    status: q.status,
    daysTotal,
    daysLeft,
    progressPercent,
    streak: q.streak ?? 0,
  };
}
