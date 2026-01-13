import { neon } from '@netlify/neon';

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return Response.json({}, { headers });
  }

  if (req.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405, headers }
    );
  }

  try {
    const { password } = await req.json();
    const appPassword = process.env.APP_PASSWORD || '1234';

    if (password === appPassword) {
      return Response.json(
        { success: true, token: password },
        { headers }
      );
    } else {
      return Response.json(
        { error: 'Invalid password' },
        { status: 401, headers }
      );
    }
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    );
  }
};

export const config = {
  path: "/api/login"
};
