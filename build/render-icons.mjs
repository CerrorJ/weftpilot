import { app, BrowserWindow } from 'electron'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'

// 仅将仓库原创SVG栅格化为平台图标，不调用设计服务或下载品牌素材。
app
  .whenReady()
  .then(async () => {
    const directory = resolve(process.argv[2])
    mkdirSync(directory, { recursive: true })
    const window = new BrowserWindow({
      show: false,
      width: 1024,
      height: 1024,
      useContentSize: true,
      backgroundColor: '#00000000',
      transparent: true,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        offscreen: true,
      },
    })
    await window.loadURL(pathToFileURL(resolve('assets/brand/app-icon.svg')).href)
    const image = await window.webContents.capturePage()
    if (image.isEmpty()) throw new Error('原创SVG图标栅格化失败')
    writeFileSync(join(directory, 'icon.png'), image.resize({ width: 1024, height: 1024 }).toPNG())
    const png = image.resize({ width: 256, height: 256 }).toPNG()
    const header = Buffer.alloc(22)
    header.writeUInt16LE(1, 2)
    header.writeUInt16LE(1, 4)
    header.writeUInt16LE(1, 10)
    header.writeUInt16LE(32, 12)
    header.writeUInt32LE(png.length, 14)
    header.writeUInt32LE(22, 18)
    writeFileSync(join(directory, 'icon.ico'), Buffer.concat([header, png]))
    window.destroy()
    app.quit()
  })
  .catch((error) => {
    console.error(error.message)
    app.exit(1)
  })
