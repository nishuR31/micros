import handler from './handler.js';

let time = (amt, unit) =>
  handler(() => {
    const base = {
      ms: 1,
      s: 1000,
      sec: 1000,
      m: 1000 * 60,
      min: 1000 * 60,
      h: 1000 * 60 * 60,
      hr: 1000 * 60 * 60,
      d: 1000 * 60 * 60 * 24,
      day: 1000 * 60 * 60 * 24,
    };
    if (!base[unit]) throw new Error('Invalid unit: ' + unit);
    return +amt * base[unit.toLowerCase()];
  });

export default time;