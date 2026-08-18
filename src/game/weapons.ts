// ============================================================================
// OVERKILL MALL — Weapon Definitions v2
// ============================================================================

import { WeaponDef, WeaponType } from "./types";

export const WEAPONS: Record<WeaponType, WeaponDef> = {
  pistol: {
    name: "Pistola",
    damage: 22,
    fireRate: 350,
    bulletSpeed: 480,
    spread: 0.08,
    moveSpreadPenalty: 0.04,
    recoil: 0.15,
    magSize: 15,
    reloadTime: 1500,
    range: 1.2,
    pellets: 1,
    headshotMult: 2.0,
    damageDropoff: 0.6,
  },

  smg: {
    name: "Submetralhadora",
    damage: 14,
    fireRate: 80,          // very fast fire rate
    bulletSpeed: 520,
    spread: 0.12,
    moveSpreadPenalty: 0.06,
    recoil: 0.25,
    magSize: 35,
    reloadTime: 2000,
    range: 1.0,
    pellets: 1,
    headshotMult: 1.8,
    damageDropoff: 0.5,
  },

  rifle: {
    name: "Fuzil de Assalto",
    damage: 18,
    fireRate: 120,
    bulletSpeed: 620,
    spread: 0.05,
    moveSpreadPenalty: 0.03,
    recoil: 0.3,
    magSize: 30,
    reloadTime: 2200,
    range: 1.8,
    pellets: 1,
    headshotMult: 2.5,
    damageDropoff: 0.7,
  },

  shotgun: {
    name: "Espingarda",
    damage: 12,            // per pellet
    fireRate: 900,
    bulletSpeed: 450,
    spread: 0.25,
    moveSpreadPenalty: 0.08,
    recoil: 0.6,
    magSize: 8,
    reloadTime: 2800,
    range: 0.6,
    pellets: 7,            // fires 7 pellets
    headshotMult: 1.5,
    damageDropoff: 0.4,
  },

  sniper: {
    name: "Sniper",
    damage: 75,
    fireRate: 1500,
    bulletSpeed: 1200,
    spread: 0.01,
    moveSpreadPenalty: 0.15, // very inaccurate while moving
    recoil: 0.8,
    magSize: 5,
    reloadTime: 3000,
    range: 3.0,
    pellets: 1,
    headshotMult: 3.0,
    damageDropoff: 0.85,
  },
};

/** Calculate actual damage with distance falloff */
export function calcDamage(
  weapon: WeaponDef,
  baseDamage: number,
  distance: number,
  isHeadshot: boolean,
  armorLevel: number,
): number {
  const rangePixels = weapon.range * 600; // convert range multiplier to pixels
  const dropoffStart = rangePixels * weapon.damageDropoff;

  let dmg = baseDamage;

  // Distance falloff
  if (distance > dropoffStart) {
    const falloff = 1 - ((distance - dropoffStart) / (rangePixels - dropoffStart));
    dmg *= Math.max(0.3, falloff); // minimum 30% damage at max range
  }

  // Headshot multiplier
  if (isHeadshot) {
    dmg *= weapon.headshotMult;
  }

  // Armor reduction
  const armorReductions: Record<number, number> = {
    0: 0,
    1: 0.15,
    2: 0.25,
    3: 0.35,
    4: 0.45,
  };
  const reduction = armorReductions[armorLevel] || 0;
  dmg *= (1 - reduction);

  return Math.floor(dmg);
}

/** Calculate spread with movement and crouch modifiers */
export function calcSpread(
  weapon: WeaponDef,
  isMoving: boolean,
  isCrouching: boolean,
): number {
  let spread = weapon.spread;
  if (isMoving) spread += weapon.moveSpreadPenalty;
  if (isCrouching) spread *= 0.6; // crouch reduces spread by 40%
  return spread;
}
