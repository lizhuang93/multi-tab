<template>
  <div class="tabview">
    <keep-alive>
      <tab-nav
        :value="value"
        ref="tabNav"
        :tabList="tabList"
        :class="{ 'is-sticky': this.isSticky }"
        :styleTabs="styleTabs"
        @click="setIndex"
      ></tab-nav>
    </keep-alive>
    <section class="box-view">
      <div ref="roller" class="roller">
        <div
          class="page-wrap"
          v-for="(item, index) in tabs"
          :key="index"
          :style="{
            transform: transform,
            'transition-duration': transitionTime,
            'margin-top': (item._marginTop || 0) + 'px',
            height: item._height,
            overflow: item._overflow,
          }"
        >
          <slot :name="index"></slot>
        </div>
      </div>
    </section>
  </div>
</template>
<script>
import { raf } from './utils/raf';
import Slide from './utils/slide';
import { formatTabs, handleTabs, throttle, debounce } from './utils/helper';

import TabNav from './tabNav.vue';

export default {
  components: {
    TabNav,
  },
  props: {
    value: { type: Number, default: 0 },
    tabList: { type: Array, default: () => [] }, // tabs
    tidy: { type: Boolean, default: true }, // 是否开启 上滑自动隐藏tab，下滑自动展示tab功能。
    isSticky: { type: Boolean, default: true }, // 控制吸顶
    stickyTop: { type: Number, default: 0 }, // null 不做吸顶
  },
  data() {
    return {
      tabIndex: -1,
      tabs: [],
      slide: null,
      transform: 'translateX(0%)',
      transitionTime: '0ms',
      throttleScroll: null,
      lastTop: 0,
      duration: 200,
      styleTabs: {},
    };
  },
  computed: {},
  created() {
    if (this.tabList.length > 1) {
      this.tabIndex = this.value;
      // 洗一下数据
      this.tabs = formatTabs(JSON.parse(JSON.stringify(this.tabList)), this.tabIndex);
      handleTabs(this.tabs, this.tabIndex);
    }
  },
  mounted() {
    if (this.tabList.length > 1) {
      this.$nextTick(() => {
        this.animateTab(false);
      });

      this.slide = new Slide({
        tabsEl: this.$refs.tabNav.$el,
        roller: this.$refs.roller,
        index: this.tabIndex,
        tabs: this.tabs,
        stickyTop: this.stickyTop,
      }).on('next', e => {
        console.log('e', e);
        this.transform = e.transform;
        this.transitionTime = e.time;
        setTimeout(() => {
          // 为了不影响滑动性能, 延后切换tab
          this.setIndex(e.index, { isClick: false });
        }, 200);
        if (e.type === 'end') {
          // 避免滑动出现的白屏， 滑动完成再置0，
          setTimeout(() => {
            handleTabs(this.tabs, this.tabIndex);
            this.slide.handleEndFrames();
          }, 200);
        }
      });

      this.throttleScroll = throttle(this.onScroll);
      this.bindScroll();
    }
  },
  destoryed() {
    if (this.slide) {
      this.slide.release();
    }
    this.removeScroll();
  },
  methods: {
    setIndex(index, { isClick = true } = {}) {
      const startIndex = this.tabIndex;
      this.tabIndex = index;
      this.animateTab();
      this.$emit('input', index);
      this.$emit('click', index, this.tabs[index]);
      if (isClick) {
        this.slide.go(startIndex, index);
      }
    },
    // 标签滚动
    //  trans表示是否需要动画过度 (初始化则不需要)
    animateTab(trans = true) {
      if (this.$refs['tabNav'].$el) {
        const tabNavEl = this.$refs['tabNav'].$el;
        const list = Array.from(tabNavEl.querySelectorAll('.item'));
        const item = list[this.tabIndex];
        const { scrollLeft, offsetWidth: tabsWidth } = tabNavEl;
        const { offsetLeft, offsetWidth: itemWidth } = item;
        if (trans) {
          this.handleScrollTab(tabNavEl, scrollLeft, offsetLeft - (tabsWidth - itemWidth) / 2);
        } else {
          tabNavEl.scrollLeft = offsetLeft - (tabsWidth - itemWidth) / 2;
        }
      }
    },
    handleScrollTab(el, from, to) {
      let count = 0;
      const frames = Math.floor(this.duration / 25);
      const animate = () => {
        el.scrollLeft += (to - from) / frames;
        count += 1;
        if (frames > count) {
          raf(animate);
        }
      };
      animate();
    },

    bindScroll() {
      window.addEventListener('scroll', this.throttleScroll);
    },

    removeScroll() {
      window.removeEventListener('scroll', this.throttleScroll);
    },

    // 操作tabs导航栏的显示与隐藏
    onScroll(e) {
      // 吸顶操作
      if (this.isSticky && this.$refs.tabNav) {
        let offsetHeight = 0; // nav 高度
        let isArrivedTop = false; // 是否到达顶部

        if (this.$refs.tabNav.$el) {
          offsetHeight = this.$refs.tabNav.$el.offsetHeight;
        }
        if (this.$refs.roller) {
          isArrivedTop = this.$refs.roller.getBoundingClientRect().y <= offsetHeight;
          if (isArrivedTop) {
            this.$refs.tabNav.$el.style.position = 'fixed';
            this.$refs.tabNav.$el.style.top = `${this.stickyTop}px`;
            this.$refs.roller.style.marginTop = `${offsetHeight}px`;
          } else {
            this.$refs.tabNav.$el.style.position = 'sticky';
            this.$refs.tabNav.$el.style.top = `${this.stickyTop}px`;
            this.$refs.roller.style.marginTop = 0;
          }
        }

        // 吸顶的情况下，tidy控制， 上滑自动隐藏tab，下滑自动展示tab功能。
        const BD = document.body;
        const DE = document.documentElement;
        const ST = Math.max(BD.scrollTop, DE.scrollTop);

        const m = 'translateY(-100%)';
        const dis = 50; // 滚动距离 > 50

        if (!this.tidy || Math.abs(ST - this.lastTop) < dis) return;

        if (isArrivedTop) {
          this.$refs.tabNav.$el.style.transition = 'transform 0.1s linear';
        } else {
          this.$refs.tabNav.$el.style.transition = 'none';
        }

        if (ST > this.lastTop && this.slide.didSticky()) {
          // 上滑， 隐藏
          this.$refs.tabNav.$el.style.transform = m;
          setTimeout(() => {
            // 等待滑动动作完成
            this.$refs.tabNav.$el.style.zIndex = -1;
          }, 100);
        } else if (ST < this.lastTop && this.$refs.tabNav.$el.style.transform === m) {
          // 下滑，漏出
          this.$refs.tabNav.$el.style.transform = 'translateY(0px)';
          this.$refs.tabNav.$el.style.zIndex = 999;
        }
        this.lastTop = ST;
      }
    },
  },
};
</script>
<style lang="scss" scoped>
html,
body {
  position: static;
}
.tabview {
  position: relative;
  .is-sticky {
    position: sticky;
    top: 0;
  }
  .box-view {
    width: 100%;
    overflow-x: hidden;
    -ms-overflow-style: none;
    overflow: -moz-scrollbars-none;
    z-index: 0;
    .roller {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      align-content: flex-start;
      flex-wrap: nowrap;
      width: 100%;
      .page-wrap {
        width: 100%;
        flex-shrink: 0;
        transition-property: transform;
        transition-timing-function: linear;
      }
    }
  }
}
</style>
