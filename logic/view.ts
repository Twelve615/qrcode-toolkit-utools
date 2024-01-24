export const view = ref<'generator' | 'compare' | 'credit' | 'verify' | 'camera'>(location.hash.slice(1) as any || 'generator')

// @ts-expect-error back
if (view.value === 'scan')
  view.value = 'verify'

if (!['generator', 'compare', 'credit', 'verify', 'camera'].includes(view.value))
  view.value = 'generator'

// 这将会导致：Page not found 404
// watchEffect(() => {
//   location.hash = view.value
// })
