import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Iuran — Recurring USDC Billing',
  description: 'Recurring USDC billing. No cards, no friction.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
