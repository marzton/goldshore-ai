export type HeroVariant = 'orbital' | 'defense' | 'minimal' | 'canonical';

export const HERO_VARIANTS: Record<HeroVariant, { label: string; description: string }> = {
  canonical: {
    label: 'Canonical Direction',
    description: 'The "Shaping Waves" authoritative design direction.',
  },
  orbital: {
    label: 'Orbital Control',
    description: 'Deep-space institutional hero with CSS particle field.',
  },
  defense: {
    label: 'Defense Lab',
    description: 'Black + silicon orange signal aesthetic.',
  },
  minimal: {
    label: 'Minimal Authority',
    description: 'Typography-first, no background motion.',
  },
};

export const DEFAULT_HERO_VARIANT: HeroVariant = 'canonical';

export const normalizeHeroVariant = (value: string | null | undefined): HeroVariant => {
  if (value && value in HERO_VARIANTS) {
    return value as HeroVariant;
  }

  return DEFAULT_HERO_VARIANT;
};
