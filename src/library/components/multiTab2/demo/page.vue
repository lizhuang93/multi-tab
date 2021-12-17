<template>
  <div id="" style="background: #efefef">
    <p v-for="(item, idx) in list" :key="idx">{{ idx }}------{{ item }}</p>
    <p v-if="isLoading" style="min-height:100vh">加载中...</p>
  </div>
</template>

<script>
import mock from './mock';
export default {
  components: {},
  props: {},
  data() {
    return {
      list: [],
      isStop: false,
      isLoading: true,
    };
  },

  computed: {},

  mounted() {},

  methods: {
    stop() {
      this.isStop = true;
    },
    recover() {
      this.isStop = false;
    },
    init() {
      this.loadList();
      this.bsBody.on('pullingUp', () => {
        if (this.isStop) return;
        this.loadList();
      });
    },
    loadList() {
      this.isLoading = true;
      setTimeout(() => {
        this.list.push(...mock);
        this.isLoading = false;
        this.bsBody.finishPullUp();
        this.$nextTick(() => {
          console.log('load-0');
          this.bsBody.updateHeight();
        });
      }, 300);
    },
  },
};
</script>

<style scoped lang="less" style="text/less"></style>
