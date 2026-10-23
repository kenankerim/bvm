import useSWR, { useSWRConfig } from 'swr';
import { deleteRow, insertRow, listRows, updateRow, type Row } from '@/lib/db';

type Key = readonly ['collection', string, string];

export function collectionKey(table: string, filters: Record<string, string> | null): Key | null {
  return filters ? (['collection', table, JSON.stringify(filters)] as const) : null;
}

export function useCollection<T extends Row>(
  table: string,
  filters: Record<string, string> | null,
  ascending = false
) {
  const key = collectionKey(table, filters);
  const { mutate: globalMutate } = useSWRConfig();
  const { data, isLoading, mutate } = useSWR(key, ([, t, f]: Key) => listRows<T>(t, JSON.parse(f), ascending));
  const items = data ?? [];

  const refreshSiblings = () =>
    globalMutate(
      (k) => Array.isArray(k) && k[0] === 'collection' && k[1] === table && k[2] !== key?.[2],
      undefined,
      { revalidate: true }
    );

  const add = async (values: Record<string, unknown>) => {
    const row = await insertRow<T>(table, { ...filters, ...values });
    await mutate((prev) => (ascending ? [...(prev ?? []), row] : [row, ...(prev ?? [])]), { revalidate: false });
    void refreshSiblings();
    return row;
  };

  const update = async (id: string, patch: Partial<T>) => {
    await mutate((prev) => prev?.map((r) => (r.id === id ? { ...r, ...patch } : r)), { revalidate: false });
    await updateRow(table, id, patch as Record<string, unknown>);
    void refreshSiblings();
  };

  const remove = async (id: string) => {
    await mutate((prev) => prev?.filter((r) => r.id !== id), { revalidate: false });
    await deleteRow(table, id);
    void refreshSiblings();
  };

  return { items, loading: isLoading, add, update, remove, refresh: () => mutate() };
}
