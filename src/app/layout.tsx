import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AdForge — AI-Powered Advertisement Campaign Generator',
  description: 'Generate complete, ready-to-publish ad campaigns in seconds with AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}