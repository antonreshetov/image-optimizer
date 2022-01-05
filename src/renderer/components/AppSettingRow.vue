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

<script setup lang="ts">
interface Props {
  title: string
  desc?: string
}

defineProps<Props>()
</script>

<style lang="scss" scoped>
.row {
  display: flex;
  gap: 10px;
  justify-content: space-between;
  margin-bottom: 10px;
  min-height: 24px;
  .title {
    user-select: none;
  }
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
