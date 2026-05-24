import { getToken } from './auth.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const apiFetch = async (path, options = {}) => {
  const token = getToken()
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  })

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => null)
      const message = data?.message || 'Request failed'
      throw new Error(message)
    }

    const text = await response.text().catch(() => '')
    throw new Error(text || 'Request failed')
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response
}

export const downloadFile = async (path, filename) => {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Download failed')
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
