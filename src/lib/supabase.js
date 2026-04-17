import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://abrxnpmqcdeewegvommp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFicnhucG1xY2RlZXdlZ3ZvbW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjgxMDcsImV4cCI6MjA5MTM0NDEwN30.0_0BrbLO7vIOzMOK8QkMsKEjo8jdtE7Cd6AEKTKiPb8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
