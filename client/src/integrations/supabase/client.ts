// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://bhfxyqbvykypmckwkfxo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZnh5cWJ2eWt5cG1ja3drZnhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NzUyMDMsImV4cCI6MjA2NTE1MTIwM30.srTq5YW9ZNRqMugoOKREzsHEQeX6tK-z57LwxAxJZBA";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);