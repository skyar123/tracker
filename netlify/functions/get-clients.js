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
    
    // Get all clients with their assessments
    const clients = await sql`
      SELECT 
        id,
        name,
        nickname,
        dob,
        admit_date as "admitDate",
        type,
        caregiver,
        notes,
        linked_id as "linkedId",
        mchat_high_risk as "mchatHighRisk",
        assessments,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM clients
      ORDER BY admit_date DESC
    `;

    return Response.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
};

export const config = {
  path: "/api/clients"
};
