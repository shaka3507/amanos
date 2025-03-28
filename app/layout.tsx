import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { createClient } from "@/utils/supabase/server"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "amanos",
  description: "an app for keeping us safe",
    generator: 'v0.dev + cursor + person'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data } = await supabase.auth.getUser()
      user = data?.user
    }
  } catch (error) {
    console.error("Error in RootLayout:", error)
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="min-h-screen flex flex-col">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'