'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      forcedTheme="dark"
    >
      {children}
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(20, 20, 43, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#f1f0ff',
            backdropFilter: 'blur(12px)',
          },
        }}
      />
    </ThemeProvider>
  )
}
