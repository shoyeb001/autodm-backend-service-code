import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { AutomationService } from '../../core/automations/automation.service.js';
import { apiError, apiSuccess } from '../../shared/utils/response.js';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const orgId = event.headers['x-organization-id'] || event.queryStringParameters?.organizationId;
    const automationId = event.pathParameters?.id;

    if (!orgId || !automationId) {
      return apiError('Missing orgId or automationId', 400);
    }

    const deleted = await AutomationService.delete(orgId, automationId);
    return apiSuccess({ data: deleted });
  } catch (err: any) {
    return apiError(err.message, 500);
  }
};
