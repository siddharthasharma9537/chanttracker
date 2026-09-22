-- Idempotency ledger for write actions called through the SoHum/Vani
-- API contract (see docs/SOHUM_VANI_CONTRACT.md in the workspace root).
-- A confirm call is retried (network blip, duplicate tap) with the same
-- idempotency_key must not double-log a chant session; this table lets
-- the edge function check-and-record atomically via the unique constraint
-- rather than trusting client-side dedup.

CREATE TABLE vani_action_confirmations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_name     text NOT NULL,
  idempotency_key text NOT NULL,
  result          jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, action_name, idempotency_key)
);

ALTER TABLE vani_action_confirmations ENABLE ROW LEVEL SECURITY;

-- Written and read only by the edge function (service role), never
-- directly by client code.
CREATE POLICY vani_action_confirmations_service_only ON vani_action_confirmations
  FOR ALL USING (false) WITH CHECK (false);
