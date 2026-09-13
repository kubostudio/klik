'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Store } from '@/lib/supabase/types';
import { getCurrentStore } from '@/lib/supabase/db';

interface DashboardContextType {
  store: Store | null;
  sellerName: string;
  isLoadingStore: boolean;
  refreshStore: () => Promise<Store | null>;
  updateStoreLocally: (updated: Partial<Store>) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const STORE_CACHE_KEY = 'qori_cached_store';
const SELLER_SESSION_KEY = 'qori_seller_session';

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [sellerName, setSellerName] = useState<string>('');
  const [isLoadingStore, setIsLoadingStore] = useState<boolean>(true);

  // Background revalidation with Supabase
  const refreshStore = useCallback(async (): Promise<Store | null> => {
    try {
      const current = await getCurrentStore();
      if (current) {
        setStore(current);
        try {
          localStorage.setItem(STORE_CACHE_KEY, JSON.stringify(current));
          localStorage.setItem('qori_current_store_id', current.id);
        } catch {}
      }

      try {
        const session = localStorage.getItem(SELLER_SESSION_KEY);
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.name) setSellerName(parsed.name.split(' ')[0]);
        } else if (current?.name) {
          setSellerName(current.name);
        }
      } catch {}

      return current;
    } catch (err) {
      console.error('Error refreshing store in DashboardContext:', err);
      return null;
    } finally {
      setIsLoadingStore(false);
    }
  }, []);

  const updateStoreLocally = useCallback((updated: Partial<Store>) => {
    setStore((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem(STORE_CACHE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Initial client mount: Read cache immediately (0ms) then revalidate in background
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORE_CACHE_KEY);
      if (cached) {
        const parsedStore = JSON.parse(cached);
        setStore(parsedStore);
        setIsLoadingStore(false);
      }

      const session = localStorage.getItem(SELLER_SESSION_KEY);
      if (session) {
        const parsedSession = JSON.parse(session);
        if (parsedSession.name) {
          setSellerName(parsedSession.name.split(' ')[0]);
        }
      }
    } catch {}

    refreshStore();
  }, [refreshStore]);

  return (
    <DashboardContext.Provider
      value={{
        store,
        sellerName: sellerName || (store?.name ? store.name.split(' ')[0] : 'Emprendedor'),
        isLoadingStore,
        refreshStore,
        updateStoreLocally,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
