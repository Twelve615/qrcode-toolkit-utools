<script setup lang="ts">
import { debounce } from 'perfect-debounce'
import { sendParentEvent } from '~/logic/messaging'
import { generateQRCode } from '~/logic/generate'
import { dataUrlGeneratedQRCode, defaultGeneratorState, generateQRCodeInfo, hasParentWindow, isLargeScreen, qrcode } from '~/logic/state'
import { view } from '~/logic/view'
import type { State } from '~/logic/types'
import { MarkerSubShapeIcons, MarkerSubShapes, PixelStyleIcons, PixelStyles } from '~/logic/types'
import { getAspectRatio, sendQRCodeToCompare } from '~/logic/utils'

const props = defineProps<{
  state: State
}>()

const rightPanelEl = ref<HTMLElement>()
const uploadTarget = ref<'image' | 'qrcode'>()
const state = computed(() => props.state.qrcode)
const rightPanelRect = reactive(useElementBounding(rightPanelEl))
const floating = computed(() => rightPanelRect.top < 10 && isLargeScreen.value)

const canvas = ref<HTMLCanvasElement>()

async function run() {
  if (!canvas.value)
    return
  await generateQRCode(canvas.value, state.value)
  dataUrlGeneratedQRCode.value = canvas.value.toDataURL()
}

function download() {
  if (!canvas.value)
    return
  const a = document.createElement('a')
  a.href = dataUrlGeneratedQRCode.value!
  a.download = `${state.value.text.replace(/\W/g, '_')}[${state.value.ecc}_x${state.value.scale}].png`
  a.click()
}

function reset() {
  // eslint-disable-next-line no-alert
  // Are you sure to reset all state?
  if (confirm('您确定重置所有状态吗？'))
    Object.assign(state.value, defaultGeneratorState())
}

function downloadState() {
  const data = {
    '//': 'Generator state of Anthony\'s QR Toolkit https://qrcode.antfu.me/',
    ...state.value,
  }

  const text = JSON.stringify(data, null, 2)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  a.download = `qr-options-${state.value.text.replace(/\W/g, '_')}.json`
  a.click()
}

async function readState(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file)
    return

  const reader = new FileReader()
  const promise = new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      resolve(reader.result as any)
    }
    reader.onerror = reject
  })
  reader.readAsText(file)
  const text = await promise
  try {
    const data = JSON.parse(text)
    // eslint-disable-next-line no-alert
    // Are you sure to override the state with file uploaded?
    if (confirm('您确定使用上传的文件覆盖状态吗？')) {
      const keys = Object.keys(state.value)
      for (const key of keys) {
        if (key in data)
          // @ts-expect-error anyway
          state.value[key] = data[key]
      }
    }
  }
  catch (e) {
    // eslint-disable-next-line no-alert
    // Invalid JSON file
    alert('无效的JSON文件')
  }
}

const debouncedRun = debounce(run, 250, { trailing: true })

const mayNotScannable = computed(() => {
  if ((state.value.marginNoise || state.value.backgroundImage) && state.value.marginNoiseSpace === 'none')
    return true
  if (state.value.effect === 'crystalize' && state.value.effectCrystalizeRadius / state.value.scale > 0.4)
    return true
  if (
    state.value.effect === 'liquidify'
    && (
      (state.value.effectLiquidifyRadius / state.value.scale > 0.4)
      || (Math.abs(state.value.effectLiquidifyThreshold - 128) > 32)
    )
  )
    return true
  if (state.value.markerShape === 'tiny-plus')
    return true
  if (!['square', 'circle', 'box'].includes(state.value.markerSub))
    return true
  if (Math.abs(state.value.transformPerspectiveX) > 0.1 || Math.abs(state.value.transformPerspectiveY) > 0.1)
    return true
  if (state.value.transformScale > 1.05)
    return true
})

const hasNonCenteredMargin = computed(() => {
  if (typeof state.value.margin === 'number')
    return false
  return state.value.margin.top !== state.value.margin.bottom
    || state.value.margin.left !== state.value.margin.right
})

function sendCompare() {
  sendQRCodeToCompare(props.state)
  view.value = 'compare'
}

