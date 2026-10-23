import { supabase, isSupabaseConfigured } from './supabase';

export type Row = { id: string; created_at: string };
type Filters = Record<string, string>;
type Values = Record<string, unknown>;

const LOCAL_PREFIX = 'bvm_db_';
const tablesWithoutRemote = new Set<string>();

function shouldUseRemote(table: string) {
  return isSupabaseConfigured && !tablesWithoutRemote.has(table);
}

function markRemoteUnavailable(table: string, error: unknown) {
  tablesWithoutRemote.add(table);
  console.warn(`[bvm] "${table}" cədvəli Supabase-də əlçatan deyil, lokal yaddaşa keçilir.`, error);
}

function readLocal<T>(table: string): T[] {
  try {
    const raw = localStorage.getItem(LOCAL_PREFIX + table);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(table: string, rows: unknown[]) {
  try {
    localStorage.setItem(LOCAL_PREFIX + table, JSON.stringify(rows));
  } catch {
    throw new Error('Yaddaş doludur. Daha kiçik fayl seçin.');
  }
}

function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function matches(row: Values, filters: Filters) {
  return Object.entries(filters).every(([k, v]) => row[k] === v);
}

export async function listRows<T extends Row>(table: string, filters: Filters = {}, ascending = false): Promise<T[]> {
  if (shouldUseRemote(table)) {
    let query = supabase.from(table).select('*');
    for (const [k, v] of Object.entries(filters)) query = query.eq(k, v);
    const { data, error } = await query.order('created_at', { ascending });
    if (!error) return (data ?? []) as T[];
    markRemoteUnavailable(table, error);
  }
  const rows = readLocal<T>(table).filter((r) => matches(r as unknown as Values, filters));
  return rows.sort((a, b) => {
    const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return ascending ? diff : -diff;
  });
}

export async function insertRow<T extends Row>(table: string, values: Values): Promise<T> {
  if (shouldUseRemote(table)) {
    const { data, error } = await supabase.from(table).insert(values).select('*').single();
    if (!error && data) return data as T;
    markRemoteUnavailable(table, error);
  }
  const row = { id: newId(), created_at: new Date().toISOString(), ...values } as unknown as T;
  writeLocal(table, [...readLocal<T>(table), row]);
  return row;
}

export async function updateRow(table: string, id: string, patch: Values): Promise<void> {
  if (shouldUseRemote(table)) {
    const { error } = await supabase.from(table).update(patch).eq('id', id);
    if (!error) return;
    markRemoteUnavailable(table, error);
  }
  writeLocal(
    table,
    readLocal<Values>(table).map((r) => (r.id === id ? { ...r, ...patch } : r))
  );
}

export async function deleteRow(table: string, id: string): Promise<void> {
  if (shouldUseRemote(table)) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) return;
    markRemoteUnavailable(table, error);
  }
  writeLocal(
    table,
    readLocal<Values>(table).filter((r) => r.id !== id)
  );
}
