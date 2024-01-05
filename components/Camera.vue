<script setup lang="ts">
import type { ScanResult } from 'qr-scanner-wechat'
import { scan } from 'qr-scanner-wechat'
import type { State } from '~/logic/types'

const props = defineProps<{
  state: State
}>()

const videoEl = ref<HTMLVideoElement>()
const canvasEl = ref<HTMLCanvasElement>()

const error = ref()
const isScanning = ref(false)

let stream: MediaStream | null = null

const state = computed(() => props.state.scanner)

const { devices } = useDevicesList({
  requestPermissions: true,
  constraints: {
    audio: false,
    video: true,
  },
})

const cameras = computed(() => devices.value.filter(i => i.kind === 'videoinput'))
const selectedCamera = ref(cameras.value[0]?.deviceId)
const result = ref<ScanResult>()
const count = ref(0)

watchEffect(() => {
  if (!selectedCamera.value)
    selectedCamera.value = cameras.value[0]?.deviceId
})

function dispose() {
  isScanning.value = false
  stream?.getTracks().forEach(track => track.stop())
  stream = null
}

function display() {
  dispose()

  navigator.mediaDevices
    .getUserMedia({
      audio: false,
      video: {
        width: 512,
        height: 512,
        deviceId: selectedCamera.value,
      },
    })
    .then((_stream) => {
      stream = _stream

      videoEl.value!.srcObject = stream
      videoEl.value!.play()

      start()
    })
    .catch((e) => {
      error.value = e
    })
}

watch(() => selectedCamera.value, (v) => {
  if (v)
    display()
})

async function scanFrame() {
  if (!isScanning.value)
    return
  count.value += 1
  const canvas = canvasEl.value!
  canvas.width = videoEl.value!.videoWidth
  canvas.height = videoEl.value!.videoHeight
  const ctx = canvas.getContext('2d')!
  ctx.filter = [
    state.value.grayscale ? 'grayscale(1)' : '',
    `contrast(${state.value.contrast / 100})`,
    `brightness(${state.value.brightness / 100})`,
    `blur(${state.value.blur}px)`,
  ].filter(Boolean).join(' ')
  ctx.drawImage(videoEl.value!, 0, 0, canvas.width, canvas.height)
  try {
    result.value = await scan(canvas)
    // eslint-disable-next-line no-console
    console.log('Scan result', result.value)
    if (result.value?.text) {
      videoEl.value?.pause()
      isScanning.value = false
      return
    }
  }
  catch (e) {
    console.error(e)
  }

  setTimeout(scanFrame, state.value.cameraSampleDelay)
}

function start() {
  if (!isScanning.value) {
    count.value = 0
    result.value = undefined
    videoEl.value?.play()
    isScanning.value = true
    scanFrame()
  }
}

onUnmounted(dispose)
</script>

<template>
  <SafariWarning />
  <div flex="~ col gap-2">
    <div border="~ base rounded" flex="~ col gap-2" p4>
      <!-- Camera -->
      <OptionItem title="摄像头" div>
        <OptionSelectGroup
          v-if="cameras.length"
          v-model="selectedCamera"
          :titles="cameras.map(i => i.label)"
          :options="cameras.map(i => i.deviceId)"
        />
        <div v-else>
          <!-- No camera founded -->
          未发现摄像头
        </div>
      </OptionItem>

      <template v-if="selectedCamera">
        <!-- View -->
        <OptionItem title="视图" div>
          <OptionSelectGroup
            v-model="state.cameraViewMode"
            :options="['oringal', 'processed']"
          />
        </OptionItem>
        <!-- Mirror -->
        <OptionItem title="镜像" div>
          <OptionCheckbox v-model="state.cameraMirror" />
        </OptionItem>
        <!-- Sample Delay             Delay for a few milesecond before scaning the next frame. Lower value indicates more frequent scans. -->
        <OptionItem
          title="采样延迟" description="扫描下一帧前的几毫秒延迟。数值越小，扫描越频繁。"
          @reset="state.cameraSampleDelay = 100"
        >
          <OptionSlider v-model="state.cameraSampleDelay" :min="50" :max="1000" :default="100" :step="10" unit="ms" />
        </OptionItem>

        <div border="t base" my1 />
        <!-- Grayscale -->
        <OptionItem title="灰度">
          <OptionCheckbox v-model="state.grayscale" />
        </OptionItem>
        <!-- Contrast -->
        <OptionItem title="对比度" @reset="state.contrast = 100">
          <OptionSlider v-model="state.contrast" :min="0" :max="1000" :default="100" :step="10" unit="%" />
        </OptionItem>
        <!-- Brightness -->
        <OptionItem title="亮度" @reset="state.brightness = 100">
          <OptionSlider v-model="state.brightness" :min="0" :max="1000" :default="100" :step="10" unit="%" />
        </OptionItem>
        <!-- Blur -->
        <OptionItem title="模糊">
          <OptionSlider v-model="state.blur" :min="0" :max="10" :step="0.05" unit="px" />
        </OptionItem>
      </template>
    </div>
    <div relative mxa aspect-ratio-1 max-w-full w-120 border="~ base rounded" of-hidden>
      <video
        ref="videoEl"
        autoplay muted playsinline
        aspect-ratio-1 w-full
        :class="state.cameraMirror ? 'scale-x--100' : ''"
      />
      <canvas
        v-show="state.cameraViewMode === 'processed'" ref="canvasEl"
        absolute bottom-0 left-0 right-0 top-0 aspect-ratio-1 w-full
        :class="state.cameraMirror ? 'scale-x--100' : ''"
      />
      <div absolute bottom-0 right-0 p2 text-sm font-mono op50>
        x{{ count }}
      </div>
      <div
        v-if="result?.text"
        absolute bottom-0 left-0 right-0 top-0 bg-green:20 text-green
        backdrop-blur-4 backdrop-brightness-50
        flex="~ gap-3 col items-center justify-center"
      >
        <div i-ri-checkbox-circle-fill text-3xl />
        <div font-mono>
          {{ result?.text }}
        </div>
        <button text-button @click="start()">
          <!-- Continue -->
          继续
        </button>
      </div>
    </div>
  </div>
</template>
