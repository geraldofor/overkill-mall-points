// ============================================================================
// OVERKILL MALL — Scoring System v1
// ============================================================================

/** Points per action */
export const SCORE = {
  // Combat
  KILL: 100,
  HEADSHOT: 50, // bonus on top of kill
  DAMAGE_PER_10: 5, // 5 points per 10 damage dealt
  ASSIST: 30,

  // Survival
  SURVIVAL_PER_SECOND: 2, // 2 points per second alive

  // Placement
  PLACEMENT_WIN: 500,
  PLACEMENT_TOP2: 350,
  PLACEMENT_TOP3: 250,
  PLACEMENT_TOP5: 150,
  PLACEMENT_TOP10: 50,

  // Objectives
  ITEM_COLLECT: 25,

  // Killstreaks
  KILLSTREAK_3: 50, // triple kill bonus
  KILLSTREAK_5: 100, // mega kill bonus
  KILLSTREAK_7: 200, // overkill bonus
  KILLSTREAK_10: 500, // unstoppable bonus
} as const;

/** Placement bonus lookup */
export function getPlacementScore(placement: number): number {
  if (placement === 1) return SCORE.PLACEMENT_WIN;
  if (placement === 2) return SCORE.PLACEMENT_TOP2;
  if (placement === 3) return SCORE.PLACEMENT_TOP3;
  if (placement <= 5) return SCORE.PLACEMENT_TOP5;
  if (placement <= 10) return SCORE.PLACEMENT_TOP10;
  return 0;
}

/** Killstreak bonus (cumulative) */
export function getKillstreakBonus(killstreak: number): number {
  let bonus = 0;
  if (killstreak >= 3) bonus += SCORE.KILLSTREAK_3;
  if (killstreak >= 5) bonus += SCORE.KILLSTREAK_5;
  if (killstreak >= 7) bonus += SCORE.KILLSTREAK_7;
  if (killstreak >= 10) bonus += SCORE.KILLSTREAK_10;
  return bonus;
}

/** Killstreak label */
export function getKillstreakLabel(killstreak: number): string | null {
  if (killstreak >= 10) return "UNSTOPPABLE!";
  if (killstreak >= 7) return "OVERKILL!";
  if (killstreak >= 5) return "MEGA KILL!";
  if (killstreak >= 3) return "TRIPLE KILL!";
  return null;
}

/** Full score breakdown for a match */
export interface ScoreBreakdown {
  kills: number;
  headshots: number;
  damageDealt: number;
  assists: number;
  survivalTime: number;
  placement: number;
  itemsCollected: number;
  killstreakMax: number;
  // Calculated subtotals
  combatScore: number;
  survivalScore: number;
  placementScore: number;
  objectiveScore: number;
  streakBonus: number;
  totalScore: number;
}

export function calculateMatchScore(data: {
  kills: number;
  headshots: number;
  damageDealt: number;
  assists: number;
  survivalTime: number;
  placement: number;
  itemsCollected: number;
  killstreakMax: number;
}): ScoreBreakdown {
  const combatScore =
    data.kills * SCORE.KILL +
    data.headshots * SCORE.HEADSHOT +
    Math.floor(data.damageDealt / 10) * SCORE.DAMAGE_PER_10 +
    data.assists * SCORE.ASSIST;

  const survivalScore = Math.floor(data.survivalTime * SCORE.SURVIVAL_PER_SECOND);

  const placementScore = getPlacementScore(data.placement);

  const objectiveScore = data.itemsCollected * SCORE.ITEM_COLLECT;

  const streakBonus = getKillstreakBonus(data.killstreakMax);

  const totalScore =
    combatScore + survivalScore + placementScore + objectiveScore + streakBonus;

  return {
    ...data,
    combatScore,
    survivalScore,
    placementScore,
    objectiveScore,
    streakBonus,
    totalScore,
  };
}

/** Level from total score */
export function getLevel(totalScore: number): number {
  // Roughly 1 level per 1000 total score, max level ~50
  return Math.min(50, Math.floor(totalScore / 1000) + 1);
}