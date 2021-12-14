<template>
  <div class="multi-tab">
    <!-- 吸顶的时候展示 -->
    <!-- 导航区 -->
    <div :class="{ 'hidden-sticky': !showSticky }">
      <slot name="nav" v-if="$slots.nav"></slot>
      <tab-nav
        v-else
        tid="123"
        :value="activeIndex"
        :tabs="tabs"
        :isSticky="isSticky"
        :stickyTop="stickyTop"
        @click="setIndex"
      ></tab-nav>
    </div>

    <!-- 滚动区域 body-->
    <div class="body-wrapper" ref="body-wrapper">
      <div class="body-content">
        <!-- header区 -->
        <div ref="header">
          <slot name="header"></slot>
        </div>

        <!-- 导航区 -->
        <div ref="nav">
          <slot name="nav" v-if="$slots.nav"></slot>
          <tab-nav v-else :value="activeIndex" :tabs="tabs" :isSticky="false" @click="setIndex"></tab-nav>
        </div>

        <!-- 侧滑区 slide -->
        <section ref="slide" class="slide-wrapper">
          <div
            class="slide-content"
            :style="{
              width: rollerWidth,
              height: slideHeight,
            }"
          >
            <div class="slide-page" v-for="(item, index) in tabs" :key="index">
              <slot :name="index"></slot>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
<script>
import BScroll from '@better-scroll/core';
import NestedScroll from '@better-scroll/nested-scroll';
import Slide from '@better-scroll/slide';
BScroll.use(NestedScroll);
BScroll.use(Slide);

import TabNav from './tabNav.vue';
import { cache, getOffset } from './utils/helper';

