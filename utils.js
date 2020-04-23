const randomId = () => {
  return [...Array(4)]
    .map(_ => ((10 + Math.random() * 26) | 0).toString(36))
    .join('')
    .toUpperCase();
};

module.exports = { randomId };
