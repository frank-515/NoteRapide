import { createApp } from 'vue'
import './style.stylus'
import App from './App.vue'
import { createPinia } from "pinia";

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// MDI Icons
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

const pinia = createPinia()
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
})

const app = createApp(App)

app.use(pinia).use(vuetify)


app.mount('#app')
