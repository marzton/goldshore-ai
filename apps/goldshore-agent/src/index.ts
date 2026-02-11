// apps/goldshore-agent/src/index.ts

import { verifyCfAccessJwt, AccessUser } from '@goldshore/auth';

export interface Env {
  CF_TEAM_DOMAIN: string;
  CF_ACCESS_AUD: string;
  // Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
  // MY_QUEUE: Queue;
}

// A simple handler that can be wrapped for authentication
async function handleRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  user: AccessUser,
): Promise<Response> {
  // Now you can use the user object for authorization or logging
  console.log(`Request authenticated for user: ${user.email}`);

  // You could also check for specific roles (groups) here
  if (!user.groups.includes('system')) {
    return new Response('Forbidden: You are not a system user', {
      status: 403,
    });
  }

  return new Response(`Hello from the GoldShore Agent, ${user.email}!`);
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // Verify the JWT on every incoming request
    const user = await verifyCfAccessJwt(
      request,
      env.CF_TEAM_DOMAIN,
      env.CF_ACCESS_AUD,
    );

    if (!user) {
      return new Response('Unauthorized: Invalid or missing token', {
        status: 401,
      });
    }

    // If the user is authenticated, proceed to the main handler
    return handleRequest(request, env, ctx, user);
  },

  // An example queue consumer.
  // Note: Messages sent from one Worker to another via a Queue do not
  // automatically carry over the authentication context. You may need a
  // different security model for queue messages, such as a shared secret.
  // async queue(
  // 	batch: MessageBatch<Error>,
  // 	env: Env,
  // 	ctx: ExecutionContext,
  // ): Promise<void> {
  // 	// For each message in the batch, log it to the console.
  // 	for (const message of batch.messages) {
  // 		console.log(`message ${message.id} processed`);
  // 	}
  // },
};
