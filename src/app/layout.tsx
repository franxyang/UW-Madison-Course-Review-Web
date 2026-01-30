import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WiscFlow - UW Madison Course Reviews",
  description:
    "Find and share course reviews for UW Madison. View grade distributions, professor ratings, and student feedback.",
  keywords: ["UW Madison", "course reviews", "madgrades", "wisconsin", "college"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t py-6 md:py-0">
              <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                  Built for{" "}
                  <span className="font-medium text-badger-red">
                    UW Madison
                  </span>{" "}
                  students. Not affiliated with the university.
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  Grade data from{" "}
                  <a
                    href="https://madgrades.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-4 hover:text-primary"
                  >
                    MadGrades
                  </a>
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
