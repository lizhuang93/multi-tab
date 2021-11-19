<template>
  <div class="tabview">
    <div class="nav-wrap" ref="tabs" v-if="tabList.length > 1" :style="styleTabs">
      <ul>
        <li
          class="item"
          :class="{ active: tabIndex === idx }"
          v-for="(tab, idx) in tabList"
          :key="idx"
          @click="setIndex(idx)"
        >
          {{ tab.label }}
        </li>
      </ul>
    </div>
    <section class="box-view">
      <div ref="roller" class="roller">
        <div
          class="page-wrap"
          v-for="(item, index) in tabs"
          :key="index"
          :style="{
            transform: transform,
            'transition-duration': transitionTime,
          }"
        >
          <div
            :style="{
              'margin-top': (item._marginTop || 0) + 'px',
              height: item._height,
              overflow: item._overflow,
              'min-height': minHeight,
            }"
          >
            <slot :name="index"></slot>
          </div>
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
    duration: { type: Number, default: 300 }, // tab横向滚动速率
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
      minHeight: 0,
      throttleScroll: null,
      lastTop: 0,
    };
  },
  computed: {
    styleTabs() {
      if (this.isSticky) {
        return {
          position: 'sticky',
          top: `${this.stickyTop}px`,
          'z-index': '999',
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
          setTimeout(() => {
            handleTabs(this.tabs, this.tabIndex);
            this.$nextTick(this.slide.handleEndFrames.bind(this.slide));
          }, 300);
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
      const frames = Math.round(this.duration / 25);
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

      const m = 'translateY(-100%)';
      const dis = 50;
      // console.log(ST, this.lastTop, this.$refs.tabs.style.transform);

      if (!this.tidy || Math.abs(ST - this.lastTop) < dis) return;

      if (ST > this.lastTop && this.slide.wasSticky()) {
        // 上滑， 隐藏
        this.$refs.tabs.style.transform = m;
        this.$refs.tabs.style.zIndex = -1;
      } else if (ST < this.lastTop && this.$refs.tabs.style.transform === m) {
        // 下滑，漏出
        this.$refs.tabs.style.transform = 'translateY(0)';
        this.$refs.tabs.style.zIndex = 999;
      }

      this.lastTop = ST;
    },
  },
};
</script>
<style lang="scss" scoped>
.tabview {
  position: relative;
  .nav-wrap {
    background: #fff;
    border-bottom: 1px solid #ccc;
    overflow: hidden;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
    transition: transform 0.3s linear;
    &::-webkit-scrollbar {
      display: none;
    }
    ul {
      white-space: nowrap;
      list-style: none;
      margin: 0;
      padding: 0;
      li {
        padding: 4px 9px;
        display: inline-block;
        &.active {
          color: #ff4800;
        }
      }
    }
  }

  .box-view {
    width: 100%;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    &::-webkit-scrollbar {
      width: 0 !important;
    }
    -ms-overflow-style: none;
    overflow: -moz-scrollbars-none;
    .roller {
      display: flex;
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
