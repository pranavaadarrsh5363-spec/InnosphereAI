'use client';

import { useEffect } from'react';
import { useParams, useRouter } from'next/navigation';
import { Loader2 } from'lucide-react';

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
 <div className="text-center space-y-3">
 <Loader2 className="h-6 w-6 text-indigo-600 animate-spin mx-auto" />
 <p className="text-sm text-slate-600 font-medium">Loading Research Workspace...</p>
 </div>
 </div>
 );
}
