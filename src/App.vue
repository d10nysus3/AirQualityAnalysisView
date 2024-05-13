<template>
  <div>
    <div class="bg-container"/>
    <router-view></router-view>
  </div>
</template>
<script>
const debounce = (fn, delay) => {
  let timer = null;

  return function () {
    let context = this;

    let args = arguments;

    clearTimeout(timer);

    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
};

const _ResizeObserver = window.ResizeObserver;

window.ResizeObserver = class ResizeObserver extends _ResizeObserver {
  constructor(callback) {
    callback = debounce(callback, 16);

    super(callback);
  }
};
export default {
  components: {},
};
</script>
<style>

.bg-container {
  position:fixed; 
  width: 100%; 
  height: 100%; 
  background-color: black; 
  background: url("./assets/bg.png");
  z-index: -10;
}
</style>
