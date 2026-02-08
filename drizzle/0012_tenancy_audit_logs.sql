-- Migration: Audit Logs for Governance
-- Phase 2, Step 2.4: Track critical tenant actions for compliance
-- Captures: who did what, when, to which resource

CREATE TABLE IF NOT EXISTS tenancy_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor information
  actor_id TEXT NOT NULL,  -- User ID who performed the action
  actor_email TEXT,        -- Email at time of action (for audit trail)
  
  -- Action details
  action TEXT NOT NULL,    -- e.g., "organization.create", "membership.role_change", "team.delete"
  resource_type TEXT NOT NULL,  -- "organization", "team", "membership", "invitation"
  resource_id TEXT NOT NULL,    -- ID of the affected resource
  
  -- Context
  organization_id TEXT,    -- Associated org (if applicable)
  team_id TEXT,            -- Associated team (if applicable)
  
  -- Metadata
  metadata JSONB,          -- Additional context (e.g., { "old_role": "member", "new_role": "admin" })
  ip_address TEXT,         -- Request IP for security audits
  user_agent TEXT,         -- Browser/client info
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_audit_organization FOREIGN KEY (organization_id) 
    REFERENCES tenancy_organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_audit_team FOREIGN KEY (team_id) 
    REFERENCES tenancy_teams(id) ON DELETE CASCADE
);

-- Indexes for common query patterns
CREATE INDEX idx_audit_logs_actor 
  ON tenancy_audit_logs(actor_id, created_at DESC);

CREATE INDEX idx_audit_logs_resource 
  ON tenancy_audit_logs(resource_type, resource_id, created_at DESC);

CREATE INDEX idx_audit_logs_organization 
  ON tenancy_audit_logs(organization_id, created_at DESC) 
  WHERE organization_id IS NOT NULL;

CREATE INDEX idx_audit_logs_team 
  ON tenancy_audit_logs(team_id, created_at DESC) 
  WHERE team_id IS NOT NULL;

CREATE INDEX idx_audit_logs_action 
  ON tenancy_audit_logs(action, created_at DESC);

-- Composite index for org-scoped audit log queries
CREATE INDEX idx_audit_logs_org_resource 
  ON tenancy_audit_logs(organization_id, resource_type, created_at DESC) 
  WHERE organization_id IS NOT NULL;

-- Comment on table
COMMENT ON TABLE tenancy_audit_logs IS 'Audit trail for governance-critical actions in multi-tenant system';
COMMENT ON COLUMN tenancy_audit_logs.action IS 'Dot-notation action format: resource.operation (e.g., organization.update)';
COMMENT ON COLUMN tenancy_audit_logs.metadata IS 'Flexible storage for action-specific details (old values, new values, etc.)';
