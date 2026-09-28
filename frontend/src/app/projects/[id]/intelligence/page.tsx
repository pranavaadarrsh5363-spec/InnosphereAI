'use client';

import React, { useEffect } from'react';
import { useParams, useRouter } from'next/navigation';
import { useProject } from'@/lib/project-context';
import ProjectIntelligencePage from'@/app/project-intelligence/page';

export default function DynamicProjectIntelligencePage() {
 const params = useParams();
 const projectId = params?.id ? Number(params.id) : null;
 const { setActiveProjectId } = useProject();

 useEffect(() => {
 if (projectId) {
 setActiveProjectId(projectId);
 }
 }, [projectId, setActiveProjectId]);

 return <ProjectIntelligencePage />;
}
