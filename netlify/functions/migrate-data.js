import { neon } from '@netlify/neon';

// This function helps migrate data from localStorage backup to database
export default async (req, context) => {
  if (req.method !== 'POST') {
    return Response.json({
      success: false,
      error: 'Method not allowed'
    }, { status: 405 });
  }

  try {
    const sql = neon();
    const { clients } = await req.json();

    if (!Array.isArray(clients)) {
      return Response.json({
        success: false,
        error: 'Invalid data format. Expected array of clients'
      }, { status: 400 });
    }

    let imported = 0;
    let errors = [];

    // Import each client
    for (const client of clients) {
      try {
        await sql`
          INSERT INTO clients (
            id, name, nickname, dob, admit_date, type, caregiver, notes, 
            linked_id, mchat_high_risk, assessments
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
        `;
        imported++;
      } catch (err) {
        errors.push({ id: client.id, error: err.message });
      }
    }

    return Response.json({
      success: true,
      data: {
        imported,
        total: clients.length,
        errors: errors.length > 0 ? errors : null
      }
    });
  } catch (error) {
    console.error('Error migrating data:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
};

export const config = {
  path: "/api/migrate"
};
