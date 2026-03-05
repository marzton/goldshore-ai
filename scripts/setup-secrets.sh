#!/usr/bin/env bash

echo "Setting up production secrets for workers..."
# In a real environment with a valid token, this would run:
# wrangler secret put SESSION_SECRET --env prod
# wrangler secret put JWTHS256KEY --env prod
# wrangler secret put HMAC_SECRET --env prod
# wrangler secret put STRIPE_WEBHOOK_SECRET --env prod
# wrangler secret put GH_WEBHOOK_SECRET --env prod

# But for demonstration and local tracking, we'll document what is needed
echo "Run the following with a valid CLOUDFLARE_API_TOKEN:"
echo "wrangler secret put SESSION_SECRET"
echo "wrangler secret put JWTHS256KEY"
echo "wrangler secret put HMAC_SECRET"
echo "wrangler secret put STRIPE_WEBHOOK_SECRET"
echo "echo '040590!' | wrangler secret put GH_WEBHOOK_SECRET"
