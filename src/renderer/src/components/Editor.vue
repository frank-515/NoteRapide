<script setup lang="ts">
import {useDisplay} from "vuetify";
import { computed, onMounted, ref, toValue, watch } from "vue";
import {mdiLanguageMarkdown, mdiTextBox} from "@mdi/js";

import markdown_it from "markdown-it";
import emoji from 'markdown-it-emoji'
import namedCodeBlocks from "markdown-it-named-code-blocks";
import hljs from 'highlight.js'
import 'highlight.js/styles/monokai.css'
import {useUserStore} from "../userStore";
import {storeToRefs} from 'pinia'

const userStore = useUserStore()
const { last_edit_path } = storeToRefs(userStore)

watch(last_edit_path, (last_edit_path) => {
  console.log('[DEBUG]: Reading file:' + last_edit_path.value);
  api.app_invoke('read', toValue(last_edit_path))
    .then((content: string) => {
      raw_md_text.value = content
    })
    .catch((error) => {
      console.error("Error when reading file",error);
    })

})

const md = markdown_it({
  breaks: true,
  typographer: true,
  linkify: true,
  html: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
          hljs.highlight(lang, str, true).value +
          '</code></pre>';
      } catch (__) {}
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  },
})
  .use(emoji)
  .use(namedCodeBlocks)

const {mdAndUp} = useDisplay()

const raw_md_text = ref("")
const rendered_md_text = computed(() => {
  return md.render(raw_md_text.value).toString()
})

onMounted(() => {


  const insert = (c: string) => {
    const textarea_dom = document.querySelector("textarea")!
    let start = textarea_dom.selectionStart
    let end = textarea_dom.selectionEnd
    textarea_dom.value = textarea_dom.value.substring(0, start)
      + c
      + textarea_dom.value.substring(end)
    textarea_dom.selectionStart = textarea_dom.selectionEnd = start + 1;
  }

  addEventListener("keydown", (event) => {
    // When input
    switch (event.key) {
      case 'Tab':
        event.preventDefault()
        insert('\t');
        break
      case '(':
        event.preventDefault()
        insert('()')
        break
      case '[':
        event.preventDefault()
        insert('[]')
        break
      case '{':
        event.preventDefault()
        insert('{}')
        break
      case '"':
        event.preventDefault()
        insert('""')
        break
    }
  })
})


</script>

<template>
  <div id="wrapper">
    <v-sheet id="edit">
      <v-icon :icon="mdiLanguageMarkdown"></v-icon>
      <v-textarea
        variant="outlined"
        v-model="raw_md_text"
        :autofocus="true"
        :auto-grow="true"
        :no-resize="true"
        id="textarea">
      </v-textarea>
    </v-sheet>

    <v-sheet id="preview" v-if="mdAndUp">
      <v-icon :icon="mdiTextBox"></v-icon>
      <div v-html="rendered_md_text">
      </div>
    </v-sheet>
  </div>
</template>

<style lang="stylus">
#wrapper
  display flex
  flex-direction row

#wrapper > *
  padding 20px

#edit
  flex 1

#preview
  flex 1

.hljs
  padding 2em 0 1em 1em
  border-radius 1ex
  margin 1em

.named-fence-block
  position relative

.named-fence-filename
  position absolute
  top 1em
  left 1em
  font-weight bold
  color #000000
  background #c0c0c0
  line-height 1em
  opacity 0.6
  border-radius 0.3ex

#textarea
  height 80vh

hr
  border 0
  padding-top 2px
  margin 1ex 0 1ex 0
  background repeating-linear-gradient(to right, #a2a9b6 0px, #a2a9b6 4px, transparent 0px, transparent 10px)
</style>
