'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: 'Inter, sans-serif',
        },
        className: 'toast',
      }}
    />
  )
}
