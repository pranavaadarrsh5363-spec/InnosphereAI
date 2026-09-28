'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function PriorArtAliasPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/projects/${params.id}/patents`);
    }
  }, [params, router]);

  return null;
}
