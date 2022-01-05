<template>
  <div
    class="app-toggle"
    :class="{ 'is-active': modelValue }"
    @click="emit('update:modelValue', !modelValue)"
  >
    <div class="dot" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

withDefaults(defineProps<Props>(), {
  modelValue: false
})
const emit = defineEmits<Emits>()
</script>

<style lang="scss" scoped>
.app-toggle {
  width: 36px;
  height: 14px;
  border: 1px solid var(--color-gray-300);
  border-radius: 10px;
  position: relative;
  &.is-active {
    background-color: var(--color-gray-200);
    .dot {
      left: 23px;
    }
  }
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 12px;
    background-color: var(--color-gray-300);
    position: absolute;
    top: 1px;
    left: 1px;
    transition: all 0.1s;
  }
}
</style>
