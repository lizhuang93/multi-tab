<template>
  <div class="tabview">
    <div class="wrap" ref="tabs" v-if="!tidy || tabs.length > 1" :style="styleTabs">
      <ul>
        <li
          class="item"
          :class="{ active: tabIndex === idx }"
          v-for="(tab, idx) in tabs"
          :key="idx"
          @click="setIndex(idx)"
        >
          {{ tab.label }}
        </li>
      </ul>
    </div>
    <section class="box-view">
      <div ref="roller" class="panes" :style="style">
        <div class="page-wrap" v-for="(item, index) in tabs" :key="index">
          <slot :name="index"></slot>
        </div>
      </div>
    </section>
  </div>
</template>
<script>
import { raf } from './utils/raf';
import Slide from './utils/slide';

export default {
  props: {
    value: { type: Number, default: 0 },
    tabs: { type: Array, default: () => [] },
    duration: { type: Number, default: 300 },
    tidy: { type: Boolean, default: false }, // 控制显隐
    capacity: { type: Number, default: 4 },
    tabStickyTop: { type: Number, default: null }, // null 不做吸顶
  },
  data() {
    return {
      tabIndex: -1,
      slide: null,
      style: { transform: 'translateX(0%)', transition: '0ms' },
      throttleScroll: null,
    };
  },
  computed: {
    styleTabs() {
      if (this.tabStickyTop === null) {
        return '';
      }
      return {
        position: 'sticky',
        top: `${this.tabStickyTop}px`,
        'z-index': '999',
      };
    },
  },
  mounted() {
    if (this.tabs.length > 1) {
      this.tabIndex = this.value;
      this.$nextTick(() => {
        this.animateTab(false);
      });
      this.slide = new Slide({
        roller: this.$refs.roller,
        index: this.tabIndex,
      }).on('next', e => {
        this.tabIndex = e.index;
        this.style = { transform: e.transform, transition: e.transition };
      });
    }
  },
  destoryed() {
    if (this.slide) {
      this.slide.release();
    }
  },
  methods: {
    setIndex(index) {
      this.tabIndex = index;
      this.animateTab();
      this.$emit('input', index);
      this.$emit('click', index, this.tabs[index]);
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
  },
};
</script>
<style lang="scss" scoped>
.tabview {
  position: relative;
  .wrap {
    background: #fff;
    border-bottom: 1px solid #ccc;
    overflow: hidden;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
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
    .panes {
      white-space: nowrap;
      // transition: transform 0.3s ease;
      .page-wrap {
        width: 100%;
        display: inline-block;
      }
    }
  }
}
</style>
