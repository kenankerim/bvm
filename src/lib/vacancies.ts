import { useEffect, useState } from 'react';
import type { Row } from './db';
import type { FeedItem } from './supabase';

export type VacancyStatus = 'active' | 'inactive';

export type CompanyVacancy = Row & {
  firebase_uid: string;
  company_name: string;
  title: string;
  salary: string;
  location: string;
  duration: string;
  status: VacancyStatus;
  auto_activate_at: string | null;
  auto_end_at: string | null;
};

export const COMPANY_VACANCIES = 'company_vacancies';

export function effectiveStatus(v: Pick<CompanyVacancy, 'status' | 'auto_activate_at' | 'auto_end_at'>, now: number): VacancyStatus {
  const events: { t: number; s: VacancyStatus }[] = [];
  if (v.auto_activate_at) events.push({ t: new Date(v.auto_activate_at).getTime(), s: 'active' });
  if (v.auto_end_at) events.push({ t: new Date(v.auto_end_at).getTime(), s: 'inactive' });
  const passed = events.filter((e) => e.t <= now).sort((a, b) => a.t - b.t);
  return passed.length ? passed[passed.length - 1].s : v.status;
}

export function pendingTransition(v: CompanyVacancy, now: number): Partial<CompanyVacancy> | null {
  const activatePassed = v.auto_activate_at && new Date(v.auto_activate_at).getTime() <= now;
  const endPassed = v.auto_end_at && new Date(v.auto_end_at).getTime() <= now;
  if (!activatePassed && !endPassed) return null;
  return {
    status: effectiveStatus(v, now),
    auto_activate_at: activatePassed ? null : v.auto_activate_at,
    auto_end_at: endPassed ? null : v.auto_end_at,
  };
}

export function toFeedItem(v: CompanyVacancy): FeedItem {
  return {
    type: 'vacancy',
    id: v.id,
    company_id: '',
    title: v.title,
    salary: v.salary,
    duration: v.duration,
    location: v.location,
    is_vip: false,
    salary_min: Number.parseInt(v.salary.replace(/\D+/g, ' ').trim().split(' ')[0] || '0', 10) || 0,
    created_at: v.created_at,
    company: { id: v.firebase_uid, name: v.company_name, created_at: v.created_at },
    owner_uid: v.firebase_uid,
  };
}

export function useNow(intervalMs = 10_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function toLocalInput(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('az-AZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
