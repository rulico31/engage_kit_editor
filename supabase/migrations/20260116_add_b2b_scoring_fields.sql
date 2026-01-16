-- Add B2B Scoring fields to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS maturity_rank TEXT DEFAULT 'Cold';

-- Add index for sorting by score (Hot Leads)
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads (score DESC);
