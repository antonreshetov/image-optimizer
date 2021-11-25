<template>
  <div class="preloader">
    <div />
    <div />
    <div />
    <div />
  </div>
</template>

<script>
export default {
  name: 'AppPreloader',

  data () {
    return {}
  }
}
</script>

<style lang="scss" scoped>
.preloader {
  display: inline-block;
  position: absolute;
  right: 0px;
  top: -25px;
  width: 24px;
  height: 24px;
  div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: 12px;
    height: 12px;
    margin: 8px;
    border: 2px solid gray;
    border-radius: 50%;
    animation: animation 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: gray transparent transparent transparent;
  }
  div:nth-child(1) {
    animation-delay: -0.45s;
  }
  div:nth-child(2) {
    animation-delay: -0.3s;
  }
  div:nth-child(3) {
    animation-delay: -0.15s;
  }
}

@keyframes animation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
