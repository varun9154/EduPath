import type { Metadata } from 'next';
import './globals.css';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileStickyCTA from '@/components/MobileStickyCTA';

export const metadata: Metadata = {
  title: 'EduPath — From 10th to Your First Job',
  description:
    'Complete guidance platform for 12th students: All 36 Indian States & UTs entrance exams, Engineering, Medical, Pharmacy, Management, Law, Architecture, Design, Commerce, Arts, professional courses, career roadmaps, study resources, and free expert counselling.',
  keywords: [
    'EduPath',
    'EduPath AI',
    'career guidance',
    'student career guidance',
    'entrance exams India',
    'engineering courses',
    'medical courses',
    'pharmacy courses',
    'career roadmap',
    'college guidance',
    'student counselling',
    '10th career guidance',
  ],
  authors: [{ name: 'EduPath' }],
  creator: 'EduPath',
  publisher: 'EduPath',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'EduPath — From 10th to Your First Job',
    description:
      'Your complete education and career guidance platform from 10th grade to your first job.',
    type: 'website',
    siteName: 'EduPath',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-slate-50 pb-16 md:pb-0">
        {/* Main Navigation */}
        <Navbar />

        {/* Main Application Content */}
        <main className="flex-grow">{children}</main>

        {/* Footer */}
        <Footer />

        {/* Mobile Demo / CTA */}
        <MobileStickyCTA />
      </body>
    </html>
  );
}