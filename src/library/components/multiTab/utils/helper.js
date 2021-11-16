export const throttle = (fn, delay = 100) => {
  let last = 0;
  return () => {
    let now = Date.now();
    if (now - last < delay) {
      clearTimeout(fn.timer);
      fn.timer = setTimeout(fn, delay);
    } else {
      fn();
      last = now;
    }
  };
};
