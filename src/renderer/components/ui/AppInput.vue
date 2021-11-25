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

<script>
export default {
  name: 'AppInput',

  inheritAttrs: false,

  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    type: {
      type: String,
      default: 'text' // number
    },
    valid: {
      type: Boolean,
      default: true
    }
  },

  emits: ['update:modelValue'],

  computed: {
    value: {
      get () {
        return this.modelValue
      },
      set (v) {
        this.$emit('update:modelValue', v)
        this.$forceUpdate()
      }
    }
  }
}
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
