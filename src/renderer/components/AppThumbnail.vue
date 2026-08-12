<template>
  <span class="thumbnail">
    <img v-if="source" :src="source" alt="" />
    <ImageIcon v-else aria-hidden="true" />
  </span>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Image as ImageIcon } from '@lucide/vue'
import { electron } from '@/electron'

const props = defineProps<{ path: string }>()
const source = ref('')
const thumbnailSize = 76
let active = true

const createStaticThumbnail = async (preview: string) => {
  const image = new Image()
  image.src = preview
  await image.decode()

  const sourceWidth = image.naturalWidth
  const sourceHeight = image.naturalHeight
  if (!sourceWidth || !sourceHeight) throw new Error('Invalid thumbnail source')

  const scale = Math.max(
    thumbnailSize / sourceWidth,
    thumbnailSize / sourceHeight
  )
  const cropWidth = thumbnailSize / scale
  const cropHeight = thumbnailSize / scale
  const cropX = (sourceWidth - cropWidth) / 2
  const cropY = (sourceHeight - cropHeight) / 2
  const canvas = document.createElement('canvas')
  canvas.width = thumbnailSize
  canvas.height = thumbnailSize
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Thumbnail canvas is unavailable')

  context.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    thumbnailSize,
    thumbnailSize
  )
  const thumbnail = canvas.toDataURL('image/png')
  image.src = ''
  return thumbnail
}

onMounted(async () => {
  try {
    const preview = await electron.getImagePreview(props.path)
    const thumbnail = await createStaticThumbnail(preview)
    if (active) source.value = thumbnail
  } catch {
    if (active) source.value = ''
  }
})
onUnmounted(() => {
  active = false
})
</script>

<style scoped>
.thumbnail {
  align-items: center;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: 7px;
  color: var(--color-text-muted);
  display: flex;
  flex: 0 0 38px;
  height: 38px;
  justify-content: center;
  overflow: hidden;
}
.thumbnail img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}
.thumbnail svg {
  height: 16px;
  width: 16px;
}
</style>
