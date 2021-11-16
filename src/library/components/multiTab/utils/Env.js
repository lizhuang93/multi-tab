export default {
  // Test via a getter in the options object to see if the passive property is accessed
  supportPassive: (() => {
    let support = false;
    try {
      let opts = Object.defineProperty({}, 'passive', {
        get: function() {
          support = true;
          return support;
        },
      });
      window.addEventListener('test', null, opts);
    } catch (e) {}

    return support;
  })(),
};
