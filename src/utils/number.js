import _ from 'lodash';

export const subtract = (a, b) => {
  if (!_.isFinite(a)) return 0;
  if (!_.isFinite(b)) return 0;
  return +a - +b;
};

export const add = (a, b) => {
  if (!_.isFinite(a) && !_.isFinite(b)) return 0;
  if (!_.isFinite(a)) return +b;
  if (!_.isFinite(b)) return +a;
  return +a + +b;
};
