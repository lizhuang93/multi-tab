import Env from './Env';
import Emitter from './emitter';
import { getOffset, handleTabs } from './helper';

export default class Slide extends Emitter {
  constructor(params) {
    super();
    this.tabs = params.tabs;
    this.index = params.index;
    this.tabsEl = params.tabsEl;
    this.roller = params.roller;
    this.stickyTop = params.stickyTop;

    this.width = this.roller.offsetWidth;
    this.frames = Array.from(this.roller.children);
    this.rollerOT = getOffset(this.roller).top;
    this.tabsOH = this.tabsEl.offsetHeight;

    // 添加事件
    this.roller.addEventListener('touchstart', this.touchstart, Env.supportPassive);
    this.roller.addEventListener('touchmove', this.touchmove, Env.supportPassive);
    this.roller.addEventListener('touchend', this.touchend, Env.supportPassive);
    this.roller.addEventListener('touchcancel', this.touchend, Env.supportPassive);
  }

  // 释放绑定
  release() {
    this.roller.removeEventListener('touchstart', this.touchstart, Env.supportPassive);
    this.roller.removeEventListener('touchmove', this.touchmove, Env.supportPassive);
    this.roller.removeEventListener('touchend', this.touchend, Env.supportPassive);
  }

  // 抛出事件
  animate(offset, { time = '200ms', type = 'move' } = {}) {
    const transform = type === 'move' ? `translate3d(${offset}%, 0, 0)` : `translateX(${offset}%)`;
    this.emit('next', { index: this.index, transform, time, type });
  }

  // 拖拽开始
  touchstart = e => {
    if (!this.didSticky()) return;

    this.startX = e.touches[0].clientX;
    this.startY = e.touches[0].clientY;

    this.startClientY = this.roller.getBoundingClientRect().y;
    this.handleStartFrames.did = false;
    console.log('touchstart');
  };

  // 拖拽过程
  touchmove = e => {
    this.moveX = e.changedTouches[0].clientX;
    this.moveY = e.changedTouches[0].clientY;

    let disX = Math.abs(this.moveX - this.startX);
    let disY = Math.abs(this.moveY - this.startY);

    if (!this.didSticky()) return;

    if (this.isSwipe(disX, disY)) {
      // 横滑才执行
      if (!this.handleStartFrames.did) {
        // 横滑才执行，只执行一次
        this.handleStartFrames();
        this.handleStartFrames.did = true;
      }

      e.preventDefault();

      // 不移动场景: 第一页 && 右滑 || 最后一页 && 左滑
      const disableSwipe =
        (this.index <= 0 && this.moveX > this.startX) ||
        (this.index >= this.frames.length - 1 && this.moveX < this.startX);
      if (disableSwipe) return;

      this.animate(((this.moveX - this.startX) / this.width) * 100 - this.index * 100, { time: 0 });
      this.disableScroll();
    }
  };

  // 拖拽结束
  touchend = e => {
    if (this.canScrollY) return;

    this.endX = e.changedTouches[0].clientX;
    this.endY = e.changedTouches[0].clientY;

    let disX = Math.abs(this.endX - this.startX);
    let disY = Math.abs(this.endY - this.startY);

    if (!this.didSticky()) return;

    let direction = this.endX - this.startX > 0 ? -1 : 1; // -1上一页，1下一页
    let threshold = Math.abs(this.startX - this.endX) > this.width / 3; // 滑动超过1/3，滚到下一页

    if (this.isSwipe(disX, disY) && threshold) {
      const disableSwipe =
        (this.index <= 0 && this.endX > this.startX) ||
        (this.index >= this.frames.length - 1 && this.endX < this.startX);
      if (disableSwipe) return; // 不移动场景: 第一页右滑 || 最后一页左滑

      this.index = this.index + direction;
    }

    this.animate(-this.index * 100, { type: 'end' });
    this.recoverScroll();
    console.log('touchend');
  };

  // 判定横滑，横向角度 > 45度
  isSwipe(disX, disY) {
    const clientY = this.roller.getBoundingClientRect().y;
    return clientY === this.startClientY && Math.abs(disX / disY) > 1;
  }

  // 恢复body滚动行为，为了横竖滚动互斥
  recoverScroll() {
    this.canScrollY = true;
    document.body.style.overflowY = 'scroll';
  }
  // 禁止doby滚动行为，为了横竖滚动互斥
  disableScroll() {
    this.canScrollY = false;
    document.body.style.overflowY = 'hidden';
  }

  // 定位跳转
  go(startIndex, index) {
    this.index = index;
    this.startClientY = this.roller.getBoundingClientRect().y;
    console.log('go-index------');
    // handleTabs(this.tabs, index, { showAll: true }); // 所有frames height置为auto。
    this.handleStartFrames(startIndex);
    this.animate(-this.index * 100, { type: 'end' });
  }

  // 横向滚动之前处理好其他frames
  handleStartFrames(startIndex = -1) {
    const index = startIndex >= 0 ? startIndex : this.index;
    const BD = document.body;
    const DE = document.documentElement;
    this.ST = Math.max(BD.scrollTop, DE.scrollTop); // 开始滑动前的scrollTop

    this.tabs.forEach((tab, idx) => {
      tab._height = 'auto';
      tab._overflow = 'visible';
      if (index !== idx) {
        const ST = tab._scrollTop || 0;
        if (ST > 0) {
          tab._marginTop = this.ST - tab._scrollTop;
        } else {
          tab._marginTop = `${this.ST + this.tabsOH - this.rollerOT - ST}`;
        }
      } else {
        // 记录一下
        tab._scrollTop = this.ST;
      }
    });
  }

  // 滚动结束，处理其他frames
  handleEndFrames(e) {
    // 此时的index已指向目的页
    const scrollTop = this.ST - this.tabs[this.index]._marginTop; // 目的页 的scrollTop
    Array.from(this.frames)[this.index].children[0].style.marginTop = 0; // 目的页 置0
    this.setScrollTop(scrollTop);

    // 处理其他页
    this.tabs.forEach((tab, idx) => {
      if (this.index !== idx) {
        const ST = tab._scrollTop || 0; // 拿出曾记录自身页的scrollTop
        if (ST > 0) {
          tab._marginTop = scrollTop - tab._scrollTop;
        } else {
          tab._marginTop = `${scrollTop + this.tabsOH - this.rollerOT - ST}`;
        }
      } else {
        tab._marginTop = 0; // 目的页 置0
      }
    });
  }

  setScrollTop(scrollTop) {
    document.body.style['-webkit-overflow-scrolling'] = 'auto';
    document.documentElement.style['-webkit-overflow-scrolling'] = 'auto';
    document.body.scrollTop = scrollTop;
    document.documentElement.scrollTop = scrollTop;
    document.body.style['-webkit-overflow-scrolling'] = 'touch';
    document.documentElement.style['-webkit-overflow-scrolling'] = 'touch';
  }

  // 判定吸顶状态
  didSticky() {
    const top = this.tabsEl.getBoundingClientRect().y;
    return Math.abs(top - this.stickyTop) <= 1; // 允许1px误差
  }
}