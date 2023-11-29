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
  absolute_path: string,
  relative_path: string,
  dir_content?: FileItem[]
}


const defaultUserPreference : UserPreference = {
  last_edit_path: "Untitled",
  theme: "light"
}

const userConfigFileName = 'user_config.json'

const storage_path = path.join(app.getPath("documents"), app.name);
const user_preference_path = path.join(storage_path, userConfigFileName)
function init_storage() {
  try {
    fs.mkdirSync(storage_path, {recursive: true})
    if (!fs.existsSync(user_preference_path)) {
      fs.writeFileSync(user_preference_path, JSON.stringify(defaultUserPreference))
    }
    console.log('[DEBUG]: Running at ', storage_path);
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

function write_absolute(p: string, data: string) {
  try {
    fs.writeFileSync(p, data, {flag: 'w'})
  } catch(error) {
    console.error("Unable to write:", error);
  }
}
function move(oldPath: string, newPath: string) {
  oldPath = path.join(storage_path, oldPath);
  newPath = path.join(storage_path, newPath);
  try {
    fs.renameSync(oldPath, newPath);
  } catch (error) {
    console.error("Unable to move file:", error);
  }
}

function rename(oldPath: string, name: string) {
  oldPath = path.join(storage_path, oldPath);
  const newPath = path.join(path.dirname(oldPath), name)
  try {
    fs.renameSync(oldPath, newPath)
  } catch (error) {
    console.error(`Unable to rename ${oldPath}:`, error)
  }
}

function duplicate(p: string, destination: string) {
  p = path.join(storage_path, p)
  destination = path.join(storage_path, destination)
  try {
    fs.copyFileSync(p, destination)
  } catch (error) {
    console.error(`Unable to copy ${p} to ${destination}:`, error)
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
function read_dir_recursively(p: string) {
  const fileItems: FileItem[] = [];

  // 读取指定路径下的所有文件和目录
  const items = fs.readdirSync(p);

  for (let i = 0; i < items.length; i++) {
    const itemName = items[i];
    if (itemName === userConfigFileName) {
      continue;
    }
    const itemPath = path.join(p, itemName)
    const relativePath = path.relative(storage_path, path.join(p, itemName))
    const stats = fs.statSync(itemPath);

    const fileItem: FileItem = {
      name: itemName,
      absolute_path: itemPath,
      type: "File",
      relative_path: relativePath
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
  init_storage, loadUserPreference, saveUserPreference,
  read, write, remove, read_dir, write_absolute, rename,
  move, duplicate
}

export type {
  UserPreference, FileItem
}
