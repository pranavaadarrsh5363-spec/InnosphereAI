'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ResearchProjectRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params?.projectId) {
      router.replace(`/projects/${params.projectId}/research`);
    } else {
      router.replace('/research');
    }
  }, [params, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading AI Research Workspace...</p>
      </div>
    </div>
  );
}