function sendToWebUI() {
  sendParentEvent('setControlNet', dataUrlGeneratedQRCode.value!)
}

function toggleMarkerStyleExpand() {
  if (!props.state.qrcode.markers?.length) {
    props.state.qrcode.markers = [
      {
        markerShape: props.state.qrcode.markerShape,
        markerStyle: props.state.qrcode.markerStyle,
        markerInnerShape: props.state.qrcode.markerInnerShape,
      },
      {
        markerShape: props.state.qrcode.markerShape,
        markerStyle: props.state.qrcode.markerStyle,
        markerInnerShape: props.state.qrcode.markerInnerShape,
      },
    ]
  }
  else {
    props.state.qrcode.markers = []
  }
}

const uploadQR = ref<string>()

const { isOverDropZone } = useDropZone(document.body, {
  onDrop(files) {
    if (view.value !== 'generator')
      return
    if (!files || !uploadTarget.value)
      return

    const file = files[0]
    if (file.type === 'image/png' || file.type === 'image/jpeg') {
      const reader = new FileReader()
      reader.onload = () => {
        const data = reader.result as string
        if (uploadTarget.value === 'qrcode')
          uploadQR.value = data
      }
      reader.readAsDataURL(file)
    }
  },
  onLeave() {
    uploadTarget.value = undefined
  },
  onOver(_, event) {
    if (uploadQR.value)
      uploadQR.value = undefined
    if (view.value !== 'generator')
      return
    if (!isOverDropZone.value)
      return

    const chain = Array.from(document.elementsFromPoint(event.clientX, event.clientY))
    if (chain.find(el => el.id === 'upload-zone-qrcode'))
      uploadTarget.value = 'qrcode'
    else
      uploadTarget.value = undefined
  },
})

watch(
  () => state.value,
  () => debouncedRun(),
  { deep: true, immediate: true },
)
</script>

