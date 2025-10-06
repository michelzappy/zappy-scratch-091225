import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { StackProvider, StackTheme } from "@stackframe/stack"
import { stackServerApp } from "@/lib/stack"

const inter = Inter({ subsets: ['latin'] })

// Force dynamic rendering for Stack Auth (uses cookies)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'TeleHealth Platform',
  description: 'Modern telehealth consultation platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <div className="min-h-screen bg-white">
              {children}
            </div>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  )
}
