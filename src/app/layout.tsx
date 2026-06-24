import type { Metadata } from "next";
import "./globals.css";

import { ToastProvider } from "@/components/custom/ToastNotification";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "국민소환제",
  description: "데이터 기반 정치 행동 검증 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn("font-sans", geist.variable)}>
      <body className="antialiased">
        <ToastProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

