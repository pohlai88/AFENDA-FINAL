-- Migration: Tenancy Invitations
-- Phase 3, Step 3.1: Email-based member invitations with expiry and acceptance flow
-- Enables: Invite users by email, track pending invitations, automatic membership creation on accept

CREATE TABLE IF NOT EXISTS tenancy_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Invitation details
  email TEXT NOT NULL,
  organization_id TEXT,
  team_id TEXT,
  role TEXT NOT NULL,  -- "owner", "admin", "member" for orgs; "lead", "member" for teams
  
  -- Token for acceptance
  token TEXT NOT NULL UNIQUE,
  
  -- Invitation metadata
  invited_by TEXT NOT NULL,  -- User ID who sent the invitation
  message TEXT,              -- Optional personal message
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',  -- "pending", "accepted", "declined", "cancelled", "expired"
  accepted_by TEXT,  -- User ID who accepted (may differ from email if claimed)
  accepted_at TIMESTAMPTZ,
  
  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_invitation_organization FOREIGN KEY (organization_id) 
    REFERENCES tenancy_organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_invitation_team FOREIGN KEY (team_id) 
    REFERENCES tenancy_teams(id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT invitation_org_or_team_check 
    CHECK (
      (organization_id IS NOT NULL AND team_id IS NULL) OR 
      (organization_id IS NULL AND team_id IS NOT NULL)
    ),
  CONSTRAINT invitation_status_check 
    CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'expired'))
);

-- Unique constraint: One pending invitation per email+org/team combination
CREATE UNIQUE INDEX idx_tenancy_invitations_unique_pending 
  ON tenancy_invitations(email, organization_id, team_id) 
  WHERE status = 'pending';

-- Index for token lookups (acceptance flow)
CREATE INDEX idx_tenancy_invitations_token 
  ON tenancy_invitations(token) 
  WHERE status = 'pending';

-- Index for listing pending invitations by org/team
CREATE INDEX idx_tenancy_invitations_org_pending 
  ON tenancy_invitations(organization_id, created_at DESC) 
  WHERE organization_id IS NOT NULL AND status = 'pending';

CREATE INDEX idx_tenancy_invitations_team_pending 
  ON tenancy_invitations(team_id, created_at DESC) 
  WHERE team_id IS NOT NULL AND status = 'pending';

-- Index for finding invitations by email (for user claiming)
CREATE INDEX idx_tenancy_invitations_email 
  ON tenancy_invitations(email, status, created_at DESC);

-- Index for expiry cleanup job
CREATE INDEX idx_tenancy_invitations_expires_at 
  ON tenancy_invitations(expires_at) 
  WHERE status = 'pending';

-- Comments for documentation
COMMENT ON TABLE tenancy_invitations IS 'Email-based invitations for organizations and teams';
COMMENT ON COLUMN tenancy_invitations.token IS 'Unique token for acceptance URL (unguessable, single-use)';
COMMENT ON COLUMN tenancy_invitations.expires_at IS 'Expiration timestamp (typically 7 days from creation)';
COMMENT ON COLUMN tenancy_invitations.status IS 'Tracks invitation lifecycle: pending → accepted/declined/cancelled/expired';
