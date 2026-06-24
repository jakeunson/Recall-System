import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export const useSupabaseCollection = <T>(tableName: string) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: result } = await supabase.from(tableName).select('*').order('createdAt', { ascending: false, nullsFirst: false });
      if (result) setData(result as T[]);
      setLoading(false);
    };
    fetch();
  }, [tableName]);

  const updateData = (newData: T[]) => {
    setData(newData);
  };

  return [data, updateData, loading] as const;
};
