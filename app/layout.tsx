import "./globals.css";
import Sidebar from "../components/Sidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Construction Manager",
  description: "Construction Project Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <div className="flex">
          <Sidebar />

          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}