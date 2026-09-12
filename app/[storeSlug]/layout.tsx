import { getStoreBySlug, getStoreIntegration } from '@/lib/supabase/db';
import PixelLoader from '@/components/store/PixelLoader';

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { storeSlug: string };
}) {
  const store = await getStoreBySlug(params.storeSlug);
  const integration = store ? await getStoreIntegration(store.id) : null;

  return (
    <>
      <PixelLoader integration={integration} />
      {children}
    </>
  );
}
