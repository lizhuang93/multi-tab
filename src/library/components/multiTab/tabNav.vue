<template>
  <div
    class="nav-wrapper"
    ref="tabNav"
    v-if="tabs.length > 0"
    :style="{
      top: `${stickyTop}px`,
    }"
  >
    <div class="nav-content">
      <div
        class="item"
        :class="{ active: value === idx }"
        v-for="(item, idx) in tabs"
        :key="item.label"
        @click="clickNav(idx)"
      >
        {{ item.label }}
      </div>
    </div>
  </div>
</template>

<script>
import BScroll from '@better-scroll/core';

export default {
  components: {},
  props: {
    tabs: {
      type: Array,
      default: () => [],
    },
    value: {
      type: Number,
      default: 0,
    },
    isSticky: {
      type: Boolean,
      default: true,
    },
    stickyTop: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      bs: null,
    };
  },

  computed: {},
  watch: {
    value(newVal, oldVal) {
      this.animate();
      console.log('value---change3');
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.bs = new BScroll(this.$refs['tabNav'], {
        scrollX: true,
        scrollY: false,
        click: true,
        bounceTime: 300,
        useTransition: false,
        eventPassthrough: 'vertical',
      });
    });
  },

  destroyed() {
    this.bs.destroy();
  },
  methods: {
    clickNav(idx) {
      this.$emit('click', idx);
    },

    animate(duration = 300) {
      if (this.$refs['tabNav']) {
        const tabNavEl = this.$refs['tabNav'];
        const contentOffsetWidth = tabNavEl.querySelector('.nav-content').offsetWidth;
        const list = Array.from(tabNavEl.querySelectorAll('.item'));
        const item = list[this.value];
        if (!item) return;
        const { offsetWidth: tabsWidth } = tabNavEl;
        const { offsetLeft, offsetWidth: itemWidth } = item;

        const min = -(contentOffsetWidth - tabsWidth);
        let to = (tabsWidth - itemWidth) / 2 - offsetLeft;
        if (to > 0) {
          to = 0;
        } else if (to <= min) {
          to = min;
        }
        this.bs.scrollTo(to, 0, duration);
        console.log('to', to);
      }
    },
  },
};
</script>

<style scoped lang="less" style="text/less">
.nav-wrapper {
  width: 100%;
  height: 38px;
  overflow: hidden;
  z-index: 99;
  padding-top: 6px;
  background: #fff;
  white-space: nowrap;
}
.nav-content {
  display: inline-block;
  .item {
    display: inline-block;
    padding: 4px 9px;
    &.active {
      color: #ff4800;
    }
  }
}
</style>
