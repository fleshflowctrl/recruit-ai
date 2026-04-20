-- Flow builder: geautomatiseerde stappen per bureau
CREATE TABLE IF NOT EXISTS automatisering_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bureau_id UUID NOT NULL REFERENCES bureaus(id) ON DELETE CASCADE,
  flow JSONB NOT NULL DEFAULT '[]',
  settings JSONB NOT NULL DEFAULT '{}',
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW(),
  bijgewerkt_op TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bureau_id)
);

CREATE INDEX IF NOT EXISTS idx_automatisering_flows_bureau ON automatisering_flows(bureau_id);

ALTER TABLE automatisering_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY automatisering_flows_all ON automatisering_flows FOR ALL
  USING (bureau_id = public.current_user_bureau_id())
  WITH CHECK (bureau_id = public.current_user_bureau_id());
