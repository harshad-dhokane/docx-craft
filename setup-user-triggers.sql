-- SQL to run in Supabase SQL Editor for proper user management

-- Enable email confirmations
UPDATE auth.config SET value = 'true' WHERE parameter = 'enable_confirmations';

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  
  -- Log the user signup activity
  INSERT INTO public.activity_logs (user_id, action, resource_type, resource_id, metadata, created_at)
  VALUES (
    NEW.id,
    'user_signup',
    'auth',
    NEW.id,
    jsonb_build_object(
      'email', NEW.email,
      'signup_time', NOW(),
      'confirmed_at', NEW.confirmed_at
    ),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to handle user updates (email confirmation)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile when user data changes
  UPDATE public.profiles 
  SET 
    display_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    avatar_url = NEW.raw_user_meta_data->>'avatar_url',
    updated_at = NOW()
  WHERE id = NEW.id;
  
  -- Log email confirmation
  IF OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL THEN
    INSERT INTO public.activity_logs (user_id, action, resource_type, resource_id, metadata, created_at)
    VALUES (
      NEW.id,
      'email_confirmed',
      'auth',
      NEW.id,
      jsonb_build_object(
        'email', NEW.email,
        'confirmed_at', NEW.confirmed_at
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Update RLS policies to ensure proper data isolation
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Ensure templates are isolated per user
DROP POLICY IF EXISTS "Users can view own templates" ON public.templates;
CREATE POLICY "Users can view own templates" ON public.templates
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own templates" ON public.templates;
CREATE POLICY "Users can insert own templates" ON public.templates
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own templates" ON public.templates;
CREATE POLICY "Users can update own templates" ON public.templates
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own templates" ON public.templates;
CREATE POLICY "Users can delete own templates" ON public.templates
  FOR DELETE USING (auth.uid()::text = user_id);

-- Ensure generated PDFs are isolated per user
DROP POLICY IF EXISTS "Users can view own generated PDFs" ON public.generated_pdfs;
CREATE POLICY "Users can view own generated PDFs" ON public.generated_pdfs
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own generated PDFs" ON public.generated_pdfs;
CREATE POLICY "Users can insert own generated PDFs" ON public.generated_pdfs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own generated PDFs" ON public.generated_pdfs;
CREATE POLICY "Users can delete own generated PDFs" ON public.generated_pdfs
  FOR DELETE USING (auth.uid()::text = user_id);

-- Ensure activity logs are isolated per user
DROP POLICY IF EXISTS "Users can view own activity logs" ON public.activity_logs;
CREATE POLICY "Users can view own activity logs" ON public.activity_logs
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own activity logs" ON public.activity_logs;
CREATE POLICY "Users can insert own activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Configure auth settings for email confirmation
INSERT INTO auth.config (parameter, value) VALUES ('confirm_email_change_enabled', 'true') ON CONFLICT (parameter) DO UPDATE SET value = 'true';
INSERT INTO auth.config (parameter, value) VALUES ('enable_signup', 'true') ON CONFLICT (parameter) DO UPDATE SET value = 'true';
INSERT INTO auth.config (parameter, value) VALUES ('enable_confirmations', 'true') ON CONFLICT (parameter) DO UPDATE SET value = 'true';