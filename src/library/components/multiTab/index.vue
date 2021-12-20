<template>
  <div class="multi-tab">
    <!-- 吸顶的时候展示 -->
    <!-- 导航区 -->
    <div v-if="isSticky" class="nav0" :class="{ show: showNav, trans: isArrivedTop && tidy }">
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
import Vue from 'vue';
import BScroll from '@better-scroll/core';
import NestedScroll from '@better-scroll/nested-scroll';
import Slide from '@better-scroll/slide';
import Pullup from '@better-scroll/pull-up';

BScroll.use(NestedScroll);
BScroll.use(Slide);
BScroll.use(Pullup);

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
    tidy: { type: Boolean, default: false }, // 吸顶的前提下，开启 上滑自动隐藏tab，下滑自动展示tab功能。
    stickyTop: { type: Number, default: 0 }, // null 不做吸顶
    stopPropagation: { type: Boolean, default: false }, // 阻止冒泡
  },
  data() {
    return {
      isArrivedTop: false, // 到达顶部
      isShowNav: false, // 吸顶后， 展示Nav
      activeIndex: -1,
      tabs: [],
      bsBody: null,
      bsSlide: null,
      slideHeight: 'auto',
      ST: 0, // 记录当前 body 的scrollTop
    };
  },
  computed: {
    showNav() {
      if (this.tidy) {
        // 吸顶的情况下, 才考虑 tidy 效果
        return this.isShowNav && this.isArrivedTop;
      }
      if (this.isSticky) {
        return this.isArrivedTop;
      }
      return false;
    },
    rollerWidth() {
      return `${this.tabs.length * 100}%`;
    },
  },
  watch: {
    activeIndex(newVal, oldVal) {
      this.updateHeight();
    },
    'bsSlide.enabled': function(newVal, oldVal) {
      // 打印出来看看而已。
      console.log('bsSlide.enabled', newVal, oldVal);
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
    this.initBody();
    this.initSlide();
    this.updateHeight();
  },
  destroyed() {
    this.bsBody.destroy();
    this.bsSlide.destroy();
  },
  methods: {
    initBody() {
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
        pullUpLoad: {
          threshold: 300,
        },
      });

      this.bsBody.on('scroll', position => {
        const headerHeight = this.$refs['header'].offsetHeight;
        this.isArrivedTop = position.y <= this.stickyTop && Math.abs(position.y) >= headerHeight - this.stickyTop;
        if (this.tidy) {
          this.handleNav();
        }
      });

      this.bsBody.on('touchEnd', () => {
        this.handleSlide();
      });

      console.log('初始化body，init-body');
      this.bsBody.updateHeight = this.updateHeight;
      Vue.prototype.bsBody = this.bsBody;
    },
    initSlide() {
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
    },
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
    handleStart(startIndex = this.activeIndex) {
      this.handleEnd.did = false;
      console.log('handleStart');
      this.ST = Math.abs(this.bsBody.y);
      const slideOffsetTop =
        cache('slideOT', this.getSlideOffsetTop.bind(this)) - this.$refs['nav'].offsetHeight - this.stickyTop;
      const pages = Array.from(this.$refs['slide-content'].children);
      this.tabs.forEach((item, idx) => {
        if (startIndex === idx) {
          // 记录自己位置
          item._scrollTop = this.ST;
        }
        if (this.isArrivedTop) {
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
        pages[idx].style.marginTop = item._marginTop + 'px';
        pages[idx].setAttribute('class', 'h-auto');
      });
    },

    handleEnd(e) {
      // 此时activeIndex已指向目的页面
      if (this.handleEnd.did) return;
      this.handleEnd.did = true;

      console.log('handleEnd');

      this.updateHeight(); // 更新高度
      const pages = Array.from(this.$refs['slide-content'].children);

      if (this.isArrivedTop) {
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
      this.slideHeight = activePage.offsetHeight + 60 + 'px';
      console.log('更新高度, 当前tab页：', this.activeIndex);
      if (this.bsBody) {
        this.$nextTick(() => {
          this.bsBody.refresh();
        });
      }
    },
    goToPage(startIndex, endIndex) {
      this.handleStart(startIndex);
      this.bsSlide.goToPage(endIndex, 0, 300);
      this.handleEnd();
    },

    handleNav() {
      const y = this.bsBody.movingDirectionY;
      console.log(y);
      if (y === 1) {
        // 手指上滑
        this.isShowNav = false;
      } else if (y === -1) {
        // 手指下滑
        this.isShowNav = true;
      }
    },
    // 处理slide能否侧滑，
    handleSlide() {
      // 可以滑动: 1. 还未吸顶，2. 吸顶，nav 漏出
      if (!this.isArrivedTop || this.showNav) {
        this.bsSlide.enable();
      } else {
        this.bsSlide.disable();
      }
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
    z-index: 99;
    width: 100%;
    transform: translateY(-1000%);
    &.show {
      transform: translateY(0%);
    }
    &.trans {
      transition: transform 0.4s linear;
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
