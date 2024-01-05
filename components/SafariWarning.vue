<script setup lang="ts">
import { isIOS, isSafari } from '~/logic/state'
</script>

<template>
  <div v-if="isSafari" border="~ orange/60 rounded" bg-orange-5:10 px3 py2 text-sm text-orange>
    <!-- Due to the limitation of Safari, the preprocessing might not work on your browser. -->
    由于 Safari 浏览器的限制，预处理可能无法在您的浏览器上运行。

    <template v-if="isIOS">
      <!-- It seems you are on iOS. Unfortunately, all browsers on iOS are forced to use Safari as the engine. This feature might not work the best on your device. Try use a desktop browser or Android device instead. -->
      看来你使用的是 iOS 系统。不幸的是，iOS 上的所有浏览器都被迫使用 Safari 作为引擎。这一功能在您的设备上可能无法发挥最佳效果。请尝试使用台式机浏览器或安卓设备。
    </template>
    <template v-else>
      <!-- We recommend you to use Chromium-based browsers such as Chrome, Edge, or Brave to get the best experience. -->
      我们建议您使用基于 Chromium 的浏览器，如 Chrome、Edge 或 Brave，以获得最佳体验。
    </template>
  </div>
</template>
