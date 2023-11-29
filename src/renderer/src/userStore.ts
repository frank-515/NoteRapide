import { defineStore } from 'pinia'
import { ref } from 'vue'

interface UserPreference {
  last_edit_path: string
  theme: 'light' | 'dark'
}
export const useUserStore = defineStore('user', () => {
  const last_edit_path = ref('')
  const theme = ref<'light' | 'dark'>('light')
  const getUserPreference = (): UserPreference => {
    loadUserPreference()
    return {
      last_edit_path: last_edit_path.value,
      theme: theme.value
    }
  }
  const loadUserPreference = () => {
    window.api.app_invoke('getUserPreference').then((p: UserPreference) => {
      last_edit_path.value = p.last_edit_path
      theme.value = p.theme
    })
  }
  const saveUserPreference = () => {
    window.api.app_send('saveUserPreference', getUserPreference())
  }

  return {
    last_edit_path,
    theme,
    getUserPreference,
    loadUserPreference,
    saveUserPreference
  }
})
