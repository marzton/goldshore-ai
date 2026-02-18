export default {
  async fetch(): Promise<Response> {
    return new Response('gs-mail worker is running', {
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    });
  }
};
