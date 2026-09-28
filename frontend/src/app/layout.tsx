import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ProjectProvider } from '@/lib/project-context';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { FloatingAssistant } from '@/components/floating-assistant';

export const metadata: Metadata = {
  title: 'InnoSphere AI | Student Innovation & Intelligent Resource Discovery Platform',
  description:
    'Turn innovative ideas into practical technology-driven solutions with AI-powered multi-source discovery, automated analysis, and 10-phase execution roadmaps.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col selection:bg-blue-600 selection:text-white">
        <AuthProvider>
          <ProjectProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <FloatingAssistant />
          </ProjectProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
