import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { NotificationProvider } from "@/contexts/notification-context"
import { LocationProvider } from "@/contexts/location-context"
import { Header } from "@/components/common/header"
import { Footer } from "@/components/common/footer"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CampusShare - Student Platform for Rides",
  description: "Connect with fellow students for ride-sharing.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <NotificationProvider>
            <LocationProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <Toaster />
            </LocationProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
