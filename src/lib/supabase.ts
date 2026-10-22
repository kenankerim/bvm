import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
    },
  }
);

export type Company = {
  id: string;
  name: string;
  created_at: string;
};

export type Vacancy = {
  id: string;
  company_id: string;
  title: string;
  salary: string;
  duration: string;
  location: string;
  is_vip: boolean;
  salary_min: number;
  created_at: string;
  company?: Company;
};

export type Article = {
  id: string;
  company_id: string;
  title: string;
  content: string;
  category: string;
  is_vip: boolean;
  created_at: string;
  company?: Company;
};

export type FeedItem =
  | ({ type: 'vacancy' } & Vacancy)
  | ({ type: 'article' } & Article);
