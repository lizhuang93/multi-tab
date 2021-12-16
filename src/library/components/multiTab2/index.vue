<template>
  <div class="multi-tab">
    <!-- 吸顶的时候展示 -->
    <!-- 导航区 -->
    <div v-if="isSticky" class="nav0" :class="{ show: arrivedTop }">
      <slot name="nav" v-if="$slots.nav"></slot>
      <tab-nav
        v-else
        :value="activeIndex"
        :tabs="tabs"
        :isSticky="true"
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
          <tab-nav v-else :value="activeIndex" :tabs="tabs" @click="setIndex"></tab-nav>
        </div>

        <!-- 侧滑区 slide -->
        <section ref="slide" class="slide-wrapper">
          <div
            class="slide-content"
            ref="slide-content"
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
      arrivedTop: false,
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
  watch: {
    activeIndex(newVal, oldVal) {
      this.updateHeight();
    },
  },
  created() {
    if (this.tabList.length > 0) {
      this.activeIndex = this.value;
      this.tabs = this.tabList.map(n => {
        return {
          ...n,
          _marginTop: 0,
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
        this.arrivedTop = position.y <= this.stickyTop && Math.abs(position.y) >= headerHeight - this.stickyTop;
        console.log('setArrivedTop', this.arrivedTop);
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
        console.log('page--->', page);
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
      if (index === this.activeIndex) return;

      const startIndex = this.activeIndex;
      this.activeIndex = index;
      this.$emit('input', index);
      this.$emit('click', index);
      if (isClick) {
        this.goToPage(startIndex, index);
      }
    },
    refresh() {
      if (this.bsBody) {
        this.$nextTick(() => {
          this.bsBody.refresh();
        });
      }
    },
    handleStart(startIndex = this.activeIndex) {
      this.handleEnd.did = false;
      console.log('handleStart');
      this.ST = Math.abs(this.bsBody.y);
      console.log('this.ST->', this.ST);
      const slideOffsetTop =
        cache('slideOT', this.getSlideOffsetTop.bind(this)) - this.$refs['nav'].offsetHeight - this.stickyTop;
      const pages = Array.from(this.$refs['slide-content'].children);
      this.tabs.forEach((item, idx) => {
        if (startIndex === idx) {
          // 记录自己位置
          item._scrollTop = this.ST;
        }
        if (this.arrivedTop) {
          // 吸顶, 处理其他page
          if (startIndex !== idx) {
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
        }
        console.log(idx, item._marginTop);
        pages[idx].style.marginTop = item._marginTop + 'px';
        pages[idx].setAttribute('class', 'h-auto');
      });
    },

    handleEnd(e) {
      // 此时activeIndex已指向目的页面
      if (this.handleEnd.did) return;
      this.handleEnd.did = true;

      console.log('handleEnd', this.activeIndex, this.arrivedTop);

      this.updateHeight(); // 更新高度
      const pages = Array.from(this.$refs['slide-content'].children);

      if (this.arrivedTop) {
        // 吸顶,
        const scrollTop = Math.round(this.ST - this.tabs[this.activeIndex]._marginTop);
        const minScrollTop =
          cache('slideOT', this.getSlideOffsetTop.bind(this)) - this.$refs['nav'].offsetHeight - this.stickyTop;

        this.tabs.forEach((item, idx) => {
          let className = 'h-zero';
          if (this.activeIndex !== idx) {
            const ST = item._scrollTop || 0;
            if (ST > 0) {
              // 有记录
              item._marginTop = scrollTop - item._scrollTop;
            } else {
              item._marginTop = scrollTop - minScrollTop - ST;
            }
          } else {
            item._marginTop = 0;
            className = 'h-auto';
          }
          pages[idx].style.marginTop = item._marginTop + 'px';
          pages[idx].setAttribute('class', className);
        });
        this.$nextTick(() => {
          this.bsBody.scrollTo(0, -Math.max(scrollTop, minScrollTop), 0); // 这个地方会触发 scroll 事件
        });
      } else {
        this.tabs.forEach((item, idx) => {
          // 不吸顶 状态下 marginTop 都为0， 不用操作滚动
          item._marginTop = 0;
          let className = 'h-zero';
          if (this.activeIndex === idx) {
            className = 'h-auto';
          }
          pages[idx].style.marginTop = 0;
          pages[idx].setAttribute('class', className);
        });
      }
    },

    getSlideOffsetTop() {
      return getOffset(this.$refs['slide'], this.$refs['body-wrapper']).top;
    },

    updateHeight() {
      const activePage = Array.from(this.$refs['slide-content'].children)[this.activeIndex];
      this.slideHeight = activePage.offsetHeight + 'px';
      console.log('updateHeight-fn', this.activeIndex);
      this.refresh();
    },
    goToPage(startIndex, endIndex) {
      this.handleStart(startIndex);
      this.bsSlide.goToPage(endIndex, 0, 300);
      this.handleEnd();
    },
  },
};
</script>
<style lang="scss" scoped>
.multi-tab {
  position: relative;
  .nav0 {
    position: absolute;
    top: 0;
    transform: translateX(-500%);
    z-index: 99;
    width: 100%;
    &.show {
      transform: translateX(0%);
    }
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
    align-items: flex-start;
    flex-wrap: nowrap;
    .slide-page {
      width: 100vw;
      overflow: hidden;
      &.h-auto {
        height: 'auto';
        overflow: 'visible';
      }
      &.h-zero {
        height: '0';
        overflow: 'hidden';
      }
    }
  }
}
</style>
