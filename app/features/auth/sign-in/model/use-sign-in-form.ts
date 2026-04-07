import { reactive, ref } from 'vue'
import { useToggle } from '@vueuse/core'

import { demoCredentials } from '~/shared/api/auth'
import { useSessionStore } from '~/entities/session/model/session.store'
import type { LoginCredentials } from '~/entities/session/model/types'

type FormError = {
  name?: string
  message: string
}

export function useSignInForm() {
  const sessionStore = useSessionStore()
  const [passwordVisible, togglePasswordVisibility] = useToggle(false)
  const formError = ref('')

  const state = reactive<LoginCredentials>({
    email: sessionStore.lastLoginEmail || demoCredentials.email,
    password: '',
    remember: true
  })

  function validate(values: Partial<LoginCredentials>): FormError[] {
    const errors: FormError[] = []
    const email = values.email?.trim() || ''
    const password = values.password?.trim() || ''

    if (!email) {
      errors.push({ name: 'email', message: 'Введите корпоративный email оператора или исследователя.' })
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.push({ name: 'email', message: 'Проверьте формат email для доступа в исследовательский контур.' })
    }

    if (!password) {
      errors.push({ name: 'password', message: 'Введите пароль доступа к панели мониторинга.' })
    } else if (password.length < 8) {
      errors.push({ name: 'password', message: 'Пароль должен содержать минимум 8 символов.' })
    }

    return errors
  }

  async function submit() {
    formError.value = ''

    try {
      await sessionStore.signIn({ ...state })
      await navigateTo('/workspace')
    } catch (error) {
      formError.value = error instanceof Error ? error.message : 'Не удалось выполнить вход в систему мониторинга.'
    }
  }

  return {
    formError,
    passwordVisible,
    sessionStore,
    state,
    submit,
    togglePasswordVisibility,
    validate
  }
}
