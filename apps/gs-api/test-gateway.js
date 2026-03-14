import { generateResponse } from './src/generateResponse.js';

async function main() {
  const result = await generateResponse('Hello world');

  console.log('Gateway response:', result.text);
  console.log('x-cf-ai-gateway-id:', result.gatewayId ?? 'header not present');
}

main().catch((error) => {
  console.error('Gateway test failed:', error);
  process.exitCode = 1;
});
