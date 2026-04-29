export const POINT_VALUES = {
  low: 5,
  medium: 10,
  high: 20,
};

export const ELIGIBLE_ROLES = ['employee', 'team_leader', 'hr'];

export const TIERS = [
  { name: 'none',     threshold: 0,    color: '#94a3b8', label: 'No Badge' },
  { name: 'bronze',   threshold: 100,  color: '#cd7f32', label: 'Bronze' },
  { name: 'silver',   threshold: 300,  color: '#b8c5d6', label: 'Silver' },
  { name: 'gold',     threshold: 600,  color: '#fbbf24', label: 'Gold' },
  { name: 'platinum', threshold: 1000, color: '#a78bfa', label: 'Platinum' },
  { name: 'diamond',  threshold: 2000, color: '#22d3ee', label: 'Diamond' },
];

export const TIER_RANK = TIERS.reduce((acc, t, idx) => {
  acc[t.name] = idx;
  return acc;
}, {});

export function computeTier(points) {
  let current = 'none';
  for (const t of TIERS) {
    if (points >= t.threshold) current = t.name;
  }
  return current;
}

export function nextTier(points) {
  for (const t of TIERS) {
    if (points < t.threshold) return t;
  }
  return null;
}

export function tierProgress(points) {
  const current = TIERS.find(t => t.name === computeTier(points));
  const next = nextTier(points);
  if (!next) return 1;
  const span = next.threshold - current.threshold;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(1, (points - current.threshold) / span));
}

export function getTier(name) {
  return TIERS.find(t => t.name === name) || TIERS[0];
}
