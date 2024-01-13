<script setup lang="ts">
import { defineEmits, defineProps, ref, toRefs, watch } from 'vue'
import type { Option } from '~/logic/CustomOption'

interface Props {
  options: Option[]
  value?: Option['value']
  placeholder?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['change'])

const selectedLabel = ref(props.value as Option['label'])
const selectedValue = ref(props.value as Option['value'])
const showOptions = ref(false)
const selectedOption = ref<Option | null>(null)

// 初始化时设置默认选中项（如果有）
onMounted(() => {
  if (props?.options.length) {
    if (props?.value) {
      props.options.forEach((option) => {
        if (option.value === props.value)
          selectedOption.value = option
      })
      if (selectedOption.value) {
        selectOption(selectedOption.value)
      }
      else if (!props.value) {
        // 如果没有匹配到任何选项且 value 为空，则清除已选中项
        selectOption({ label: '', value: '', checked: false })
      }
    }
  }
})
// 将prop转换为响应式引用以便观察其变化
const { options } = toRefs(props)

// 监听prop的变化
watch(options, (newValue, oldValue) => {
  if (newValue?.length) {
    let f = true
    newValue.forEach((option) => {
      if (props.value) {
        if (option.value === props.value) {
          selectOption(option)
          f = false
        }
      }
    })
    if (f)
      selectOption({ label: '', value: '' })
  } else {
    selectOption({ label: '', value: '' })
  }
})

function selectOption(option: Option) {
  selectedOption.value = option
  selectedValue.value = option.value
  selectedLabel.value = option.label
  emit('change', selectedOption)
}
function toggleDropdown() {
  showOptions.value = !showOptions.value
}
</script>

<template>
  <div class="relative" bg-base @click="toggleDropdown">
    <!-- 选择器输入框 -->
    <input
      v-model="selectedLabel"
      type="text"
      text-button
      readonly
      class="block w-full pr-4  placeholder-gray-500 rounded shadow-sm focus:outline-none focus:ring-#aaa3 focus:border-#aaa3 sm:text-sm cursor-pointer"
      :placeholder="placeholder"
    >

    <!-- 下拉箭头图标 -->
    <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
      <div :class="showOptions ? 'i-ri-arrow-up-s-line' : 'i-ri-arrow-down-s-line'" />
    </div>

    <!-- 下拉选项列表 -->
    <ul
      v-show="showOptions"
      bg-base
      border-box
      class="absolute z-10  w-full shadow-lg max-h-60 rounded-md text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
    >
      <li
        v-for="(option, index) in options"
        :key="option.value"
        class="cursor-pointer select-none relative py-1 pl-3 pr-9 hover:bg-active"
        :class="[{ 'rounded-t-md': index === 0 }, { 'rounded-b-md': index === options.length - 1 }]"
        @click="selectOption(option)"
        bg-secondary
      >
        {{ option.label }}
        <span
          v-if="option.value === selectedOption?.value"
          class="absolute inset-y-0 right-0 flex items-center pr-2 text-white"
          @click.stop
        >
          <!-- 选中状态图标，例如勾选标记 -->
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="white" class="w-5 h-5">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>

</style>
