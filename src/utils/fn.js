import _ from 'lodash';

/**
 * Composes functions (as in functional composition in mathematics). For two
 * functions, f and g, the composed function is simply x => f(g(x)).
 *
 * Take note of the order! Last argument is the innermost function, which is
 * applied first.
 *
 * All functions are also required to be unary (1 argument only) except the
 * innermost function, which may be variadic (any number of arguments).
 *
 * @example
 * const add5 = x => x + 5;
 * const square = x => x * x;
 * const double = x => x * 2;
 * const getDoubleOfTheSquareOfXPlus5 = compose(
 *   double,
 *   square,
 *   add5
 * );
 * console.log(getDoubleOfTheSquareOfXPlus5(1));
 * // 72
 *
 * // x is 1...
 * // plus 5 = 6...
 * // squared = 36...
 * // doubled = 72
 *
 * @param {function(x: any): any} fns - Functions to compose, which will be
 *                                      called in reverse order.
 * @return {function(...x: any): any} The composed function.
 */
export const compose = (...fns) => (...args) => {
  const reverse = _.reverse(fns);
  // first is variadic, rest should be unary
  const first = _.head(reverse);
  const rest = _.tail(reverse);
  return rest.reduce((prev, fn) => fn(prev), first(...args));
};

/**
 * Composes functions like {@link compose}, but with a dot-chainable API.
 *
 * Take note of the order! chainCompose applies each function right after
 * binding, so the first chained function will be the innermost function.
 *
 * As with {@link compose}, all functions must be unary (1 argument only) except
 * the innermost function, which may be variadic (any number of arguments).
 *
 * @example
 * const add5 = x => x + 5;
 * const square = x => x * x;
 * const double = x => x * 2;
 * const doubleOfTheSquareOfXPlus5 = chainCompose(1)
 *   .chain(add5)
 *   .chain(square)
 *   .chain(double)
 *   .value();
 * console.log(doubleOfTheSquareOfXPlus5);
 * // 72
 *
 * // x is 1...
 * // plus 5 = 6...
 * // squared = 36...
 * // doubled = 72
 *
 * @typedef ChainComposer
 * @property {function(x: any): any} chain - Chains the next function.
 * @property {function(): any} value - Completes the chain and returns the last value.
 *
 * @param {...any} args - Initial arguments, to be passed to the innermost function.
 * @return {ChainComposer} Wrapped object to allow dot-chaining.
 */
export const chainCompose = (...args) => ({
  chain: fn => chainCompose(fn(...args)),
  value: () => _.size(args) > 1 ? args : _.head(args),
});
