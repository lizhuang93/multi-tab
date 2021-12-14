const isNode = typeof global !== 'undefined';

let pre = Date.now();

function fallback(fn) {
  const now = Date.now();
  const ms = Math.max(0, Math.max(16 - (now - pre), 0));
  const id = setTimeout(fn, ms);
  pre = now + ms;
  return id;
}

const root = isNode ? global : window;
const iRaf = root.requestAnimationFrame || root.webkitRequestAnimationFrame || fallback;
const iCancel = root.cancelAnimationFrame || root.webkitCancelAnimationFrame || root.clearTimeout;

export function raf(fn) {
  return iRaf.call(root, fn);
}

export function cancel(id) {
  iCancel.call(root, id);
}
