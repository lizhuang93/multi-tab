// 洗一下数据
export const formatTabs = (tabs, tabIndex) => {
  tabs.forEach((tab, idx) => {
    if (idx === tabIndex) {
      tab._height = 'auto';
      tab._overflow = 'visible';
    } else {
      tab._height = 0;
      tab._overflow = 'hidden';
    }
  });
};

export const throttle = (fn, delay = 200) => {
  let last = 0;
  return function(...args) {
    let now = Date.now();
    if (now - last < delay) {
      clearTimeout(fn.timer);
      fn.timer = setTimeout(fn.bind(this, args), delay);
    } else {
      fn.apply(this, args);
      last = now;
    }
  };
};

export const debounce = (fn, delay = 200) => {
  return function(...args) {
    clearTimeout(fn.timer);
    fn.timer = setTimeout(fn.bind(this, args), delay);
  };
};

// 获取元素的位置
export function getOffset(child, parent) {
  parent = parent || document.body;

  let [left, top] = [0, 0];

  while (child && child !== parent) {
    left += child.offsetLeft;
    top += child.offsetTop;
    child = child.offsetParent;
  }

  return { left, top };
}
