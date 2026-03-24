declare global {
  interface Window {
    electron?: {
      openExternal: (url: string) => Promise<{ success: boolean; error?: string }>
    }
  }
}

export {}
