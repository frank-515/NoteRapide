import * as fs from 'fs'
import * as path from 'path'
import {app} from 'electron'
interface UserPreference {
  last_edit_path: string,
  theme: "light" | "dark"
}

interface FileItem {
  type: "File" | "Directory",
  name: string,
  path: string,
  dir_content?: FileItem[]
}


const defaultUserPreference : UserPreference = {
  last_edit_path: "Untitled",
  theme: "light"
}

const storage_path = path.join(app.getPath("documents"), app.name);
const user_preference_path = path.join(storage_path, 'user_config.json')
function init_storage() {
  try {
    fs.mkdirSync(storage_path, {recursive: true})
    if (!fs.existsSync(user_preference_path)) {
      fs.writeFileSync(user_preference_path, JSON.stringify(defaultUserPreference))
    }
  } catch (error) {
    console.error("Unable to init:", error);
  }
}

function loadUserPreference() : UserPreference {
  try {
    const json = fs.readFileSync(user_preference_path, {encoding: "utf-8"})
    return JSON.parse(json) as UserPreference
  } catch (error) {
    console.error("Load user preference:", error);
    return defaultUserPreference
  }
}

function saveUserPreference(config: UserPreference) {
  try {
    const json = JSON.stringify(config)
    fs.writeFileSync(user_preference_path, json)
  } catch (error) {
    console.error("Save user preference:", error);
  }
}

function read(p: string): string {
  p = path.join(storage_path, p)
  try {
    return fs.readFileSync(p).toString()
  } catch (error) {
    console.error("Unable to read file:", error);
    return ""
  }
}

function write(p: string, data: string) {
  p = path.join(storage_path, p)
  try {
    fs.writeFileSync(p, data, {flag: 'w'})
  } catch(error) {
    console.error("Unable to write:", error);
  }
}


function remove(p: string) {
  p = path.join(storage_path, p)
  try {
    fs.unlinkSync(p)
  } catch (error) {
    console.error("Unable to delete:", error);
  }
}

function read_dir(): FileItem[] {
  return read_dir_recursively(storage_path)
}
function read_dir_recursively(path) {
  const fileItems: FileItem[] = [];

  // 读取指定路径下的所有文件和目录
  const items = fs.readdirSync(path);

  for (let i = 0; i < items.length; i++) {
    const itemName = items[i];
    const itemPath = path + '/' + itemName;
    const stats = fs.statSync(itemPath);

    const fileItem: FileItem = {
      name: itemName,
      path: itemPath,
      type: "File"
    };

    // 如果是目录，则继续读取子目录和文件
    if (stats.isDirectory()) {
      fileItem.type = 'Directory';
      fileItem.dir_content = read_dir_recursively(itemPath);
    } else {
      fileItem.type = 'File';
    }

    fileItems.push(fileItem);
  }

  return fileItems;
}

export {
  storage_path, user_preference_path,
  init_storage, loadUserPreference, saveUserPreference, read, write, remove, read_dir
}

export type {
  UserPreference, FileItem
}
