import "./globals.css";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import type { Metadata } from "next";

import { AppProviders } from "@/app/providers";

export const metadata: Metadata = {
  title: "Admin Workspace Starter",
  description:
    "Minimal Next.js admin workspace starter with Ant Design SSR and Tailwind CSS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="bg-background text-foreground min-h-full">
        <AntdRegistry layer>
          <AppProviders>{children}</AppProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
