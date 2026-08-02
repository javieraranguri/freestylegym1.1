import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://veqfizjhfqfwridjycug.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlcWZpempoZnFmd3JpZGp5Y3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDgxNjMsImV4cCI6MjA5NjQyNDE2M30.yvQdFDxMpJuQ0aaLY2LHTUZ1z1WAPYhse6FCxFj7OCQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
