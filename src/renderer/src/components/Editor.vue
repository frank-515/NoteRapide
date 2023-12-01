<script setup lang="ts">
import { useDisplay } from 'vuetify'
import { computed, onMounted, ref, toValue, watch } from 'vue'
import {
  mdiCodeBraces,
  mdiFormatBold,
  mdiFormatItalic,
  mdiFormatListBulleted,
  mdiFormatQuoteClose,
  mdiLanguageMarkdown,
  mdiTextBox
} from '@mdi/js'

import markdown_it from 'markdown-it'
import emoji from 'markdown-it-emoji'
import namedCodeBlocks from 'markdown-it-named-code-blocks'
import hljs from 'highlight.js'
import 'highlight.js/styles/monokai.css'
import { useUserStore } from '../userStore'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const { last_edit_path } = storeToRefs(userStore)

const editButtons = [
  {
    name: 'Bold',
    icon: mdiFormatBold,
    action: () => {
      insert('**', '**')
    }
  },
  {
    name: 'Italic',
    icon: mdiFormatItalic,
    action: () => {
      insert('*', '*')
    }
  },
  {
    name: 'Quote',
    icon: mdiFormatQuoteClose,
    action: () => {
      insertCharAtLineStart('> ')
    }
  },
  {
    name: 'List',
    icon: mdiFormatListBulleted,
    action: () => {
      insertCharAtLineStart('- ')
    }
  },
  { name: 'Code', icon: mdiCodeBraces, action: () => {
      insertLinesAroundSelection('```', '```')
    } }
]

const insert = (b: string, e: string) => {
  const textarea_dom = document.querySelector('textarea')!
  let start = textarea_dom.selectionStart
  let end = textarea_dom.selectionEnd
  if (start == end && e.length != 0) return
  const changed_input =
    textarea_dom.value.substring(0, start) +
    b +
    textarea_dom.value.substring(start, end) +
    e +
    textarea_dom.value.substring(end)
  raw_md_text.value = changed_input
  setTimeout(() => {
    textarea_dom.selectionStart = start
    textarea_dom.selectionStart = start + b.length
  }, 100)
}

const insertLinesAroundSelection = (b: string, e: string) => {
  const textareaDom = document.querySelector('textarea') as HTMLTextAreaElement;
  if (!textareaDom) return;

  const selectionStartLine = getLineNumber(textareaDom.value.substring(0, textareaDom.selectionStart));
  const selectionEndLine = getLineNumber(textareaDom.value.substring(0, textareaDom.selectionEnd));

  const textareaValue = textareaDom.value;
  const lines = textareaValue.split('\n');
  const changedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (i === selectionStartLine) {
      changedLines.push(b);
    }

    changedLines.push(lines[i]);

    if (i === selectionEndLine) {
      changedLines.push(e);
    }
  }

  raw_md_text.value = changedLines.join('\n');
};
const insertCharAtLineStart = (char: string) => {
  const textareaDom = document.querySelector('textarea') as HTMLTextAreaElement
  if (!textareaDom) return

  const start = getLineNumber(textareaDom.value.substring(0, textareaDom.selectionStart))
  const end = getLineNumber(textareaDom.value.substring(0, textareaDom.selectionEnd))
  const textareaValue = textareaDom.value
  const lines = textareaValue.split('\n')
  const changedLines: string[] = []
  let addedCharCount = 0

  for (let i = 0; i < lines.length; i++) {
    if (i >= start && i <= end) {
      changedLines.push(char + lines[i])
      if (i === start || start === end) addedCharCount += char.length
    } else {
      changedLines.push(lines[i])
    }
  }

  raw_md_text.value = changedLines.join('\n')

  setTimeout(() => {
    textareaDom.selectionStart = textareaDom.selectionEnd =
      textareaDom.selectionStart + addedCharCount
  }, 100)
}

const getLineNumber = (text: string): number => {
  const newLineRegex = /\r\n|[\n\v\f\r\x85\u2028\u2029]/g
  const match = text.match(newLineRegex)
  return match ? match.length : 0
}

watch(last_edit_path, (last_edit_path) => {
  console.log('[DEBUG]: Reading file:' + toValue(last_edit_path))
  window.api
    .app_invoke('read', toValue(last_edit_path))
    .then((content: string) => {
      raw_md_text.value = content
    })
    .catch((error) => {
      console.error('Error when reading file', error)
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
        return '<pre class="hljs"><code>' + hljs.highlight(lang, str, true).value + '</code></pre>'
      } catch (__) {}
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
  }
})
  .use(emoji)
  .use(namedCodeBlocks)

const { mdAndUp } = useDisplay()

const raw_md_text = ref('')
const rendered_md_text = computed(() => {
  return md.render(raw_md_text.value).toString()
})

onMounted(() => {
  setInterval(() => {
    window.api.app_send('write', toValue(last_edit_path), toValue(raw_md_text))
  }, 100)

  addEventListener('keydown', (event) => {
    // When input
    switch (event.key) {
      case 'Tab':
        event.preventDefault()
        insert('\t', '')
        break
      case '(':
        event.preventDefault()
        insert('(', ')')
        break
      case '[':
        event.preventDefault()
        insert('[', ']')
        break
      case '{':
        event.preventDefault()
        insert('{', '}')
        break
      case '"':
        event.preventDefault()
        insert('"', '"')
        break
    }
  })
})
</script>

<template>
  <div id="wrapper">
    <v-sheet id="edit">
      <div>
        <v-icon :icon="mdiLanguageMarkdown"></v-icon>
        <v-btn-group variant="plain" density="compact">
          <v-btn
            v-for="(item, idx) in editButtons"
            density="compact"
            :value="idx"
            :key="idx"
            @click="item.action()"
          >
            <v-icon :icon="item.icon"></v-icon>
            <v-tooltip :text="item.name" activator="parent" location="bottom"></v-tooltip>
          </v-btn>
        </v-btn-group>
      </div>
      <v-textarea
        variant="outlined"
        v-model="raw_md_text"
        :autofocus="true"
        :auto-grow="true"
        :no-resize="true"
        id="textarea"
      >
      </v-textarea>
    </v-sheet>

    <v-sheet id="preview" v-if="mdAndUp">
      <v-icon :icon="mdiTextBox"></v-icon>
      <div v-html="rendered_md_text" id="preview-area"></div>
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
