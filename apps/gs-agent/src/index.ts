/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/templates') {
			return Response.json({
				service: 'gs-agent',
				description: 'Agent templates for HITL workflows, AI orchestration, and ops automation.',
				modules: [
					{
						name: 'operator-assist',
						purpose: 'Human-in-the-loop review queues for approvals, escalations, and audits.',
					},
					{
						name: 'ai-routing',
						purpose: 'Route prompts to Gemini, ChatGPT, Jules, or internal models.',
					},
					{
						name: 'market-intel',
						purpose: 'Fuse Alpaca, Thinkorswim, and internal signals for market operations.',
					},
				],
				nextSteps: [
					'Add durable objects for stateful agent sessions.',
					'Attach queue consumers for long-running tasks.',
					'Expose admin telemetry endpoints for observability.',
				],
			});
		}

		return new Response('Hello from the GoldShore Agent!');
	},

	// An example queue consumer.
	async queue(
		batch: MessageBatch<any>,
		env: Env,
		ctx: ExecutionContext,
	): Promise<void> {
		// For each message in the batch, log it to the console.
		for (const message of batch.messages) {
			console.log(`message ${message.id} processed`);
		}
	},
};
