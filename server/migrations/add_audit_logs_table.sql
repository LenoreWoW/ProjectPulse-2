-- Add audit logs table to track system activities
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  userId INTEGER,
  action VARCHAR(255) NOT NULL,
  entityType VARCHAR(50) NOT NULL,
  entityId INTEGER,
  details JSONB,
  ipAddress VARCHAR(45),
  userAgent VARCHAR(255),
  departmentId INTEGER,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(userId);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entityType, entityId);
CREATE INDEX IF NOT EXISTS idx_audit_logs_department ON audit_logs(departmentId);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(createdAt);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Tracks all significant actions performed by users in the system';
COMMENT ON COLUMN audit_logs.userId IS 'User who performed the action';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (create, update, delete, login, etc.)';
COMMENT ON COLUMN audit_logs.entityType IS 'Type of entity affected (project, task, user, etc.)';
COMMENT ON COLUMN audit_logs.entityId IS 'ID of the affected entity';
COMMENT ON COLUMN audit_logs.details IS 'JSON data containing details about the action, including before/after values for updates';
COMMENT ON COLUMN audit_logs.ipAddress IS 'IP address of the user who performed the action';
COMMENT ON COLUMN audit_logs.userAgent IS 'Browser/client information';
COMMENT ON COLUMN audit_logs.departmentId IS 'Department ID associated with the entity or action'; 