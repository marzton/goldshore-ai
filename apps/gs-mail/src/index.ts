export default {
  async fetch(request: Request, env: Record<string, unknown>): Promise<Response> {
    return new Response("gs-mail OK", { status: 200 });
  },
};
