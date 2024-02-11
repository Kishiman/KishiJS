
import { config } from "../config";
import fs from 'fs';
const { logPath } = config

export class FileLogger {
  key: string
  filepath: string
  constructor(key: string) {
    this.key = key
    this.filepath = `${logPath}/${key}.log`
    fs.writeFileSync(this.filepath, '')
  }
  log(...data: any[]) {
    fs.appendFileSync(this.filepath, `[${new Date().toISOString()}] [LOG]\t${data}\n`)
  }
  warn(...data: any[]) {
    fs.appendFileSync(this.filepath, `[${new Date().toISOString()}] [WARN]\t${data}\n`)
  }
  error(error: any) {
    if (error.message)
      fs.appendFileSync(this.filepath, `[${new Date().toISOString()}] [ERROR]\t${error.message}\n`)
    fs.appendFileSync(this.filepath, `[${new Date().toISOString()}] [ERROR]\t${error?.stack || new Error().stack}\n`)
  }
}