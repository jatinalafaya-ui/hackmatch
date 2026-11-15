export type Role = 'hacker' | 'mentor'
export type ShortlistStatus = 'interested' | 'contacted' | 'teamed'

export interface Attendee {
  id: string
  firstName: string
  lastName: string
  role: Role
  school: string
  skills: string[]
  lookingFor: string
  bio: string
}

export interface CurrentUser extends Attendee {
  email: string
  isVerified: boolean
}

export interface ShortlistEntry {
  id: string
  note: string
  status: ShortlistStatus
  createdAt: string
  updatedAt: string
  member: Attendee
}

export interface SearchResponse {
  results: Attendee[]
  total: number
  page: number
  pageSize: number
}

const API_BASE = import.meta.env.VITE_API_URL ?? ''
const TOKEN_KEY = 'hackmatch.token'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.")
  }

  if (response.status === 204) {
    return undefined as T
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? 'Something went wrong')
  }
  return data as T
}

export const api = {
  register: (input: { email: string; password: string; firstName: string; lastName: string }) =>
    request<{ message: string }>('POST', '/auth/register', input),
  verifyEmail: (token: string) => request<{ message: string }>('POST', '/auth/verify-email', { token }),
  resendVerification: (email: string) =>
    request<{ message: string }>('POST', '/auth/resend-verification', { email }),
  login: (email: string, password: string) =>
    request<{ token: string; user: CurrentUser }>('POST', '/auth/login', { email, password }),
  forgotPassword: (email: string) => request<{ message: string }>('POST', '/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('POST', '/auth/reset-password', { token, password }),

  me: () => request<{ user: CurrentUser }>('GET', '/me'),
  updateMe: (input: Partial<Omit<CurrentUser, 'id' | 'email' | 'isVerified' | 'skills'>> & { skills?: string[] }) =>
    request<{ user: CurrentUser }>('PUT', '/me', input),

  search: (q: string, role: Role | '', page = 1) => {
    const params = new URLSearchParams({ q, page: String(page) })
    if (role) params.set('role', role)
    return request<SearchResponse>('GET', `/attendees/search?${params}`)
  },

  shortlist: () => request<{ entries: ShortlistEntry[] }>('GET', '/shortlist'),
  addToShortlist: (memberId: string, note: string) =>
    request<{ entry: ShortlistEntry }>('POST', '/shortlist', { memberId, note }),
  updateShortlistEntry: (id: string, input: { note?: string; status?: ShortlistStatus }) =>
    request<{ entry: ShortlistEntry }>('PUT', `/shortlist/${id}`, input),
  removeFromShortlist: (id: string) => request<void>('DELETE', `/shortlist/${id}`),
}
