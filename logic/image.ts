export function imageDataToDataUrl(data: ImageData) {
  const canvas = document.createElement('canvas')
  canvas.width = data.width
  canvas.height = data.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(data, 0, 0)
  return canvas.toDataURL()
}

export function getAverageColor(data: ImageData): [number, number, number, number] {
  let r = 0
  let g = 0
  let b = 0
  let a = 0

  for (let i = 0; i < data.data.length; i += 4) {
    r += data.data[i]
    g += data.data[i + 1]
    b += data.data[i + 2]
    a += data.data[i + 3]
  }

  const count = data.data.length / 4

  r = Math.round(r / count)
  g = Math.round(g / count)
  b = Math.round(b / count)
  a = Math.round(a / count)

  return [r, g, b, a]
}

export function rgbaToHex(r: number, g: number, b: number, a: number) {
  return `#${[r, g, b, a].map(c => c.toString(16).padStart(2, '0')).join('')}`
}

export async function base64ToImageElement(base64String: string): Promise<HTMLImageElement> {
  // 创建一个blob对象
  const blob = await new Promise<Blob>((resolve) => {
    const binaryString = window.atob(base64String.split(',')[1])
    const arrayBuffer = new ArrayBuffer(binaryString.length)
    const uint8Array = new Uint8Array(arrayBuffer)

    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }

    resolve(new Blob([uint8Array], { type: 'image/png' }))
  })

  // 创建一个指向blob的URL
  const imageUrl = URL.createObjectURL(blob)

  // 创建一个新的Image元素并设置其源为生成的URL
  const imageElement = new Image()
  imageElement.src = imageUrl

  // 添加加载完成的监听器，确保图片已经加载完成
  return new Promise<HTMLImageElement>((resolve, reject) => {
    imageElement.onload = () => {
      resolve(imageElement)
    }
    imageElement.onerror = (error) => {
      URL.revokeObjectURL(imageUrl)
      reject(error)
    }
  })
}
