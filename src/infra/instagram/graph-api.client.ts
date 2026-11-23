export interface SendDmParams {
  recipientId: string;
  message: string;
  accessToken: string;
}

export async function sendDirectMessage({ recipientId, message, accessToken }: SendDmParams) {
  const url = `https://graph.instagram.com/v25.0/me/messages?access_token=${encodeURIComponent(accessToken)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Meta Graph API error (${response.status}): ${errorText}`);
  }

  return response.json();
}
