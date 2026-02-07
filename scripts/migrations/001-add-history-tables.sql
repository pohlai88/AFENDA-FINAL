-- Orchestra Kernel - Database Migration 001
-- Add history tracking tables for config, health, and backup scheduling
-- Required for: Phase 1.3, Phase 3.1, Phase 3.3
-- Run date: 2026-02-06

-- =============================================================================
-- 1. CONFIG HISTORY TABLE
-- =============================================================================
-- Purpose: Track all configuration changes for diff viewer and audit trail
-- Dependencies: orchestra_admin_config (parent table)

CREATE TABLE IF NOT EXISTS orchestra_config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key to parent config (cascade delete)
  CONSTRAINT fk_config_history_key 
    FOREIGN KEY (config_key) 
    REFERENCES orchestra_admin_config(key) 
    ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS orchestra_config_history_key_idx 
  ON orchestra_config_history(config_key);

CREATE INDEX IF NOT EXISTS orchestra_config_history_changed_at_idx 
  ON orchestra_config_history(changed_at DESC);

CREATE INDEX IF NOT EXISTS orchestra_config_history_changed_by_idx 
  ON orchestra_config_history(changed_by);

-- Comments
COMMENT ON TABLE orchestra_config_history IS 'Tracks all configuration changes for audit and diff viewing';
COMMENT ON COLUMN orchestra_config_history.config_key IS 'References orchestra_admin_config.key';
COMMENT ON COLUMN orchestra_config_history.old_value IS 'Previous configuration value (NULL for new configs)';
COMMENT ON COLUMN orchestra_config_history.new_value IS 'New configuration value (NULL for deletions)';
COMMENT ON COLUMN orchestra_config_history.changed_by IS 'User ID who made the change (NULL for system)';

-- =============================================================================
-- 2. HEALTH HISTORY TABLE
-- =============================================================================
-- Purpose: Store time-series health check data for timeline and uptime calculations
-- Dependencies: orchestra_service_registry (parent table)

CREATE TABLE IF NOT EXISTS orchestra_health_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  latency_ms INTEGER,
  error_message TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key to service registry (cascade delete)
  CONSTRAINT fk_health_history_service 
    FOREIGN KEY (service_id) 
    REFERENCES orchestra_service_registry(id) 
    ON DELETE CASCADE
);

-- Indexes for performance (critical for timeline queries)
CREATE INDEX IF NOT EXISTS orchestra_health_history_service_idx 
  ON orchestra_health_history(service_id);

CREATE INDEX IF NOT EXISTS orchestra_health_history_recorded_idx 
  ON orchestra_health_history(recorded_at DESC);

CREATE INDEX IF NOT EXISTS orchestra_health_history_status_idx 
  ON orchestra_health_history(status);

-- Composite index for common query pattern (service + time range)
CREATE INDEX IF NOT EXISTS orchestra_health_history_service_time_idx 
  ON orchestra_health_history(service_id, recorded_at DESC);

-- Comments
COMMENT ON TABLE orchestra_health_history IS 'Time-series health check data for monitoring and analytics';
COMMENT ON COLUMN orchestra_health_history.service_id IS 'References orchestra_service_registry.id';
COMMENT ON COLUMN orchestra_health_history.status IS 'Health status: healthy, degraded, or down';
COMMENT ON COLUMN orchestra_health_history.latency_ms IS 'Health check response time in milliseconds';
COMMENT ON COLUMN orchestra_health_history.error_message IS 'Error details if status is degraded or down';

-- =============================================================================
-- 3. BACKUP SCHEDULE TABLE
-- =============================================================================
-- Purpose: Store automated backup schedules with cron expressions
-- Dependencies: None (standalone table)

CREATE TABLE IF NOT EXISTS orchestra_backup_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  backup_type TEXT NOT NULL DEFAULT 'full' CHECK (backup_type IN ('full', 'incremental', 'differential')),
  retention_days INTEGER NOT NULL DEFAULT 30 CHECK (retention_days > 0),
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS orchestra_backup_schedule_enabled_idx 
  ON orchestra_backup_schedule(enabled) 
  WHERE enabled = true;

CREATE INDEX IF NOT EXISTS orchestra_backup_schedule_next_run_idx 
  ON orchestra_backup_schedule(next_run) 
  WHERE enabled = true AND next_run IS NOT NULL;

CREATE INDEX IF NOT EXISTS orchestra_backup_schedule_created_by_idx 
  ON orchestra_backup_schedule(created_by);

-- Comments
COMMENT ON TABLE orchestra_backup_schedule IS 'Automated backup schedules with cron expressions';
COMMENT ON COLUMN orchestra_backup_schedule.name IS 'Human-readable schedule name';
COMMENT ON COLUMN orchestra_backup_schedule.cron_expression IS 'Cron expression for schedule (e.g., "0 2 * * *" for daily at 2am)';
COMMENT ON COLUMN orchestra_backup_schedule.enabled IS 'Whether this schedule is active';
COMMENT ON COLUMN orchestra_backup_schedule.backup_type IS 'Type of backup: full, incremental, or differential';
COMMENT ON COLUMN orchestra_backup_schedule.retention_days IS 'Number of days to retain backups';
COMMENT ON COLUMN orchestra_backup_schedule.last_run IS 'Timestamp of last successful backup';
COMMENT ON COLUMN orchestra_backup_schedule.next_run IS 'Calculated next run time based on cron expression';
COMMENT ON COLUMN orchestra_backup_schedule.created_by IS 'User ID who created the schedule';

-- =============================================================================
-- 4. TRIGGER: Auto-update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_backup_schedule_updated_at
  BEFORE UPDATE ON orchestra_backup_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 5. VERIFICATION QUERIES
-- =============================================================================

-- Verify all tables were created
DO $$
DECLARE
  missing_tables TEXT[];
BEGIN
  SELECT ARRAY_AGG(table_name)
  INTO missing_tables
  FROM (
    VALUES 
      ('orchestra_config_history'),
      ('orchestra_health_history'),
      ('orchestra_backup_schedule')
  ) AS expected(table_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = expected.table_name
  );
  
  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Migration failed: Missing tables: %', missing_tables;
  ELSE
    RAISE NOTICE 'Migration successful: All 3 tables created';
  END IF;
END $$;

-- =============================================================================
-- 6. ROLLBACK SCRIPT (for reference)
-- =============================================================================

-- To rollback this migration, run:
-- DROP TABLE IF EXISTS orchestra_config_history CASCADE;
-- DROP TABLE IF EXISTS orchestra_health_history CASCADE;
-- DROP TABLE IF EXISTS orchestra_backup_schedule CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
