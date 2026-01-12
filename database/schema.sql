-- CF Assessment Tracker Database Schema
-- Neon PostgreSQL Database

-- Main clients table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT,
  dob DATE,
  admit_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('child', 'pregnant')),
  caregiver TEXT,
  notes TEXT,
  linked_id TEXT,
  mchat_high_risk BOOLEAN DEFAULT FALSE,
  assessments JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_admit_date ON clients(admit_date);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_linked_id ON clients(linked_id);

-- Index for JSONB assessments (for querying completed assessments)
CREATE INDEX IF NOT EXISTS idx_clients_assessments ON clients USING GIN (assessments);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the function
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- View for clients with computed fields (optional, for reporting)
CREATE OR REPLACE VIEW clients_with_stats AS
SELECT 
  c.*,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) * 12 + 
  EXTRACT(MONTH FROM AGE(CURRENT_DATE, dob)) as current_age_months,
  EXTRACT(DAY FROM (CURRENT_DATE - admit_date)) as days_in_service,
  jsonb_object_keys(assessments) as completed_assessments_count
FROM clients c;

-- Insert initial data (optional - can be done via app)
-- You can remove this if you want to start fresh
COMMENT ON TABLE clients IS 'Child First assessment tracker - client records';
COMMENT ON COLUMN clients.assessments IS 'JSONB object storing all assessment completions with dates';
COMMENT ON COLUMN clients.linked_id IS 'References sibling cases (twins, etc)';
