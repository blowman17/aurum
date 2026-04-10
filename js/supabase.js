const SUPABASE_URL = 'https://ryrzdhzccdagxevfrvah.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5cnpkaHpjY2RhZ3hldmZydmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDQxNTcsImV4cCI6MjA5MTMyMDE1N30.BW8X-SvDbTGtoYFpLAgsQG8YI0OnsmVI5YX_V4KjMz0';

// Global supabase client configuration
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
