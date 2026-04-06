import type { LoginCredentials, LoginResponse } from '~/entities/session/model/types'

const DEMO_ACCOUNT = {
  email: 'research@signal-inc.io',
  password: 'NuxtUI2026!',
  user: {
    id: 'usr_01',
    name: 'Elena Volkova',
    email: 'research@signal-inc.io',
    role: 'Lead Research Analyst',
    workspace: 'Signal Research Hub'
  }
} as const

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function loginWithEmail(credentials: LoginCredentials): Promise<LoginResponse> {
  await delay(900)

  const email = credentials.email.trim().toLowerCase()
  const password = credentials.password.trim()

  if (email !== DEMO_ACCOUNT.email || password !== DEMO_ACCOUNT.password) {
    throw new Error('Неверный email или пароль. Используйте демонстрационные данные ниже.')
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