<template>
  <!-- 移除 lt-lg="flex flex-col-reverse" 这会使窗口较小时二维码占整个窗口 -->
  <div grid="~ cols-[38rem_1fr] gap-2" >
    <div flex="~ col gap-2">
      <!-- Text to encode -->
      <textarea
        v-model="state.text"
        placeholder="要编码的文本"
        border="~ base rounded"
        bg-secondary px4 py2
      />
      <div border="~ base rounded" flex="~ col gap-2" p4>
        <!-- Error Correction -->
        <OptionItem title="误差纠正" div>
          <OptionSelectGroup
            v-model="state.ecc"
            :options="['L', 'M', 'Q', 'H']"
          />
          <label flex="~ gap-2 items-center" ml2>
            <OptionCheckbox v-model="state.boostECC" />
            <!-- Boost ECC -->
            <span text-sm op75>提升 ECC</span>
          </label>
        </OptionItem>
        <!-- Mask Pattern -->
        <OptionItem title="蒙版样式">
          <OptionSelectGroup
            v-model="state.maskPattern"
            :options="[-1, 0, 1, 2, 3, 4, 5, 6, 7]"
            :titles="['Auto']"
          />
        </OptionItem>
        <!-- Rotate -->
        <OptionItem title="旋转" div>
          <OptionSelectGroup
            v-model="state.rotate"
            :options="[0, 90, 180, 270]"
            :titles="['0°', '90°', '180°', '270°']"
          />
        </OptionItem>

        <div border="t base" my1 />
        <!-- Pixel Style -->
        <OptionItem title="像素样式">
          <OptionSelectGroup
            v-model="state.pixelStyle"
            :options="PixelStyles"
            :classes="PixelStyleIcons"
          />
        </OptionItem>
        <!-- 'Marker 1' : 'Markers' -->
        <OptionItem :title="state.markers.length ? '标记 1' : '标记'">
          <div flex-auto />
          <button
            icon-button-sm
            title="Toggle Expand"
            @click="toggleMarkerStyleExpand"
          >
            <div :class="state.markers.length ? 'i-ri-arrow-up-s-line' : 'i-ri-arrow-down-s-line'" />
          </button>
        </OptionItem>

        <template v-if="!state.markers.length">
          <!-- Marker -->
          <SettingsMarkerStyle :state="state" nested number="标记" />
        </template>
        <template v-else>
          <SettingsMarkerStyle :state="state" nested />
          <!-- Marker 2 -->
          <OptionItem title="标记 2" />
          <SettingsMarkerStyle :state="state.markers[0]" nested />
          <!-- Marker 3 -->
          <OptionItem title="标记 3" />
          <SettingsMarkerStyle :state="state.markers[1]" nested />
          <div border="t base" my1 />
        </template>
        <!-- Sub Markers -->
        <OptionItem v-if="qrcode?.version !== 1" title="子标记">
          <OptionSelectGroup
            v-model="state.markerSub"
            :options="MarkerSubShapes"
            :classes="MarkerSubShapeIcons"
          />
        </OptionItem>

        <div border="t base" my1 />

        <SettingsMargin
          v-model="state.margin"
          :full-customizable="true"
        />
        <!-- Margin Noise -->
        <OptionItem title="边缘噪声" description="在边距添加一些随机数据点">
          <OptionCheckbox v-model="state.marginNoise" />
        </OptionItem>

        <template v-if="state.marginNoise">
          <!-- Noise Rate -->
          <OptionItem title="噪声比率" nested description="Percentage of whether a black point should be placed">
            <OptionSlider v-model="state.marginNoiseRate" :min="0" :max="1" :step="0.01" />
          </OptionItem>
          <!-- Opacity -->
          <SettingsRandomRange
            v-model="state.marginNoiseOpacity"
            title="不透明度"
            nested
            :min="0"
            :max="1"
            :step="0.01"
          />
        </template>
        <!-- Safe Space -->
        <OptionItem title="安全空间">
          <OptionSelectGroup
            v-model="state.marginNoiseSpace"
            :options="['full', 'marker', 'minimal', 'extreme', 'none']"
          />
        </OptionItem>
        <!-- Render Type -->
        <OptionItem title="渲染类型">
          <OptionSelectGroup
            v-model="state.renderPointsType"
            :options="['all', 'function', 'data', 'guide', 'marker']"
          />
        </OptionItem>
        <!-- Seed -->
        <OptionItem title="种子">
          <input
            v-model.number="state.seed" type="number"
            border="~ base rounded"
            bg-secondary py0.5 pl2 text-sm
          >
          <button
            p1 icon-button-sm
            title="Randomize"
            @click="state.seed = Math.round(Math.random() * 100000)"
          >
            <div i-ri-refresh-line />
          </button>
        </OptionItem>
        <!-- Background -->
        <OptionItem title="背景" div>
          <OptionColor v-if="state.backgroundImage?.startsWith('#')" v-model="state.backgroundImage" />
          <button v-else relative text-xs text-button>
            <img
              v-if="state.backgroundImage" :src="state.backgroundImage"
              absolute inset-0 z-0 h-full w-full rounded object-cover op50
            >
            <div i-ri-upload-line z-1 />
            <div z-1>
            <!-- Upload -->
              上传
            </div>
            <ImageUpload v-model="state.backgroundImage" />
          </button>
          <button v-if="state.backgroundImage" icon-button-sm title="Clear">
            <div i-carbon-close @click="state.backgroundImage = undefined" />
          </button>
          <div flex-auto />
          <button v-if="!state.backgroundImage" icon-button-sm title="Switch to Color">
            <div i-ri-paint-fill @click="state.backgroundImage = '#888888'" />
          </button>
        </OptionItem>

        <div border="t base" my1 />
        <!-- Colors -->
        <OptionItem title="颜色" div @reset="() => { state.lightColor = '#ffffff'; state.darkColor = '#000000' }">
          <div flex="~ gap-2">
            <OptionColor v-model="state.lightColor" />
            <OptionColor v-model="state.darkColor" />
            <label flex="~ gap-2 items-center" ml2>
              <OptionCheckbox v-model="state.invert" />
              <!-- Invert -->
              <span text-sm op75>反相</span>
            </label>
          </div>
        </OptionItem>

        <div border="t base" my1 />
        <!-- Min Version -->
        <OptionItem title="最低版本">
          <OptionSlider v-model="state.minVersion" :min="1" :max="state.maxVersion" :step="1" />
        </OptionItem>
        <!-- Max Version -->
        <OptionItem title="最高版本">
          <OptionSlider v-model="state.maxVersion" :min="state.minVersion" :max="40" :step="1" />
        </OptionItem>
        <!-- Pixel Size -->
        <OptionItem title="像素大小">
          <OptionSlider v-model="state.scale" :min="1" :max="50" :step="1" unit="px" />
        </OptionItem>

        <div border="t base" my1 />
        <!-- Effect -->
        <OptionItem title="效果">
          <OptionSelectGroup
            v-model="state.effect"
            :options="['none', 'crystalize', 'liquidify']"
          />
        </OptionItem>

        <template v-if="state.effect === 'crystalize'">
          <!-- Radius -->
          <OptionItem title="半径" nested>
            <OptionSlider v-model="state.effectCrystalizeRadius" :min="1" :max="20" :step="0.5" />
          </OptionItem>
        </template>
        <template v-if="state.effect === 'liquidify'">
          <!-- Distort Radius -->
          <OptionItem title="扭曲半径" nested>
            <OptionSlider v-model="state.effectLiquidifyDistortRadius" :min="1" :max="40" :step="1" />
          </OptionItem>
          <!-- Blur Radius -->
          <OptionItem title="模糊半径" nested>
            <OptionSlider v-model="state.effectLiquidifyRadius" :min="1" :max="40" :step="1" />
          </OptionItem>
          <!-- Threshold -->
          <OptionItem title="阈值" nested @reset="state.effectLiquidifyThreshold = 128">
            <OptionSlider v-model="state.effectLiquidifyThreshold" :min="1" :max="254" :step="1" unit="/256" />
          </OptionItem>
        </template>

        <template v-if="state.effect !== 'none'">
          <!-- Effect Timing -->
          <OptionItem title="效果时机">
            <OptionSelectGroup
              v-model="state.effectTiming"
              :options="['before', 'after']"
            />
          </OptionItem>
        </template>

        <div border="t base" my1 />
        <!-- Transform -->
        <OptionItem title="变换" />
        <!-- Perspective X -->
        <OptionItem title="透视 X" nested @reset="state.transformPerspectiveX = 0">
          <OptionSlider v-model="state.transformPerspectiveX" :min="-0.5" :max="0.5" :step="0.01" :default="0" />
        </OptionItem>
        <!-- Perspective Y -->
        <OptionItem title="透视 Y" nested @reset="state.transformPerspectiveY = 0">
          <OptionSlider v-model="state.transformPerspectiveY" :min="-0.5" :max="0.5" :step="0.01" :default="0" />
        </OptionItem>
        <!-- Scale -->
        <OptionItem title="比例" nested @reset="state.transformScale = 1">
          <OptionSlider v-model="state.transformScale" :min="0.5" :max="2" :step="0.01" :default="1" />
        </OptionItem>
      </div>
      <div flex="~ gap-2">
        <button
          text-sm op75 text-button hover:op100
          @click="downloadState()"
        >
          <div i-ri-download-2-line />
          <!-- Save state -->
          保存状态
        </button>
        <button

          relative text-sm op75 text-button hover:op100
        >
          <div i-ri-upload-2-line />
          <!-- Load state -->
          加载状态
          <input
            type="file" accept="application/json"
            absolute bottom-0 left-0 right-0 top-0 z-10
            max-h-full max-w-full cursor-pointer opacity-0.1
            @input="readState"
          >
        </button>
        <div flex-auto />
        <button
          text-sm op75 text-button hover:text-red hover:op100
          @click="reset()"
        >
          <div i-ri-delete-bin-6-line />
          <!-- Reset State -->
          重置状态
        </button>
      </div>
    </div>
    <div ref="rightPanelEl">
      <div
        flex="~ col gap-2"
        :style="floating ? {
          position: 'fixed',
          top: '10px',
          left: `${rightPanelRect.left}px`,
          width: `${rightPanelRect.width}px`,
        } : {}"
      >
        <canvas ref="canvas" w-full width="1000" height="1000" border="~ base rounded" />

        <div v-if="qrcode" border="~ base rounded" p3 pl6 pr0 flex="~ col gap-2">
          <div grid="~ gap-1 cols-6 items-center">
            <div text-sm op50>
              <!-- Size -->
              大小
            </div>
            <div>
              {{ qrcode.size }}
            </div>
            <div text-sm op50>
              <!-- Mask -->
              蒙版
            </div>
            <div>
              {{ qrcode.maskPattern }}
            </div>
            <div text-sm op50>
              <!-- Version -->
              版本
            </div>
            <div>
              {{ qrcode.version }}
            </div>
          </div>
          <div v-if="generateQRCodeInfo" grid="~ gap-1 cols-[1.5fr_2fr_1fr_1.5fr] items-center">
            <div text-sm op50>
              <!-- Dimension -->
              尺寸
            </div>
            <div text-sm>
              {{ generateQRCodeInfo.width }} x {{ generateQRCodeInfo.height }}
            </div>
            <div text-sm op50>
              <!-- Aspect -->
              比例
            </div>
            <div text-sm>
              {{ getAspectRatio(generateQRCodeInfo.width, generateQRCodeInfo.height) }}
            </div>
          </div>
        </div>
        <button
          py2 text-sm text-button
          @click="download()"
        >
          <div i-ri-download-line />
          <!-- Download -->
          下载
        </button>
        <button
          py2 text-sm text-button
          @click="sendCompare()"
        >
          <div i-ri-send-backward />
          <!-- Send to Compare -->
          发送到比较
        </button>
        <button
          v-if="hasParentWindow"
          py2 text-sm text-button
          @click="sendToWebUI()"
        >
          <div i-ri-file-upload-line />
          <!-- Send to ControlNet -->
          发送到 ControlNet
        </button>
        <div v-if="mayNotScannable" border="~ amber-6/60 rounded" bg-amber-5:10 px3 py2 text-sm text-amber-6>
          <!-- This QR Code may or may not be scannable. Please verify before using. -->
          这个二维码可能是可扫描的，也可能是不可扫描的。 使用前请验证。
        </div>
        <div v-if="hasNonCenteredMargin" border="~ yellow-6/60 rounded" bg-yellow-5:10 px3 py2 text-sm text-yellow-6>
          <!-- The <b>compare tab</b> does not support non-centered QR Code yet. If you generated with this QR Code, you'll need to verify the result manually. -->
          <b>比较选项卡</b>中不支持非剧中的二维码。 如果您使用此二维码生成，则需要手动验证结果。
        </div>
        <div v-if="state.transformPerspectiveX !== 0 || state.transformPerspectiveY !== 0 || state.transformScale !== 1" border="~ yellow-6/60 rounded" bg-yellow-5:10 px3 py2 text-sm text-yellow-6>
          <!-- The <b>compare tab</b> does not support transformations. If you generated with this QR Code, you'll need to verify the result manually. -->
          <b>比较选项卡</b>中不支持转换。 如果您使用此二维码生成，则需要手动验证结果。
        </div>
        <div v-if="state.renderPointsType !== 'all'" border="~ indigo/60 rounded" bg-indigo-5:10 px3 py2 text-sm text-indigo>
          <!-- This is a partial QR Code. It does <b>not</b> contain all the necessary data to be scannable. -->
          这是部分二维码。 它<b>不</b>包含可扫描的所有必要数据。
        </div>
      </div>

      <div my8 h-1px border="t base" w-10 lg:hidden />
    </div>
  </div>

  <div v-if="isOverDropZone" fixed bottom-0 left-0 right-0 top-0 z-200 flex bg-black:20 backdrop-blur-10>
    <div
      id="upload-zone-qrcode" flex="~ col gap-3 items-center justify-center" m10 ml-1 w-full op40
      :class="uploadTarget === 'qrcode' ? 'bg-gray:20 op100 border-base' : ''"
      border="3 dashed transparent rounded-xl"
    >
      <div i-carbon-qr-code text-20 />
      <div text-xl>
        <!-- Scan QR Code -->
        扫描二维码
      </div>
    </div>
  </div>

  <DialogScan
    v-if="uploadQR"
    :model-value="true"
    :qrcode="uploadQR"
    :state="props.state"
    @update:model-value="uploadQR = undefined"
  />
</template>
