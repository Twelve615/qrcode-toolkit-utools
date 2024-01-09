<script setup lang="ts">
import { type PropType, defineProps, ref } from 'vue'

// 定义 Props
const props = defineProps({
  onCancel: {
    type: Function as PropType<() => void>,
    default: () => () => {
    },
  },
  onConfirm: {
    type: Function as PropType<() => void>,
    default: () => () => {
    },
  },
  cancelButtonText: {
    type: String,
    default: '取消',
  },
  confirmButtonText: {
    type: String,
    default: '确定',
  },
  // 示例：自定义按钮类名
  cancelButtonClass: {
    type: [String, Array, Object] as PropType<string | string[] | object>,
    default: '',
  },
  confirmButtonClass: {
    type: [String, Array, Object] as PropType<string | string[] | object>,
    default: '',
  },
  visible: {
    type: Boolean,
    default: false,
  },
})

// defineEmits(['update:visible'])

// 确认按钮的点击事件处理函数（从props中获取）
function handleConfirm() {
  props.onConfirm()
}

// 取消按钮的点击事件处理函数（从props中获取）
function onCancel() {
  props.onCancel()
}
</script>

<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 mt--5 overflow-y-auto bg-black bg-opacity-40"
    >
      <div class="min-h-screeh px-4 text-center" >
        <!-- 弹窗内容区域 -->
        <div
          class="relative mx-auto my-8 max-w-lg p-6 shadow-md "
          bg-base
          bg-secondary
          border-box
        >
          <slot name="header">标题区域（默认标题）</slot>
          <div class="mt-4">
            <!-- 自定义内容区域 -->
            <slot />
          </div>
          <!-- 操作按钮区域 -->
          <div class="mt-6 flex justify-end space-x-4">
            <button
              :class="cancelButtonClass"
              text-button
              @click="onCancel"
            >
              {{ cancelButtonText }}
            </button>
            <button
              :class="confirmButtonClass"
              text-button
              @click="onConfirm"
            >
              {{ confirmButtonText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
/* 这里可以添加额外的样式或引入UnoCSS类 */
</style>
