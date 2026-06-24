// lib/mapStake.ts
import type { Stake, StakeStatus, QuestType } from "@/types/stakes";

export function mapStake(q: any): Stake {
  const now = Date.now();
  const expiresMs = q.expires_at ? new Date(q.expires_at).getTime() : null;
  const createdMs = new Date(q.created_at).getTime();

  const daysTotal = expiresMs
    ? Math.ceil((expiresMs - createdMs) / 86400000)
    : 0;
  const daysLeft = expiresMs
    ? Math.max(0, Math.ceil((expiresMs - now) / 86400000))
    : 0;
  const elapsed = daysTotal - daysLeft;
  const progressPercent =
    daysTotal > 0 ? Math.min(100, Math.round((elapsed / daysTotal) * 100)) : 0;

  return {
    id: q.id,
    familyId: q.family_id,
    title: q.title ?? "Untitled",
    description: q.description ?? undefined,
    reward: Number(q.reward) || 0,
    type: q.type as QuestType,
    icon_url: q.icon_url ?? undefined,
    created_at: q.created_at,
    expires_at: q.expires_at ?? null,
    status: q.status,
    daysTotal,
    daysLeft,
    progressPercent,
    streak: 0,
  };
}