export default {
  components: {
    TabNav,
  },
  props: {
    value: { type: Number, default: 0 },
    tabList: { type: Array, default: () => [] }, // tabs
    isSticky: { type: Boolean, default: true }, // 开启自动吸顶
    tidy: { type: Boolean, default: true }, // 吸顶的前提下，开启 上滑自动隐藏tab，下滑自动展示tab功能。
    stickyTop: { type: Number, default: 0 }, // null 不做吸顶
    stopPropagation: { type: Boolean, default: false }, // 阻止冒泡
  },
  data() {
    return {
      showSticky: false,
      activeIndex: -1,
      tabs: [],
      bsBody: null,
      bsSlide: null,
      slideHeight: 'auto',
      ST: 0, // 记录当前 body 的scrollTop
    };
  },
  computed: {
    rollerWidth() {
      return `${this.tabs.length * 100}%`;
    },
  },
  created() {
    if (this.tabList.length > 0) {
      this.activeIndex = this.value;
      this.tabs = this.tabList.map(n => {
        return {
          ...n,
          _marginTop: 0,
          _height: 'auto',
          _overflow: 'visible',
        };
      });
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.bsBody = new BScroll(this.$refs['body-wrapper'], {
        scrollX: false,
        scrollY: true,
        click: true,
        stopPropagation: true,
        bounce: false,
        useTransition: false,
        probeType: 3,
        nestedScroll: {
          groupId: 'shared',
        },
      });

      this.bsBody.on('scroll', position => {
        const headerHeight = this.$refs['header'].offsetHeight;
        this.showSticky = position.y <= 0 && Math.abs(position.y) > headerHeight + this.stickyTop;
      });

      this.bsSlide = new BScroll(this.$refs['slide'], {
        scrollX: true,
        scrollY: false,
        slide: {
          threshold: 100,
          loop: false,
          autoplay: false,
        },
        useTransition: false,
        momentum: false,
        bounce: false,
        nestedScroll: {
          groupId: 'shared',
        },
      });

      this.bsSlide.on('slideWillChange', page => {
        this.setIndex(page.pageX, false);
      });
      this.bsSlide.on('scrollStart', this.handleStart);
      this.bsSlide.on('scrollEnd', this.handleEnd);
      this.bsSlide.on('scrollCancel', this.handleEnd);

      this.updateHeight();
    });
  },
  destroyed() {
    this.bsBody.destroy();
    this.bsSlide.destroy();
  },
  methods: {
    setIndex(index, isClick = true) {
      this.activeIndex = index;
      this.$emit('input', index);
      this.$emit('click', index);
      if (isClick) {
        this.bsSlide.goToPage(index, 0, 300);
      }
    },
    refresh() {
      this.$nextTick(() => {
        this.bsBody.refresh();
      });
    },
    handleStart() {
      console.log('handleStart');
      this.ST = Math.abs(this.bsBody.y);
      console.log('this.ST', this.ST);
      const slideOffsetTop =
        cache('slideOT', this.getSlideOffsetTop.bind(this)) - this.$refs['nav'].offsetHeight - this.stickyTop;

      this.tabs.forEach((item, idx) => {
        if (this.activeIndex === idx) {
          // 记录自己位置
          item._scrollTop = this.ST;
        }

        if (this.showSticky) {
          // 吸顶, 处理其他page
          if (this.activeIndex !== idx) {
            const ST = item._scrollTop || 0;
            if (ST > 0) {
              // 有记录
              item._marginTop = this.ST - item._scrollTop;
            } else {
              item._marginTop = this.ST - slideOffsetTop;
            }
          }
        } else {
          // 不吸顶 case
          item._marginTop = 0;
          item._height = 'auto';
          item._overflow = 'visible';
        }

        const page = Array.from(this.$refs['slide'].children[0].children)[idx];
        page.style.marginTop = item._marginTop;
        page.style.height = item._height;
        page.style.overflow = item._overflow;
      });
    },

    handleEnd() {
      console.log('handleEnd');
      // 此时activeIndex已指向目的页面
      if (this.showSticky) {
        // 吸顶,
        const scrollTop = Math.round(this.ST - this.tabs[this.activeIndex]._marginTop);
        const minScrollTop =
          cache('slideOT', this.getSlideOffsetTop.bind(this)) - this.$refs['nav'].offsetHeight - this.stickyTop;
        this.bsBody.scrollTo(0, -Math.max(scrollTop, minScrollTop), 0);

        this.tabs.forEach((item, idx) => {
          if (this.activeIndex !== idx) {
            const ST = item._scrollTop || 0;
            if (ST > 0) {
              // 有记录
              item._marginTop = scrollTop - item._scrollTop;
            } else {
              item._marginTop = scrollTop + this.$refs['nav'].offsetHeight - minScrollTop - ST;
            }
            item._height = '0';
            item._overflow = 'hidden';
          } else {
            item._marginTop = 0;
            item._height = 'auto';
            item._overflow = 'visible';
          }
        });
      } else {
        this.tabs.forEach((item, idx) => {
          // 不吸顶 状态下 marginTop 都为0， 不用操作滚动
          item._marginTop = 0;
          if (this.activeIndex === idx) {
            item._height = 'auto';
            item._overflow = 'visible';
          } else {
            item._height = '0';
            item._overflow = 'hidden';
          }
        });
      }

      this.$nextTick(() => {
        this.updateHeight();
      });
    },

    getSlideOffsetTop() {
      return getOffset(this.$refs['slide'], this.$refs['body-wrapper']).top;
    },

    updateHeight() {
      const activePage = this.$refs['slide'].children[0].children[this.activeIndex].children[0];
      this.slideHeight = activePage.offsetHeight + 'px';
      this.refresh();
    },
  },
};
</script>
<style lang="scss" scoped>
.multi-tab {
  position: relative;
  .hidden-sticky {
    transform: translateX(-1000%);
  }
}
.body-wrapper {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
.slide-wrapper {
  width: 100%;
  overflow: hidden;
  z-index: 0;
  .slide-content {
    display: flex;
    flex-wrap: nowrap;
    .slide-page {
      min-height: 100vh;
      width: 100vw;
      overflow: hidden;
    }
  }
}
</style>
