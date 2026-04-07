import type { LoginCredentials, LoginResponse } from '~/entities/session/model/types'

const DEMO_ACCOUNT = {
  email: 'operator@yolo-firewatch.ai',
  password: 'YOLO-Fire-2026!',
  user: {
    id: 'usr_01',
    name: 'Elena Volkova',
    email: 'operator@yolo-firewatch.ai',
    role: 'Computer Vision Engineer',
    workspace: 'YOLO FireWatch Lab'
  }
} as const

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function loginWithEmail(credentials: LoginCredentials): Promise<LoginResponse> {
  await delay(900)

  const email = credentials.email.trim().toLowerCase()
  const password = credentials.password.trim()

  if (email !== DEMO_ACCOUNT.email || password !== DEMO_ACCOUNT.password) {
    throw new Error('Неверный email или пароль. Используйте демонстрационный доступ оператора ниже.')
  }

  return {
    token: 'demo-session-token',
    user: { ...DEMO_ACCOUNT.user }
  }
}

export const demoCredentials = {
  email: DEMO_ACCOUNT.email,
  password: DEMO_ACCOUNT.password
}
