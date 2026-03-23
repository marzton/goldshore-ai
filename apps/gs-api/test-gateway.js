import { generateResponse } from './src/generateResponse.js';
import { loadGatewayEnv } from './src/loadEnv.js';

loadGatewayEnv({ cwd: process.cwd() });

function isMissingGatewayConfigError(error, message) {
  // Prefer structured identifiers when available, fall back to message substring.
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  const name = typeof error === 'object' && error !== null && 'name' in error ? error.name : undefined;

  if (code === 'MISSING_AI_GATEWAY_CONFIG' || name === 'MissingAIGatewayConfigError') {
    return true;
  }

  return typeof message === 'string' &&
    message.includes('Missing AI Gateway configuration');
}

async function main() {
  const result = await generateResponse('Hello world');

  console.info('✅ Gateway response:', result.text);
  console.info('✅ x-cf-ai-gateway-id:', result.gatewayId ?? 'header not present');
}

main().catch((error) => {
  const message = typeof error?.message === 'string' ? error.message : '';
  if (isMissingGatewayConfigError(error, message)) {
    console.error(
      'Gateway test failed: missing CF_GATEWAY_URL/CF_AIG_TOKEN. Copy apps/gs-api/.env.example to apps/gs-api/.env and set real values.',
    );
    process.exitCode = 1;
    return;
  }

  console.error('Gateway test failed:', error);
  process.exitCode = 1;
});
