import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hheqwznhjsakvyjavcky.supabase.co';
const supabaseAnonKey = 'sb_publishable_YD_sPRRBCOh6wwarHEPtxw_0oN-XgRH';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
