import "./globals.css";
import type { Metadata } from "next";
import { Figtree } from "next/font/google"; // close to Airbnb's own font
import { AppProvider } from "@/lib/AppContext";
import Navbar from "@/components/Navbar";

const font = Figtree({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Airbnb Clone",
  description: "Find places to stay",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={font.className}>
        <AppProvider>
          <Navbar />
          <main className="mx-auto max-w-[1760px] px-5 md:px-10 xl:px-20">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}