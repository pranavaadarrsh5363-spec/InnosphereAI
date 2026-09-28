'use client';

import { useEffect } from'react';
import { useRouter } from'next/navigation';

export default function PatentExplorerAliasPage() {
 const router = useRouter();

 useEffect(() => {
 router.replace('/patents');
 }, [router]);

 return null;
}
