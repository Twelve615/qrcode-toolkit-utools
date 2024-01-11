<script lang="ts" setup>
import { defineProps, ref } from 'vue'
import type { Option } from '~/logic/CustomOption'
import type { State } from '~/logic/types'
import type { UtoolsData } from '~/logic/UtoolsData'

interface Props {
  state: State
}

const props = defineProps<Props>()
const { $toast } = useNuxtApp()
const state = computed(() => props.state.qrcode)

const optionsExample: Ref<Option[]> = ref([])
let selectData: Option = {
  value: '',
  label: '',
  checked: false,
}
const defPreset: Ref<Option['value']> = ref('')
// 新增与修改弹窗
const isUpdateModalVisible = ref(false)
const updateModalTitle = ref('标题')
const updateTitle = ref('')

onBeforeMount(() => {
  initOption()
})

function initOption() {
  optionsExample.value = window.aquAllOption()
  if (optionsExample.value.length > 0) {
    optionsExample.value.forEach((item: Option) => {
      if (item.checked) {
        defPreset.value = item.value
      }
    })
  }
}

function copVueObj(obj: any) {
  if (obj === null || typeof obj !== 'object')
    return obj
  const clone: any = Array.isArray(obj) ? [] : {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key))
      clone[key] = copVueObj(obj[key])
  }

  return clone
}
function setState(data: any) {
  const keys = Object.keys(data)
  for (const key of keys) {
    if (key in data)
      // @ts-expect-error anyway
      state.value[key] = data[key]
  }
}
function changSelect(option: Option) {
  const selOption = copVueObj(option.value)
  // 获取预设
  const utoolsData: UtoolsData = window.aquGet(selOption.value)
  if (utoolsData) {
    setState(utoolsData.data)
    const cur: Option = {
      value: '',
      label: '',
    }
    selectData = Object.assign(cur, option.value)
  }
}

// 新增
function addPreset(label: string) {
  return window.aquAdd(label, copVueObj(state.value))
}
// 修改
function updatePreset(label: string) {
  return window.aquUpdate(label, copVueObj(state.value))
}
// 保存
function savePreset() {
  const res = window.aquSave(copVueObj(state.value))
  if (!res.ok)
    $toast.error(res.message)
  else
    $toast.success('保存成功')
  initOption()
}
// 删除
function removePreset() {
  const res = window.aquRemove(copVueObj(selectData.value))
  if (res!.ok) {
    state.value.aquValue = undefined
    state.value.aquLabel = undefined
    updateTitle.value = ''
    selectData.label = ''
    selectData.value = ''
    $toast.success('删除成功')
  }
  initOption()
}
// 设为默认
function setDef() {
  const res = window.aquSetDef(copVueObj(state.value))
  if (res!.ok)
    $toast.success('设置成功')
  else
    $toast.error(res.message)
  initOption()
}

function openUpdateModal(title: string) {
  if (selectData && title === '修改预设') {
    updateTitle.value = selectData.label
    if (!selectData.value) {
      $toast.error('当前没有选中的预设')
      return
    }
  }
  else
    updateTitle.value = ''
  updateModalTitle.value = title
  isUpdateModalVisible.value = true
}
function handleCancel() {
  // 在这里执行关闭操作
  isUpdateModalVisible.value = false
}

function handleConfirm() {
  // 在这里执行保存操作
  if (updateModalTitle.value === '修改预设') {
    const res = updatePreset(updateTitle.value)
    if (res.ok)
      $toast.success('修改成功')
    else
      $toast.error(res.message)
  }
  if (updateModalTitle.value === '新建预设') {
    const res = addPreset(updateTitle.value)
    if (res.ok)
      $toast.success('新建成功')
    else
      $toast.error(res.message)
  }
  initOption()
  handleCancel()
}
</script>

<template>
  <div flex="~ gap-2 items-center wrap">
    <button flex="~ gap-2 items-center" text-sm icon-button title="设置当前为默认(下次打开时直接使用此配置)" @click="setDef">
      <i i-ri-magic-line />
    </button>
    <CustomSelect :options="optionsExample" :value="defPreset" placeholder="请选择预设" @change="changSelect" />
    <button flex="~ gap-2 items-center" text-sm icon-button title="保存预设" @click="savePreset">
      <i i-ri-save-3-fill />
    </button>
    <button flex="~ gap-2 items-center" text-sm icon-button title="编辑预设" @click="openUpdateModal('修改预设')">
      <i i-ri-edit-line />
    </button>
    <button flex="~ gap-2 items-center mr5" text-sm icon-button title="删除预设" @click="removePreset">
      <i i-ri-delete-bin-2-line />
    </button>
    <button flex="~ gap-2 items-center" text-sm icon-button title="新建预设" @click="openUpdateModal('新建预设')">
      <i i-ri-add-line />
    </button>

    <CustomModal :visible="isUpdateModalVisible" :on-cancel="handleCancel" :on-confirm="handleConfirm" cancel-button-text="关闭" confirm-button-text="保存">
      <template #header>
        {{ updateModalTitle }}
      </template>
      <input
        v-model="updateTitle"
        type="text"
        text-button
        class="block w-full pr-4  placeholder-gray-500 rounded shadow-sm focus:outline-none focus:ring-#aaa3 focus:border-#aaa3 sm:text-sm"
        placeholder="请输入预设名称"
      >
    </CustomModal>
  </div>
</template>

<style scoped>

</style>
