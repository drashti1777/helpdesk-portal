import React from 'react';
import { Award, Medal, Trophy, Crown, Gem, Shield } from 'lucide-react';
import { getTier } from '../utils/gamification';

const TIER_ICONS = {
  none: Shield,
  bronze: Award,
  silver: Medal,
  gold: Trophy,
  platinum: Crown,
  diamond: Gem,
};

const SIZE_PRESETS = {
  sm: { iconSize: 12, padding: '0.2rem 0.55rem', fontSize: '0.65rem', radius: '999px' },
  md: { iconSize: 14, padding: '0.32rem 0.75rem', fontSize: '0.75rem', radius: '999px' },
  lg: { iconSize: 28, padding: '0.85rem 1.5rem', fontSize: '1.05rem', radius: '14px' },
};

const Badge = ({ tier = 'none', size = 'md', showLabel = true, dim = false, style = {} }) => {
  const meta = getTier(tier);
  const Icon = TIER_ICONS[tier] || Shield;
  const preset = SIZE_PRESETS[size] || SIZE_PRESETS.md;
  const isNone = tier === 'none' || !tier;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'lg' ? '0.6rem' : '0.4rem',
        padding: preset.padding,
        borderRadius: preset.radius,
        background: isNone ? 'rgba(148,163,184,0.08)' : `${meta.color}20`,
        border: `1px solid ${isNone ? 'rgba(148,163,184,0.25)' : meta.color}55`,
        color: isNone ? 'var(--text-muted)' : meta.color,
        fontSize: preset.fontSize,
        fontWeight: '700',
        textTransform: 'capitalize',
        letterSpacing: '0.03em',
        opacity: dim ? 0.4 : 1,
        whiteSpace: 'nowrap',
        ...style,
      }}
      title={isNone ? 'No badge yet' : `${meta.label} tier`}
    >
      <Icon size={preset.iconSize} />
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
};

export default Badge;
