import { neon } from '@netlify/neon';

function getPasswordFromHeaders(headers) {
  const auth = headers.authorization || headers.Authorization;
  if (!auth) return null;
  if (auth.startsWith('Bearer ')) {
    return auth.substring(7);
  }
  return auth;
}

function verifyPassword(password) {
  const appPassword = process.env.APP_PASSWORD || '1234';
  return password === appPassword;
}

export default async (req, context) => {
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return Response.json({
      success: false,
      error: 'Method not allowed'
    }, { status: 405 });
  }

  // Check authentication
  const password = getPasswordFromHeaders(req.headers || {});
  if (!password || !verifyPassword(password)) {
    return Response.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const sql = neon();
    const { id } = await req.json();

    if (!id) {
      return Response.json({
        success: false,
        error: 'Missing client id'
      }, { status: 400 });
    }

    // Delete the client
    const result = await sql`
      DELETE FROM clients
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return Response.json({
        success: false,
        error: 'Client not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: { id: result[0].id }
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
};

export const config = {
  path: "/api/clients/delete"
};
