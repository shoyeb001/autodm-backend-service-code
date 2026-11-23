import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { OAuthService } from '../../core/instagram/oauth.service.js';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const redirectUri = event.queryStringParameters?.redirectUri || 'https://api.yourdomain.com/api/v1/instagram/oauth/callback';
  const url = OAuthService.getAuthorizationUrl(redirectUri);

  return {
    statusCode: 302,
    headers: {
      Location: url,
    },
  };
};
