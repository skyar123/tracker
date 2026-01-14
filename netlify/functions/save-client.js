import { neon } from '@netlify/neon';

export default async (req, context) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return Response.json({
      success: false,
      error: 'Method not allowed'
    }, { status: 405 });
  }

  try {
    const sql = neon();
    const client = await req.json();

    // Validate required fields
    if (!client.id || !client.name || !client.admitDate || !client.type) {
      return Response.json({
        success: false,
        error: 'Missing required fields: id, name, admitDate, type'
      }, { status: 400 });
    }

    // Upsert client (insert or update)
    const result = await sql`
      INSERT INTO clients (
        id, 
        name, 
        nickname, 
        dob, 
        admit_date, 
        type, 
        caregiver, 
        notes, 
        linked_id, 
        mchat_high_risk,
        assessments
      )
      VALUES (
        ${client.id},
        ${client.name},
        ${client.nickname || null},
        ${client.dob || null},
        ${client.admitDate},
        ${client.type},
        ${client.caregiver || null},
        ${client.notes || null},
        ${client.linkedId || null},
        ${client.mchatHighRisk || false},
        ${JSON.stringify(client.assessments || {})}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        nickname = EXCLUDED.nickname,
        dob = EXCLUDED.dob,
        type = EXCLUDED.type,
        caregiver = EXCLUDED.caregiver,
        notes = EXCLUDED.notes,
        linked_id = EXCLUDED.linked_id,
        mchat_high_risk = EXCLUDED.mchat_high_risk,
        assessments = EXCLUDED.assessments,
        updated_at = NOW()
      RETURNING *
    `;

    return Response.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error saving client:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
};

export const config = {
  path: "/api/clients/save"
};
