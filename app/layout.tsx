import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quin-Echo — Real-Time Voice Changer',
  description:
    'Change your voice live on WhatsApp, Discord, and Zoom. Local audio effects, voice presets, recording, and virtual cable routing for desktop calls.',
  keywords: ['voice changer', 'real-time', 'WhatsApp', 'Discord', 'live calls'],
  openGraph: {
    title: 'Quin-Echo',
    description: 'Real-Time Voice Changer for Live Calls',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,700&family=Work+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-white text-black antialiased">{children}</body>
    </html>
  );
}
