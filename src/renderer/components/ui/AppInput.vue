<template>
  <div
    class="app-input"
    :class="{ 'is-error': !valid }"
  >
    <input
      v-model="value"
      :value="value"
      :type="type"
      v-bind="$attrs"
    >
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string | number
  type: 'text' | 'number'
  valid: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void
}

const props = withDefaults(defineProps<Props>(), {
  valid: true,
  type: 'text'
})

const emit = defineEmits<Emits>()

const value = computed({
  get: () => props.modelValue,
  set: v => {
    emit('update:modelValue', v)
  }
})
</script>

<style lang="scss" scoped>
.app-input {
  input {
    border: 1px solid var(--color-gray-300);
    border-radius: 4px;
    outline: none;
    padding: 4px;
    background-color: var(--color-bg);
    color: var(--color-gray-500);
    width: 50px;
    -webkit-appearance: none;
  }
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  &.is-error {
    input {
      border-color: var(--color-error);
    }
  }
}
</style>
