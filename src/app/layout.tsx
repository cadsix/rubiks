import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "Rubik's Studio — 3D Cube & Solver",
  description: "Interactive Rubik's cube solver with 3D visualization, 2D net editor, and step-by-step solution player.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen bg-[#fafafa] text-neutral-900 antialiased selection:bg-neutral-200 selection:text-neutral-900`}>
        {children}
      </body>
    </html>
  );
}
