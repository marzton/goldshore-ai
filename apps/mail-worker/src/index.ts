import { EmailMessage } from "cloudflare:email";

export interface Env {
  // Add environment bindings here (KV, etc.)
}

export default {
  async email(message: EmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    // Basic email handler scaffolding
    console.log(`Received email from ${message.from} to ${message.to}`);

    // Example: Forwarding (commented out until configured)
    // await message.forward("dest@example.com");

    // Example: Rejecting
    // message.setReject("Not implemented yet");
  }
};
