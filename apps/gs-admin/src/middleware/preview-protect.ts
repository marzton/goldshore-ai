export function enforcePreviewAuth(request: Request) {
  const url = new URL(request.url);

  const isPreviewEnv = import.meta.env.PUBLIC_ENV === 'preview';
  const isPreviewHostname = url.hostname.startsWith('preview.');
  const isPreview = isPreviewEnv || isPreviewHostname;

  if (!isPreview) return;

  const auth = request.headers.get("Authorization");

  if (!auth || auth !== `Bearer ${import.meta.env.PREVIEW_TOKEN}`) {
    return new Response("Unauthorized", { status: 401 });
  }
}
