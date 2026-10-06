"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"

/**
 * Toasts. Every corner of the app calls toast() from sonner, so this is the
 * one true Toaster, styled to match the paper and ink of the brand.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      className="toaster group"
      toastOptions={{
        style: {
          background: "#FFFDF7",
          color: "#16241C",
          border: "1px solid rgba(22,36,28,0.12)",
          borderRadius: "16px",
          boxShadow: "0 18px 50px -18px rgba(22,36,28,0.4)",
          fontFamily: "var(--font-inter)",
          fontSize: "13.5px",
        },
      }}
      style={
        {
          "--normal-bg": "#FFFDF7",
          "--normal-text": "#16241C",
          "--normal-border": "rgba(22,36,28,0.12)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
