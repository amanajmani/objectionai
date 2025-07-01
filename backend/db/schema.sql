-- ObjectionAI Database Schema - Complete (Parts 1 + 2)
-- Run this in your Supabase SQL Editor
-- This includes all tables from Part 1 + Part 2 evidence file upload functionality

-- Note: evidence_files table is separate from existing evidence table
-- The existing evidence table is used for web scraping evidence
-- The evidence_files table is used for file uploads

-- Drop existing tables if they have wrong column names (only if recreating)
-- DROP TABLE IF EXISTS evidence_files CASCADE;
-- DROP TABLE IF EXISTS documents CASCADE;
-- DROP TABLE IF EXISTS cases CASCADE; 
-- DROP TABLE IF EXISTS ip_assets CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- IP Assets table
CREATE TABLE IF NOT EXISTS ip_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trademark', 'copyright', 'patent', 'trade_secret', 'other')),
  description TEXT,
  registration_number TEXT,
  jurisdiction TEXT,
  tags TEXT[],
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cases table
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved')),
  related_ip_asset_id UUID REFERENCES ip_assets(id) ON DELETE CASCADE,
  suspected_url TEXT,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  type TEXT DEFAULT 'cease_desist' CHECK (type IN ('dmca', 'cease_desist', 'custom')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'finalized', 'sent', 'archived')),
  version INTEGER DEFAULT 1,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evidence Files table for file uploads and chain-of-custody
-- This is separate from the existing 'evidence' table which is used for web scraping
CREATE TABLE IF NOT EXISTS evidence_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  hash TEXT NOT NULL,
  title TEXT,
  description TEXT,
  tags TEXT[],
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE ip_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_logs ENABLE ROW LEVEL SECURITY;

-- IP Assets policies
CREATE POLICY "Users can view their own IP assets" ON ip_assets
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own IP assets" ON ip_assets
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own IP assets" ON ip_assets
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own IP assets" ON ip_assets
  FOR DELETE USING (auth.uid() = owner_id);

-- Cases policies
CREATE POLICY "Users can view their own cases" ON cases
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own cases" ON cases
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own cases" ON cases
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own cases" ON cases
  FOR DELETE USING (auth.uid() = created_by);

-- Documents policies
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (auth.uid() = user_id);

-- Evidence Files policies
CREATE POLICY "Users can view evidence files for their own cases" ON evidence_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id = evidence_files.case_id 
      AND cases.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert evidence files for their own cases" ON evidence_files
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id = evidence_files.case_id 
      AND cases.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update evidence files for their own cases" ON evidence_files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id = evidence_files.case_id 
      AND cases.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete evidence files for their own cases" ON evidence_files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id = evidence_files.case_id 
      AND cases.created_by = auth.uid()
    )
  );

-- User Roles policies
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Monitoring Jobs policies (role-based access)
CREATE POLICY "Users can view monitoring jobs based on role" ON monitoring_jobs
  FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'reviewer')
    )
  );

CREATE POLICY "Users can create monitoring jobs" ON monitoring_jobs
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'submitter')
    )
  );

CREATE POLICY "Admins can update monitoring jobs" ON monitoring_jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Monitoring Logs policies
CREATE POLICY "Users can view monitoring logs based on job access" ON monitoring_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM monitoring_jobs mj 
      WHERE mj.id = monitoring_logs.job_id 
      AND (
        mj.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() 
          AND ur.role IN ('admin', 'reviewer')
        )
      )
    )
  );

CREATE POLICY "System can insert monitoring logs" ON monitoring_logs
  FOR INSERT WITH CHECK (true); -- Allow system to insert logs

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ip_assets_owner ON ip_assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_ip_assets_type ON ip_assets(type);
CREATE INDEX IF NOT EXISTS idx_cases_created_by ON cases(created_by);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_ip_asset ON cases(related_ip_asset_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_case ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_evidence_files_case ON evidence_files(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_files_uploaded_by ON evidence_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_evidence_files_uploaded_at ON evidence_files(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_monitoring_jobs_created_by ON monitoring_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_monitoring_jobs_status ON monitoring_jobs(job_status);
CREATE INDEX IF NOT EXISTS idx_monitoring_jobs_ip_asset ON monitoring_jobs(ip_asset_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_job_id ON monitoring_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_created_at ON monitoring_logs(created_at);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_ip_assets_updated_at BEFORE UPDATE ON ip_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evidence_files_updated_at BEFORE UPDATE ON evidence_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitoring_jobs_updated_at BEFORE UPDATE ON monitoring_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User Roles table for RBAC (Part 3)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'reviewer', 'submitter')) DEFAULT 'submitter',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monitoring Jobs table (Part 3)
CREATE TABLE IF NOT EXISTS monitoring_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  job_status TEXT DEFAULT 'pending' CHECK (job_status IN ('pending', 'running', 'completed', 'failed')),
  ip_asset_id UUID REFERENCES ip_assets(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Monitoring Logs table (Part 3)
CREATE TABLE IF NOT EXISTS monitoring_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES monitoring_jobs(id) ON DELETE CASCADE,
  result TEXT,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  screenshot_url TEXT,
  html_content TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);