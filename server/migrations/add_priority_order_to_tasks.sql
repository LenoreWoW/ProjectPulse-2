-- Add priority_order column to the tasks table for Kanban board ordering
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority_order INTEGER; 