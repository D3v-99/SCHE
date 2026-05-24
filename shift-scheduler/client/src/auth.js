const TOKEN_KEY = 'shiftSchedulerAdminToken'

export const getToken = () => {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const setToken = (token) => {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // ignore
  }
}

export const clearToken = () => {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
}
