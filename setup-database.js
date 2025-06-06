import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mdfbxcaqxpmdvfqsvagi.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupDatabase() {
  console.log('Setting up database tables...');

  try {
    // Create profiles table
    const { error: profilesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          avatar_url TEXT,
          display_name TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (profilesError) {
      console.log('Profiles table might already exist or using direct SQL...');
    }

    // Create templates table
    const { error: templatesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER,
          placeholders JSONB,
          use_count INTEGER DEFAULT 0,
          upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (templatesError) {
      console.log('Templates table might already exist or using direct SQL...');
    }

    // Create generated_pdfs table
    const { error: pdfsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.generated_pdfs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          template_id UUID NOT NULL,
          name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER,
          placeholder_data JSONB,
          generated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE CASCADE
        );
      `
    });

    if (pdfsError) {
      console.log('Generated PDFs table might already exist or using direct SQL...');
    }

    // Create activity_logs table
    const { error: logsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.activity_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          action TEXT NOT NULL,
          resource_type TEXT,
          resource_id TEXT,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (logsError) {
      console.log('Activity logs table might already exist or using direct SQL...');
    }

    // Try alternative approach: Direct table creation using Supabase client
    console.log('Attempting direct table creation...');
    
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('Cannot check existing tables, attempting to create...');
    } else {
      console.log('Existing tables:', tables?.map(t => t.table_name));
    }

    // Test if we can query the templates table
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .limit(1);

    if (error) {
      console.log('Templates table does not exist or has issues:', error.message);
      console.log('Please create the tables manually in your Supabase dashboard.');
      console.log('SQL to run in Supabase SQL Editor:');
      console.log(`
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_url TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  placeholders JSONB,
  use_count INTEGER DEFAULT 0,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated_pdfs table
CREATE TABLE IF NOT EXISTS public.generated_pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  placeholder_data JSONB,
  generated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE CASCADE
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own templates" ON public.templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON public.templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.templates
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own generated PDFs" ON public.generated_pdfs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generated PDFs" ON public.generated_pdfs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own generated PDFs" ON public.generated_pdfs
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activity logs" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
      `);
    } else {
      console.log('✅ Templates table exists and is accessible!');
    }

    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase();