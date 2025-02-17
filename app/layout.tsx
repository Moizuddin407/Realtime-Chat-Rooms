import './globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from './providers/theme-provider'

export const metadata: Metadata = {
  title: 'Chat Room',
  description: 'Real-time chat application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

