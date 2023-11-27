import { defineStore } from "pinia";
import { ref } from "vue"

interface UserPreference {
  last_edit_path: string,
  theme: "light" | "dark"
}
export const useUserStroe = defineStore('user', () => {
  const last_edit_path = ref("")
  const theme = ref<"light"|"dark">("light")
  const getUserPreference = () : UserPreference => {
    return {
      last_edit_path: last_edit_path.value,
      theme: theme.value
    }
  }
  return {
    last_edit_path, theme, getUserPreference
  }
})
