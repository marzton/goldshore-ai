import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.toLowerCase() || '';

  if (!q) return new Response(JSON.stringify([]));

  const docs = await getCollection('docs');
  const results = docs
    .filter((doc) => doc.data.title.toLowerCase().includes(q))
    .map((doc) => ({
      title: doc.data.title,
      url: `/developer/docs/${doc.slug}`,
    }))
    .slice(0, 5);

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
};
