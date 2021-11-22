<template>
  <div class="tabview">
    <keep-alive>
      <div class="nav-wrap" ref="tabs" :style="styleTabs">
        <div
          class="item"
          :class="{ active: tabIndex === idx }"
          v-for="(tab, idx) in tabList"
          :key="tab.label"
          @click="setIndex(idx)"
        >
          {{ tab.label }}
        </div>
      </div>
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
          <slot></slot>
        </div>
      </div>
    </section>
  </div>
</template>
<script>
import { raf } from './utils/raf';
import Slide from './utils/slide';
import { formatTabs, handleTabs, throttle, debounce } from './utils/helper';

export default {
  props: {
    value: { type: Number, default: 0 },
    tabList: { type: Array, default: () => [] }, // tabs
    tidy: { type: Boolean, default: false }, // 是否开启 上滑自动隐藏tab，下滑自动展示tab功能。
    isSticky: { type: Boolean, default: true }, // 控制吸顶
    stickyTop: { type: Number, default: 0 }, // null 不做吸顶
  },
  data() {
    return {
      tabIndex: -1,
      tabs: [],
      slide: null,
      transform: 'translate3d(0%, 0, 0)',
      transitionTime: '0ms',
      throttleScroll: null,
      lastTop: 0,
      duration: 200,
    };
  },
  computed: {
    styleTabs() {
      if (this.isSticky) {
        return {
          top: `${this.stickyTop}px`,
        };
      }
      return '';
    },
  },
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

      console.log('mounted------');
      this.slide = new Slide({
        tabsEl: this.$refs.tabs,
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
      if (this.$refs['tabs']) {
        const tabs = this.$refs['tabs'];
        const list = Array.from(tabs.querySelectorAll('.item'));
        const item = list[this.tabIndex];
        const { scrollLeft, offsetWidth: tabsWidth } = tabs;
        const { offsetLeft, offsetWidth: itemWidth } = item;
        if (trans) {
          this.handleScrollTab(tabs, scrollLeft, offsetLeft - (tabsWidth - itemWidth) / 2);
        } else {
          tabs.scrollLeft = offsetLeft - (tabsWidth - itemWidth) / 2;
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
      console.log('onSroll------');

      // console.log(e);
      const BD = document.body;
      const DE = document.documentElement;
      const ST = Math.max(BD.scrollTop, DE.scrollTop);

      const m = 'translate3d(0, -100%, 0)';
      const dis = 50;
      // console.log(ST, this.lastTop, this.$refs.tabs.style.transform);

      if (!this.tidy || Math.abs(ST - this.lastTop) < dis) return;

      if (ST > this.lastTop && this.slide.didSticky()) {
        // 上滑， 隐藏
        this.$refs.tabs.style.transform = m;
        this.$refs.tabs.style.zIndex = -1;
      } else if (ST < this.lastTop && this.$refs.tabs.style.transform === m) {
        // 下滑，漏出
        this.$refs.tabs.style.transform = 'translate3d(0, 0, 0)';
        this.$refs.tabs.style.zIndex = 999;
      }

      this.lastTop = ST;
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
  .nav-wrap {
    position: sticky;
    background: #fff;
    border-bottom: 1px solid #ccc;
    overflow: hidden;
    overflow-x: auto;
    width: 100%;
    min-height: 30px;
    z-index: 999;
    display: flex;
    flex-wrap: nowrap;
    list-style: none;
    -webkit-overflow-scrolling: touch;
    &::-webkit-scrollbar {
      display: none;
    }
    .item {
      padding: 4px 9px;
      flex-shrink: 0;
      &.active {
        color: #ff4800;
      }
    }
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
