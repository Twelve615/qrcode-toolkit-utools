<script setup lang="ts">
import { deepMerge } from '@antfu/utils'
import type { ScanResult } from 'qr-scanner-wechat'
import { scan } from 'qr-scanner-wechat'
import UtoolsPresetManagement from '~/components/UtoolsPresetManagement.vue'
import { sendParentEvent } from '~/logic/messaging'
import { dataUrlScannerUpload, defaultState, hasParentWindow, isLargeScreen, showGridHelper, storeIndex } from '~/logic/state'
import { view } from '~/logic/view'
import type { State } from '~/logic/types'
import { base64ToImageElement } from '~/logic/image'

defineProps<{
  index: number
}>()

const state = useLocalStorage<State>(
  `qrd-state-${storeIndex.value}`,
  defaultState(),
  {
    mergeDefaults(storageValue, defaults) {
      const result = deepMerge({}, defaults, storageValue)
      return result
    },
  },
)

// API for iframe communication
useEventListener(window, 'message', (event) => {
  const { data } = event
  if (typeof data !== 'string')
    return
  try {
    const json = JSON.parse(data)
    // eslint-disable-next-line no-console
    console.log('Message from parent window', json)
    if (json.source !== 'qrtoolkit-parent')
      return
    switch (json.event) {
      case 'setImage':
        hasParentWindow.value = true
        state.value.uploaded.image = json.data
        view.value = 'compare'
        break
      case 'setScannerImage':
        hasParentWindow.value = true
        dataUrlScannerUpload.value = json.data
        view.value = 'verify'
        break
      case 'init':
        hasParentWindow.value = true
        break
    }
  }
  catch (e) {
    console.error('Failed to parse message from parent window', e)
  }
})

// eslint-disable-next-line no-console
console.log('State', state.value)

const isFirst = ref(true)
const result = ref<ScanResult>()
onBeforeMount(() => {
  if (isFirst) {
    // 设置插件进入时所附带的值
    const aquGetEnterData = window.aquGetEnterData()
    if (aquGetEnterData) {
      if (aquGetEnterData?.type === 'over')
        state.value.qrcode.text = aquGetEnterData.payload
      if (aquGetEnterData?.type === 'img') {
        const base64ImageString = aquGetEnterData.payload
        // eslint-disable-next-line no-console
        console.log(base64ImageString)
        scanImg(base64ImageString)
        if (result.value?.text)
          state.value.qrcode.text = result.value.text
      }
    }
    isFirst.value = false
  }
})

// 临时解决不退出插件的情况下无法获取到选中文本的问题（fixme: 后续优化）
const useSelectText = ref('')
window.utools.onPluginEnter((aquGetEnterData: any) => {
  console.log('用户进入插件应用', aquGetEnterData.code, aquGetEnterData.type, aquGetEnterData.payload)
  // 设置插件进入时所附带的值
  if (aquGetEnterData) {
    if (aquGetEnterData.type === 'over') {
      console.log(`内部：${useSelectText.value}`)
      if (useSelectText.value !== aquGetEnterData.payload) {
        useSelectText.value = aquGetEnterData.payload
        state.value.qrcode.text = aquGetEnterData.payload
      }
    }
    if (aquGetEnterData?.type === 'img') {
      const base64ImageString = aquGetEnterData.payload
      // eslint-disable-next-line no-console
      console.log(base64ImageString)
      scanImg(base64ImageString)
      if (result.value?.text)
        state.value.qrcode.text = result.value.text
    }
  }
})

async function scanImg(base64ImageString: string) {
  try {
    const imageElement = await base64ToImageElement(base64ImageString)
    result.value = await scan(imageElement)
    // eslint-disable-next-line no-console
    console.log(`扫描结果：${result.value}`)
  }
  catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  // send message to parent window to let it know we're ready
  sendParentEvent('init', {})
})
</script>

<template>
  <div flex="~ gap-2 items-center wrap">
    <button
      flex="~ gap-1.5  items-center" text-button
      :class="view === 'generator' ? 'bg-secondary' : 'op50'"
      @click="view = 'generator'"
    >
      <div i-ri-qr-code-line />
      <!-- Generator -->
      生成器
    </button>
    <button
      flex="~ gap-1.5 items-center" text-button
      :class="view === 'compare' ? 'bg-secondary' : 'op50'"
      @click="view = 'compare'"
    >
      <div i-ri-compasses-2-line />
      <!-- Compare -->
      比较
    </button>
    <button
      flex="~ gap-1.5 items-center" text-button
      :class="view === 'verify' ? 'bg-secondary' : 'op50'"
      @click="view = 'verify'"
    >
      <div i-ri-qr-scan-2-line />
      <!-- Verify -->
      验证
    </button>
    <button
      flex="~ gap-1.5 items-center" text-button
      :class="view === 'camera' ? 'bg-secondary' : 'op50'"
      @click="view = 'camera'"
    >
      <div i-ri-camera-line />
      <!-- Camera -->
      相机
    </button>
    <div flex-auto />
    <!-- Utools预设管理 -->
    <UtoolsPresetManagement :state="state" />
  </div>

  <div v-show="view === 'generator'" w-full>
    <Generator :state="state" />
  </div>
  <div v-show="view === 'compare'" w-full>
    <!-- 移动设备不支持此应用程序。请尝试使用更大的屏幕。
    <div v-if="!isLargeScreen" flex px20 py50 text-center op50>
      This app is not supported on mobile devices. Please try with a bigger screen.
    </div>
    <Compare v-else :state="state" />
    -->
    <!-- 不再对小屏幕进行限制 -->
    <Compare :state="state" />
  </div>
  <div v-if="view === 'verify'" w-full>
    <Scanner :state="state" />
  </div>
  <div v-if="view === 'camera'" w-full>
    <Camera :state="state" />
  </div>
  <div v-if="view === 'credit'" w-full>
    <Credits />
  </div>

  <DialogGridAlign
    v-if="showGridHelper"
    v-model="showGridHelper"
    :state="state"
  />
</template>
