import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { AutomationService } from '../../core/automations/automation.service.js';
import { createAutomationSchema } from '../../shared/schemas/automation.schema.js';
import { apiError, apiSuccess } from '../../shared/utils/response.js';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const orgId = event.headers['x-organization-id'] || event.queryStringParameters?.organizationId;
    if (!orgId) {
      return apiError('organizationId is required', 400);
    }

    const body = JSON.parse(event.body || '{}');
    const validated = createAutomationSchema.parse(body);

    const created = await AutomationService.create(orgId, validated);
    return apiSuccess({ data: created }, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return apiError(err.errors[0]?.message || 'Validation error', 400);
    }
    return apiError(err.message, err.statusCode || 500, err.code);
  }
};
