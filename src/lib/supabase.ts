import { createClient } from '@supabase/supabase-js';

// URL e Chave Pública (Anon) fornecidas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://typutzhgcxypruremlgy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cHV0emhnY3h5cHJ1cmVtbGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjI4MTcsImV4cCI6MjA5MDYzODgxN30.a68QTpy3xjNgTuCKy69B2LtKme5xlgaTwImfnkgoJRU';

// Inicializa o cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
