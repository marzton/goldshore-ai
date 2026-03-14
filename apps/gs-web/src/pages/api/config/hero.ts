import type { APIRoute } from 'astro';
import { DEFAULT_HERO_VARIANT, normalizeHeroVariant } from '../../../components/hero/hero.config';

export const GET: APIRoute = async ({ locals }) => {
  const env = locals.runtime?.env as Env | undefined;
  const variant = normalizeHeroVariant(await env?.HERO_CONFIG_KV?.get('hero_variant'));

  return Response.json({ variant: variant ?? DEFAULT_HERO_VARIANT });
};
