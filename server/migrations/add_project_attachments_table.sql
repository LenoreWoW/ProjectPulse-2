-- Add project attachments table for file uploads
CREATE TABLE IF NOT EXISTS project_attachments (
  id SERIAL PRIMARY KEY,
  projectid INTEGER NOT NULL,
  uploadeduserid INTEGER NOT NULL,
  filename VARCHAR(255) NOT NULL,
  originalname VARCHAR(255) NOT NULL,
  filesize INTEGER NOT NULL,
  filetype VARCHAR(100) NOT NULL,
  filepath TEXT NOT NULL,
  filecategory VARCHAR(50) DEFAULT 'general',
  description TEXT,
  isprojectplan BOOLEAN DEFAULT FALSE,
  createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projectid) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadeduserid) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_attachments_project ON project_attachments(projectid);
CREATE INDEX IF NOT EXISTS idx_project_attachments_user ON project_attachments(uploadeduserid);
CREATE INDEX IF NOT EXISTS idx_project_attachments_category ON project_attachments(filecategory);
CREATE INDEX IF NOT EXISTS idx_project_attachments_plan ON project_attachments(isprojectplan);

-- Add comments for documentation
COMMENT ON TABLE project_attachments IS 'Stores file attachments for projects including project plans and general documents';
COMMENT ON COLUMN project_attachments.projectid IS 'Reference to the project this attachment belongs to';
COMMENT ON COLUMN project_attachments.uploadeduserid IS 'User who uploaded the file';
COMMENT ON COLUMN project_attachments.filename IS 'Unique filename stored on server';
COMMENT ON COLUMN project_attachments.originalname IS 'Original filename when uploaded';
COMMENT ON COLUMN project_attachments.filesize IS 'File size in bytes';
COMMENT ON COLUMN project_attachments.filetype IS 'MIME type of the file';
COMMENT ON COLUMN project_attachments.filepath IS 'Full path to the file on server';
COMMENT ON COLUMN project_attachments.filecategory IS 'Category of the file (plan, general, document, etc.)';
COMMENT ON COLUMN project_attachments.description IS 'Optional description of the file';
COMMENT ON COLUMN project_attachments.isprojectplan IS 'Whether this file is designated as the project plan'; 