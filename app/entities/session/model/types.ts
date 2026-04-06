export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
  workspace: string
}

export interface LoginCredentials {
  email: string
  password: string
  remember: boolean
}

export interface LoginResponse {
  token: string
  user: SessionUser
}
