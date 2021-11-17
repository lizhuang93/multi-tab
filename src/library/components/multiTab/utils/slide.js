import Env from './Env';
import Emitter from './emitter';
import { getOffset, formatTabs } from './helper';

export default class Slide extends Emitter {
  constructor(params) {
    super();
    this.tabs = params.tabs;
    this.index = params.index;
    this.tabsEl = params.tabsEl;
    this.roller = params.roller;
    this.stickyTop = params.stickyTop;

    this.width = this.roller.offsetWidth;
    this.frames = this.roller.children;
    this.rollerOT = getOffset(this.roller).top;
    this.tabsOH = this.tabsEl.offsetHeight;

    // 添加事件
    this.roller.addEventListener('touchstart', this.touchstart, Env.supportPassive);
    this.roller.addEventListener('touchmove', this.touchmove, Env.supportPassive);
    this.roller.addEventListener('touchend', this.touchend, Env.supportPassive);
  }

  // 释放绑定
  release() {
    this.roller.removeEventListener('touchstart', this.touchstart, Env.supportPassive);
    this.roller.removeEventListener('touchmove', this.touchmove, Env.supportPassive);
    this.roller.removeEventListener('touchend', this.touchend, Env.supportPassive);
  }

  // 抛出事件
  animate(offset, transition = '300ms') {
    const transform = `translate3d(${offset}%, 0, 0)`;
    this.emit('next', { index: this.index, transform, transition });
  }

  // 拖拽开始
  touchstart = e => {
    if (!this.wasSticky()) return;

    this.startX = e.touches[0].clientX;
    this.startY = e.touches[0].clientY;

    this.startClientY = this.roller.getBoundingClientRect().y;
    this.handleStartFrames();
  };

  // 拖拽过程
  touchmove = e => {
    let moveX = e.changedTouches[0].clientX;
    let moveY = e.changedTouches[0].clientY;

    let disX = Math.abs(moveX - this.startX);
    let disY = Math.abs(moveY - this.startY);

    if (!this.wasSticky()) return;

    if (this.isSwipe(disX, disY)) {
      // 不移动场景: 第一页右滑 || 最后一页左滑
      const disableSwipe =
        (this.index <= 0 && moveX > this.startX) || (this.index >= this.frames.length - 1 && this.moveX < this.startX);
      if (disableSwipe) return;

      e.preventDefault();
      this.animate(((moveX - this.startX) / this.width) * 100 - this.index * 100, 0);
      this.disableScroll();
    }
  };

  // 拖拽结束
  touchend = e => {
    this.endX = e.changedTouches[0].clientX;
    this.endY = e.changedTouches[0].clientY;

    let disX = Math.abs(this.endX - this.startX);
    let disY = Math.abs(this.endY - this.startY);

    if (!this.wasSticky()) return;

    let direction = this.endX - this.startX > 0 ? -1 : 1; // -1上一页，1下一页
    let threshold = Math.abs(this.startX - this.endX) > this.width / 3; // 滑动超过1/3，滚到下一页

    if (this.isSwipe(disX, disY) && threshold) {
      // 不移动场景: 第一页右滑 || 最后一页左滑
      const disableSwipe =
        (this.index <= 0 && this.endX > this.startX) ||
        (this.index >= this.frames.length - 1 && this.endX < this.startX);
      if (disableSwipe) return;

      this.index = this.index + direction;
      this.handleEndFrames();
      setTimeout(() => {
        // 避免白屏
        formatTabs(this.tabs, this.index);
      }, 0);
    } else {
      formatTabs(this.tabs, this.index);
    }

    this.animate(-this.index * 100);
    this.recoverScroll();
  };

  // 横滑，横向角度 > 45度
  isSwipe(disX, disY) {
    const clientY = this.roller.getBoundingClientRect().y;
    return clientY === this.startClientY && Math.abs(disX / disY) > 1;
  }

  // 恢复body滚动行为，为了横竖滚动互斥
  recoverScroll() {
    document.body.style.overflowY = 'scroll';
  }
  // 禁止doby滚动行为，为了横竖滚动互斥
  disableScroll() {
    document.body.style.overflowY = 'hidden';
  }

  // 定位跳转
  go(index) {
    this.index = index;
    this.animate(-this.index * 100);
  }

  // 处理其他frames
  handleStartFrames() {
    const BD = document.body;
    const DE = document.documentElement;
    this.ST = Math.max(BD.scrollTop, DE.scrollTop);

    this.tabs.forEach((tab, idx) => {
      tab._height = 'auto';
      tab._overflow = 'visible';
      if (this.index !== idx) {
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

  // 处理其他frames
  handleEndFrames() {
    const scrollTop = this.ST - this.tabs[this.index]._marginTop;
    this.tabs[this.index]._marginTop = 0;
    document.body.scrollTop = scrollTop;
    document.documentElement.scrollTop = scrollTop;

    this.tabs.forEach((tab, idx) => {
      if (this.index !== idx) {
        const ST = tab._scrollTop || 0;
        if (ST > 0) {
          tab._marginTop = scrollTop - tab._scrollTop;
        } else {
          tab._marginTop = `${scrollTop + this.tabsOH - this.rollerOT - ST}`;
        }
      }
    });
  }

  // 判定吸顶状态
  wasSticky() {
    const top = this.tabsEl.getBoundingClientRect().y;
    return Math.abs(top - this.stickyTop) <= 1; // 允许1px误差
  }
}
