import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { WebhookService } from '../../core/webhooks/webhook.service.js';
import { apiError, apiSuccess } from '../../shared/utils/response.js';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const rawBody = event.body || '{}';
  const signature = event.headers['x-hub-signature-256'] || event.headers['X-Hub-Signature-256'];

  // 1. Verify Meta Signature
  const isValid = WebhookService.verifySignature(rawBody, signature);
  if (!isValid) {
    return apiError('Invalid webhook signature', 401, 'INVALID_SIGNATURE');
  }

  // 2. Parse payload
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return apiError('Invalid JSON payload', 400, 'INVALID_JSON');
  }

  // 3. Ingest and enqueue to SQS
  await WebhookService.ingestWebhook(payload);

  // Return 200 OK immediately so Meta does not retry
  return apiSuccess({ status: 'EVENT_RECEIVED' });
};
