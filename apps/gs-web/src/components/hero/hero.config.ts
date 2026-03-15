export type HeroVariant = 'orbital' | 'defense' | 'minimal' | 'canonical';

export const HERO_VARIANTS: Record<HeroVariant, { label: string; description: string }> = {
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
  canonical: {
    label: 'Shaping Waves Canonical',
    description: 'Canonical hero with cinematic terminal preview panel.',
  },
};

export const DEFAULT_HERO_VARIANT: HeroVariant = 'canonical';

export const normalizeHeroVariant = (value: string | null | undefined): HeroVariant => {
  if (value && value in HERO_VARIANTS) {
    return value as HeroVariant;
  }

  return DEFAULT_HERO_VARIANT;
};
