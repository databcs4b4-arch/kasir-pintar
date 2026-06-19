import { createClient } from '@supabase/supabase-js';

// Ganti dengan URL dan Anon Key milik proyek Supabase Anda
const supabaseUrl = 'https://cecklxjqpdopsvgvaqas.supabase.co';
const supabaseKey = 'sb_publishable_g3n8rJE8ZJHlbRvMYW0M8Q_QLJVKbG9';

export const supabase = createClient(supabaseUrl, supabaseKey);
