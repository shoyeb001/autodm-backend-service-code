import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { apiSuccess } from '../../shared/utils/response.js';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  // In production, parse cookie / Authorization header & verify session in Neon DB
  const authHeader = event.headers.authorization;
  return apiSuccess({
    authenticated: Boolean(authHeader),
    user: authHeader ? { id: 'usr_mock_1', email: 'user@example.com' } : null,
  });
};
