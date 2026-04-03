export default {
  async fetch(request: Request, env: Record<string, unknown>): Promise<Response> {
    return new Response("gs-control OK", { status: 200 });
  },
};
