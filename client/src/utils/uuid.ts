// Simple UUID v4 generator
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Generate a shorter ID for elements
export const generateElementId = (): string => {
  return `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
