import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useStorage } from '@vueuse/core'

import { loginWithEmail } from '~/shared/api/auth'
import type { LoginCredentials, SessionUser } from './types'

export const useSessionStore = defineStore('session', () => {
  const token = useStorage<string | null>('session-token', null)
  const user = useStorage<SessionUser | null>('session-user', null)
  const lastLoginEmail = useStorage('last-login-email', 'research@signal-inc.io')
  const status = ref<'idle' | 'loading' | 'authenticated'>('idle')
  const error = ref('')

  const isAuthenticated = computed(() => Boolean(token.value && user.value))

  async function signIn(credentials: LoginCredentials) {
    status.value = 'loading'
    error.value = ''

    try {
      const response = await loginWithEmail(credentials)

      token.value = response.token
      user.value = response.user
      lastLoginEmail.value = credentials.email.trim()
      status.value = 'authenticated'

      return response.user
    } catch (err) {
      status.value = 'idle'
      error.value = err instanceof Error ? err.message : 'Не удалось выполнить вход.'
      throw err
    }
  }

  function signOut() {
    token.value = null
    user.value = null
    status.value = 'idle'
    error.value = ''
  }

  return {
    error,
    isAuthenticated,
    lastLoginEmail,
    signIn,
    signOut,
    status,
    token,
    user
  }
})
