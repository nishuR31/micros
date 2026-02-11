let handler =
  (func) =>
  (...args) =>
    Promise.resolve(func(...args)).catch((err) => {
      console.error('Handler Error:', err);
      throw err;
    });

export default handler;
