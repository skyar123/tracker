import { neon } from '@netlify/neon';

export default async (req, context) => {
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
