import { useState, useEffect } from 'react';

const isClient = typeof window !== 'undefined';

export const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  if (!isClient) return defaultValue;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved) as T;
    } catch {
      return defaultValue;
    }
  }
  localStorage.setItem(key, JSON.stringify(defaultValue));
  return defaultValue;
};

export const setLocalStorageItem = <T>(key: string, value: T) => {
  if (!isClient) return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(`local-storage-${key}-changed`));
};

export const useLocalStorageState = <T>(key: string, initialValue: T): [T, (val: T) => void, boolean] => {
  const [state, setState] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = getLocalStorageItem(key, initialValue);
    setState(data);
    setLoading(false);

    const handleStorageChange = () => {
      setState(getLocalStorageItem(key, initialValue));
    };

    window.addEventListener(`local-storage-${key}-changed`, handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(`local-storage-${key}-changed`, handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  const updateValue = (newValue: T) => {
    setState(newValue);
    setLocalStorageItem(key, newValue);
  };

  return [state, updateValue, loading];
};
