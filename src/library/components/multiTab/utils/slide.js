import Env from './Env';
import Emitter from './emitter';

export default class Slide extends Emitter {
  constructor(params) {
    super();
    this.index = params.index;
    this.roller = params.roller;
    this.width = this.roller.offsetWidth;
    this.frames = params.roller.children;

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
    const transform = `translateX(${offset}%)`;
    this.emit('next', { index: this.index, transform, transition });
  }

  // 拖拽开始
  touchstart = e => {
    // 暂停轮播
    this.x1 = e.touches[0].pageX;
    this.x2 = e.touches[0].pageX;
    this.y1 = e.touches[0].pageY;
    this.y2 = e.touches[0].pageY;

    this.setMargin();
  };

  // 拖拽过程
  touchmove = e => {
    e.preventDefault();
    this.x2 = e.touches[0].pageX;
    this.y2 = e.touches[0].pageY;

    // 不移动: 第一页右滑 || 最后一页左滑
    const noMove =
      (this.index <= 0 && this.x2 > this.x1) || (this.index >= this.frames.length - 1 && this.x2 < this.x1);
    if (noMove) return;

    // 横向角度 > 30度角
    if (this.than30Deg()) {
      this.animate(((this.x2 - this.x1) / this.width) * 100 - this.index * 100, 0);
    }
  };

  // 拖拽结束
  touchend = e => {
    let direction = this.x1 - this.x2 > 0 ? 1 : -1;
    let threshold = this.than30Deg() && Math.abs(this.x1 - this.x2) > this.width / 3;

    if (threshold) {
      this.index = this.index + direction;
      if (this.index < 0) {
        this.index = 0;
      } else if (this.index >= this.frames.length) {
        this.index = this.frames.length - 1;
      }
    }
    this.animate(-this.index * 100);
  };

  than30Deg() {
    return Math.abs((this.x2 - this.x1) / (this.y2 - this.y1)) > 1.73;
  }

  // 定位跳转
  go(index) {
    this.index = index;
    this.animate(-this.index * 100);
  }

  setMargin() {
    const BD = document.body;
    const DE = document.documentElement;
    const ST = Math.max(BD.scrollTop, DE.scrollTop);
    const OT = this.roller.offsetTop;
    console.log(ST, OT);
    console.log(this.frames);
    Array.from(this.frames).forEach((el, idx) => {
      console.log(el);
      if (this.index !== idx) {
        el.style.marginTop = `${ST - OT}px`;
      }
    });
  }
}
