import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { getUserInfo } from "@/lib/CardanoLogin";
import { CardanoLoginContext } from "@/contexts/CardanoLoginContext";

export const metadata: Metadata = {
  title: "Cardano Wallet Login",
  description: "Login using Cardano Wallet",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userInfo = await getUserInfo()

  return (
    <html lang="en">
      <body className={`antialiased`}>
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
          <CardanoLoginContext options={userInfo}>
              <Navbar />

              <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
                {children}
              </main>

              <Footer />
            </CardanoLoginContext>
        </div>
      </body>
    </html>
  );
}
