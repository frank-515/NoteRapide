<script lang="ts" setup>
import { mdiCheckBold, mdiCog, mdiMinus, mdiPlus } from '@mdi/js'
import { computed, onMounted, ref } from 'vue'
import Editor from './components/Editor.vue'
import { useUserStore } from './userStore'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const { last_edit_path } = storeToRefs(userStore)
const accountItem = ['Exit', 'Font', 'Plug-ins']

const drawerItem = ref<string[]>([])
const drawer = ref(false)
const newNoteDisplay = ref(false)
const newNoteName = ref('')

const currentDocumentName = computed(() => {
  // 获取文件名
  const fileNameWithExtension = last_edit_path.value
  const fileName = fileNameWithExtension.split('/').pop() || '' // 使用split和pop获取最后一个片段作为文件名
  // 去除文件后缀
  const lastDotIndex = fileName.lastIndexOf('.')
  return lastDotIndex > -1 ? fileName.slice(0, lastDotIndex) : fileName
})

const onNewNote = () => {
  console.log(newNoteDisplay.value)
  if (newNoteDisplay.value) {
    newNoteName.value = ''
    newNoteDisplay.value = false
  } else {
    newNoteDisplay.value = true
    setTimeout(() => {
      const inputDom = document.getElementById('name_input')
      console.log(inputDom)
      inputDom?.focus()
    }, 100)
  }
}

const onEnter = () => {
  if (newNoteName.value.length == 0) {
    return
  }
  drawerItem.value.push(newNoteName.value)
  newNoteName.value = ''
  newNoteDisplay.value = false
}

onMounted(() => {
  userStore.loadUserPreference()
})
</script>

<template>
  <v-layout>
    <v-system-bar color="indigo"> </v-system-bar>
    <v-app-bar color="indigo">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>{{ currentDocumentName }}</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn icon>
        <v-icon :icon="mdiCog"></v-icon>
        <v-menu activator="parent">
          <v-list nav>
            <v-list-item v-for="(item, idx) in accountItem" :key="idx" :value="idx">
              {{ item }}
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer">
      <v-list nav>
        <v-list-item v-for="(item, idx) in drawerItem" :value="idx" :key="idx">
          <template #title>
            {{ item }}
          </template>
        </v-list-item>
        <v-list-item v-if="newNoteDisplay">
          <template #title>
            <v-text-field density="compact" variant="plain" v-model="newNoteName" id="name_input">
            </v-text-field>
          </template>
          <template #append>
            <v-btn @click="onEnter()" variant="plain" density="compact" size="small" id="check-btn">
              <v-icon :icon="mdiCheckBold"></v-icon>
            </v-btn>
          </template>
        </v-list-item>
        <v-list-item @click="onNewNote()">
          <template #prepend>
            <v-icon :icon="mdiPlus" v-if="!newNoteDisplay"></v-icon>
            <v-icon :icon="mdiMinus" v-else></v-icon>
          </template>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <Editor></Editor>
      </v-container>
    </v-main>
  </v-layout>
</template>

<style lang="stylus">
body
  font: Helvetica
  color: balck

#check-btn
  position relative
  bottom 1ex
</style>
