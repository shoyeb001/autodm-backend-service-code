export function apiResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

export function apiSuccess(data: unknown, statusCode = 200) {
  return apiResponse(statusCode, data);
}

export function apiError(message: string, statusCode = 400, code = 'BAD_REQUEST') {
  return apiResponse(statusCode, { error: { message, code } });
}
