import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { OAuthService } from '../../core/instagram/oauth.service.js';
import { apiError, apiSuccess } from '../../shared/utils/response.js';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const code = event.queryStringParameters?.code;
  if (!code) {
    return apiError('Missing OAuth code', 400);
  }

  try {
    const redirectUri = 'https://api.yourdomain.com/api/v1/instagram/oauth/callback';
    const tokenData = await OAuthService.exchangeCodeForToken(code, redirectUri);

    // Save tokenData in instagramAccounts table
    return apiSuccess({ success: true, data: tokenData });
  } catch (err: any) {
    return apiError(err.message, 500);
  }
};
