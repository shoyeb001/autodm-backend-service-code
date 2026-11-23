import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const query = event.queryStringParameters || {};
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'autodm_verify_token';

  if (mode === 'subscribe' && token === expectedToken) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: challenge || '',
    };
  }

  return {
    statusCode: 403,
    body: 'Verification token mismatch',
  };
};
