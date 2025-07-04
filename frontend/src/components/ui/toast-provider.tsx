import React from 'react'
import { Toaster } from 'react-hot-toast'

export const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#ffffff',
          color: '#374151',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          fontSize: '14px',
          maxWidth: '500px',
        },
        success: {
          style: {
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
          },
          iconTheme: {
            primary: '#16a34a',
            secondary: '#f0fdf4',
          },
        },
        error: {
          style: {
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
          },
          iconTheme: {
            primary: '#dc2626',
            secondary: '#fef2f2',
          },
        },
        loading: {
          style: {
            background: '#fefce8',
            border: '1px solid #fef08a',
            color: '#a16207',
          },
          iconTheme: {
            primary: '#ca8a04',
            secondary: '#fefce8',
          },
        },
      }}
    />
  )
}
