export class OAuthService {
  static getAuthorizationUrl(redirectUri: string): string {
    const appId = process.env.META_APP_ID || '';
    const scope = ['instagram_business_basic', 'instagram_business_manage_messages', 'instagram_business_manage_comments'].join(',');
    return `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(scope)}`;
  }

  static async exchangeCodeForToken(code: string, redirectUri: string) {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    const formData = new URLSearchParams();
    formData.append('client_id', appId || '');
    formData.append('client_secret', appSecret || '');
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', redirectUri);
    formData.append('code', code);

    const res = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`OAuth token exchange failed: ${await res.text()}`);
    }

    return res.json();
  }
}
