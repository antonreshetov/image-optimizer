<template>
  <div class="row">
    <div class="title">
      {{ title }}
    </div>
    <div class="field">
      <div class="field__body">
        <slot />
      </div>
      <div
        v-if="desc"
        class="field__desc"
      >
        <span>{{ desc }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppSettingsRow',

  props: {
    title: {
      type: String,
      default: ''
    },
    desc: {
      type: String,
      default: ''
    }
  },

  data () {
    return {}
  }
}
</script>

<style lang="scss" scoped>
.row {
  display: flex;
  gap: 10px;
  justify-content: space-between;
  margin-bottom: 10px;
  min-height: 24px;
}

.field {
  &__body,
  &__desc {
    display: flex;
    justify-content: flex-end;
  }
  &__desc {
    font-size: 10px;
  }
}
</style>
