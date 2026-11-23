import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { AutomationService } from '../../core/automations/automation.service.js';
import { apiError, apiSuccess } from '../../shared/utils/response.js';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    // In production, orgId comes from verified JWT/session
    const orgId = event.headers['x-organization-id'] || event.queryStringParameters?.organizationId;
    if (!orgId) {
      return apiError('organizationId is required', 400);
    }

    const items = await AutomationService.listByOrg(orgId);
    return apiSuccess({ data: items });
  } catch (err: any) {
    return apiError(err.message, 500);
  }
};
