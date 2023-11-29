<script lang="ts" setup>
import {
  mdiCheckBold,
  mdiCog,
  mdiMinus,
  mdiPlus,
  mdiExportVariant,
  mdiPencil,
  mdiDelete,
  mdiContentCopy, mdiLanguageMarkdown, mdiFilePdfBox
} from "@mdi/js";
import { computed, onMounted, ref, toValue } from "vue";
import Editor from './components/Editor.vue'
import { useUserStore } from './userStore'
import { storeToRefs } from 'pinia'
import { FileItem } from "../../main/localfile";
import { mdiChevronDown } from "@mdi/js/commonjs/mdi";
import html2canvas from "html2canvas";
import JsPDF from 'jspdf';

const userStore = useUserStore()
const { last_edit_path } = storeToRefs(userStore)
const statusBarActionList = [
  {name: 'Exit', action: () => {api.close()}},
  {name: 'Font', action: () => {}},
  {name: 'Plug-ins', action: () => {
    snapPDF()
    }}
];

const exportOptions = [
  {name: 'MD', icon: mdiLanguageMarkdown, action: () => {
    onExport()
    }},
  {name: 'PDF', icon: mdiFilePdfBox, action: () => {
    if (document.getElementById('preview-area')) {
      snapPDF();
    } else {
      // Hint user to expand page or something else...
    }
  }}
]



const fileListActionList = [
  {name: 'Rename', icon: mdiPencil ,action: (index: number) => {
    }},
  {name: 'Delete', icon: mdiDelete ,action: (index: number) => {
    const filePath = fileList.value[index].relative_path;
    // Switch opening file before delete, If not, File will be created again
    if (filePath === toValue(last_edit_path)) {
      if (fileList.value.length >= 2) {
        last_edit_path.value = index == 0 ?
          fileList.value[1].relative_path : fileList.value[0].relative_path
      } else {
        // If there is non file in list, use default value
        last_edit_path.value = '/Untitled'
      }
    }
    api.app_send('remove', filePath);
    updateSideList()
    }},
  {name: 'Duplicate', icon: mdiContentCopy, action: (index: number) => {
    const filePath = fileList.value[index].relative_path;
    api.app_send('duplicate', filePath , filePath + '(copy)');
    updateSideList()
    }}
]


interface FileItem {
  type: "File" | "Directory",
  name: string,
  absolute_path: string,
  relative_path: string,
  dir_content?: FileItem[]
}


const fileList = ref<FileItem[]>([])
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

// From https://www.cnblogs.com/lizhao123/p/15136159.html
const snapPDF = () => {
  console.log(document.querySelector('#preview-area'));
  const domElement = document.getElementById('preview-area')!;
  html2canvas(domElement, {
    allowTaint: true,
    useCORS: true
  })
    .then((canvas) => {
      const contentWidth = canvas.width;
      const contentHeight = canvas.height;
      //一页pdf显示html页面生成的canvas高度;
      const pageHeight = contentWidth / 592.28 * 841.89;
      //未生成pdf的html页面高度
      let leftHeight = contentHeight;
      //页面偏移
      let position = 0;
      //a4纸的尺寸[595.28,841.89]，html页面生成的canvas在pdf中图片的宽高
      const margin = 15;
      const imgWidth = 595.28 - margin;
      const imgHeight = 595.28/contentWidth * contentHeight - margin;
      const pageData = canvas.toDataURL('image/jpeg', 1.0);
      console.log(pageData);
      const pdf = new JsPDF('p', 'pt', 'a4');
      //有两个高度需要区分，一个是html页面的实际高度，和生成pdf的页面高度(841.89)
      //当内容未超过pdf一页显示的范围，无需分页
      if (leftHeight < pageHeight) {
        //在pdf.addImage(pageData, 'JPEG', 左，上，宽度，高度)设置在pdf中显示；
        pdf.addImage(pageData, 'JPEG', margin ,margin, imgWidth, imgHeight);
        // pdf.addImage(pageData, 'JPEG', 20, 40, imgWidth, imgHeight);
      } else {    // 分页
        while(leftHeight > 0) {
          pdf.addImage(pageData, 'JPEG', 0, position, imgWidth, imgHeight);
          leftHeight -= pageHeight;
          position -= 841.89;
          //避免添加空白页
          if(leftHeight > 0) {
            pdf.addPage();
          }
        }
      }
      //可动态生成
      pdf.save("output.pdf");
    })
    .catch((error) => {
      console.error("Unable to generate PDF document: ", error);
    })
}

const updateSideList = () => {
  api.app_invoke('list')
    .then((list: FileItem[]) => {
      fileList.value = list.filter((f) => f.type === "File")
    })
}

const drawerItem = computed(() => {
  return fileList.value.map((item) => {
    let lastDotIndex = item.name.lastIndexOf('.')
    return lastDotIndex > -1 ? item.relative_path.slice(0, lastDotIndex)
      : item.relative_path
  })
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

const onExport = () => {
  let content = api.app_invoke('read', toValue(last_edit_path))
    .then((content: string) => {
      api.app_send('saveTo', content)
    })
    .catch((err) => {
      console.error("Unable to save: ", err);
    })

}

const onEnter = () => {
  if (newNoteName.value.length == 0) {
    return
  }
  last_edit_path.value = newNoteName.value
  // Create new file first
  api.app_send('write', toValue(last_edit_path), '')
  // drawerItem.value.push(newNoteName.value)
  updateSideList()
  newNoteName.value = ''
  newNoteDisplay.value = false
}

const onClickDocument = (index: number) => {
  last_edit_path.value = fileList.value[index].relative_path
}

onMounted(() => {
  userStore.loadUserPreference()
  setInterval(() => {
    updateSideList()
  }, 1000)
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
        <v-icon :icon="mdiExportVariant"></v-icon>
        <v-menu activator="parent">
          <v-list>
            <v-list-item v-for="(item, idx) in exportOptions"
                         :key="idx" :value="idx" @click="item.action()">
              <v-icon :icon="item.icon"></v-icon>
              {{item.name}}
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
      <v-btn icon>
        <v-icon :icon="mdiCog"></v-icon>
        <v-menu activator="parent">
          <v-list nav>
            <v-list-item v-for="(item, idx) in statusBarActionList"
                         :key="idx" :value="idx" @click="item.action()">
              {{ item.name }}
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer">
      <v-list nav>
        <v-list-item v-for="(item, drawerIdx) in drawerItem"
                     :value="drawerIdx" :key="drawerIdx" @click="onClickDocument(drawerIdx)">
          <template #title>
            {{ item }}
          </template>
          <template #append>
            <v-btn icon variant="plain" density="compact">
              <v-icon :icon="mdiChevronDown"></v-icon>
              <v-menu activator="parent">
                <v-btn-group>
                  <v-btn v-for="(item, idx) in fileListActionList" variant="elevated"
                         :value="idx" :key="idx" @click="item.action(drawerIdx)"
                  >
                    <v-icon size="large" :icon="item.icon"></v-icon>
                  </v-btn>
                </v-btn-group>
              </v-menu>
            </v-btn>
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
