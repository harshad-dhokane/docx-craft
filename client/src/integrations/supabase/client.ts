// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mdfbxcaqxpmdvfqsvagi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZmJ4Y2FxeHBtZHZmcXN2YWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMzM4MTQsImV4cCI6MjA2MzkwOTgxNH0.aIPDLYsvFdwNH204XETguGS-eE1LCuZloJfvuRibQQM";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);