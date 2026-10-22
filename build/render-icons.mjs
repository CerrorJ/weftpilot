import { app, BrowserWindow, nativeImage } from 'electron'
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'

// 仅将仓库原创SVG栅格化为平台图标，不调用设计服务或下载品牌素材。
const directory = resolve(process.argv[2])
mkdirSync(directory, { recursive: true })
// 构建辅助浏览器的缓存也限定到独立暂存目录，不使用真实产品userData。
app.setPath('userData', join(directory, 'renderer-data'))
app
  .whenReady()
  .then(async () => {
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
      },
    })
    await window.loadURL(
      'data:text/html,<meta charset="utf-8"><title>WeftPilot icon renderer</title>',
    )
    const source = `data:image/svg+xml;base64,${readFileSync('assets/brand/app-icon.svg').toString('base64')}`
    // canvas显式等待SVG解码，避免隐藏窗口首次合成帧尚不存在时capturePage报UnknownVizError。
    const data = await window.webContents.executeJavaScript(
      `(${rasterize.toString()})(${JSON.stringify(source)})`,
    )
    const image = nativeImage.createFromDataURL(data)
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

async function rasterize(source) {
  const image = new Image()
  image.src = source
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const context = canvas.getContext('2d')
  if (!context) throw new Error('图标canvas不可用')
  context.drawImage(image, 0, 0, 1024, 1024)
  return canvas.toDataURL('image/png')
}
