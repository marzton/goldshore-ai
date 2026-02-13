import type { MiddlewareHandler } from 'astro';

export const withGoldshoreHeaders: MiddlewareHandler = async (_context, next) => {
  const response = await next();
  response.headers.set('x-goldshore-repo', 'goldshore-ai');
  return response;
};
