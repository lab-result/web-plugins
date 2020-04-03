const MAX_SAFE_INTEGER = 9007199254740991;

/**
 * A simple way to clone deep but may result to some data loss.
 * @see https://stackoverflow.com/a/122704 for more info.
 *
 * @example
 * const a = {
 *   string: 'string',
 *   number: 123,
 *   bool: false,
 *   nul: null,
 *   date: new Date(),  // stringified
 *   undef: undefined,  // lost
 *   inf: Infinity,  // forced to 'null'
 * }
 * console.log(cloneDeep(a));
 * // => {
 *   "string": "string",
 *   "number": 123,
 *   "bool": false,
 *   "nul": null,
 *   "date": "2020-01-22T08:50:24.233Z",
 *   "undef": undefined,
 *   "inf": Infinity,
 * }
 *
 * @param {Object} obj
 * @returns {Object}
 */
export const cloneDeep = obj => obj && JSON.parse(JSON.stringify(obj));

/**
 * Checks if `value` is a valid array-like length.
 *
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * isLength(3)
 * // => true
 * isLength(Number.MIN_VALUE)
 * // => false
 * isLength(Infinity)
 * // => false
 * isLength('3')
 * // => false
 */
export const isLength = v => typeof v === 'number' && v > -1 && v % 1 === 0 && v <= MAX_SAFE_INTEGER;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * isArrayLike([1, 2, 3])
 * // => true
 * isArrayLike(document.body.children)
 * // => true
 * isArrayLike('abc')
 * // => true
 * isArrayLike(Function)
 * // => false
 */
export const isArrayLike = v => v != null && typeof v !== 'function' && isLength(v.length);

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
export const getTag = v => {
  if (v === null) {
    return v === undefined ? '[object Undefined]' : '[object Null]';
  }
  return Object.prototype.toString.call(v);
};

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
export const isPrototype = v => {
  const Ctor = v && v.constructor;
  const proto = (typeof Ctor === 'function' && Ctor.prototype) || Object.prototype;
  return v === proto;
};

/**
 * Checking of object if is empty.
 *
 * @example
 * console.log(isEmpty(null)
 * // output: true
 * console.log(isEmpty('')
 * // output: true
 * console.log(isEmpty({})
 * // output: true
 * console.log(isEmpty([])
 * // output: true
 * console.log(isEmpty({a: '1'})
 * // output: false
 *
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is empty, else `false`.
 */
export const isEmpty = value => {
  if (value === null) return true;
  if (typeof value === 'function') return true;

  if (isArrayLike(value) && (Array.isArray(value) || typeof value === 'string' ||
    typeof value.splice === 'function')) {
    return !value.length;
  }

  const tag = getTag(value);
  if (tag === '[object Map]' || tag === '[object Set]') return !value.size;
  if (isPrototype(value)) return !Object.keys(value).length;
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      return false;
    }
  }
  return true;
};

/**
 * Creates an object composed of the picked `object` properties.
 *
 * @example
 * const object = { 'a': 1, 'b': '2', 'c': 3 }
 * pick(object, ['a', 'c'])
 * // => { 'a': 1, 'c': 3 }
 *
 * @param {Object} object The source object.
 * @param {string[]} keys The property paths to pick.
 * @returns {Object} Returns the new object.
 */
export const pick = (obj, keys = []) => {
  if (typeof obj !== 'object' || isEmpty(obj)) return {};
  if (!Array.isArray(keys)) return {};

  return keys.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) result[key] = obj[key];
    return result;
  }, {});
};

/**
 * Creates an object composed of the picked `object` properties.
 *
 * @example
 * const object = { 'a': 1, 'b': '2', 'c': 3 }
 * omit(object, ['a', 'c'])
 * // => { 'b': '2' }
 *
 * @param {Object} object The source object.
 * @param {string[]} keys The property paths to pick.
 * @returns {Object} Returns the new object.
 */
export const omit = (obj, keys) => {
  if (typeof obj !== 'object' || isEmpty(obj)) return {};
  if (!Array.isArray(keys) || !keys.length) return cloneDeep(obj);

  return keys.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) delete result[key];
    return result;
  }, cloneDeep(obj));
};

/**
 * Creates an object composed of the object properties predicate returns truthy for.
 *
 * @example
 * const object = { 'a': 1, 'b': null, 'c': 3, 'd': false, 'e': undefined };
 * pickBy(object)
 * // => {a: 1, c: 3}
 *
 * @param {Object} object The source object.
 * @param {string[]} keys The property paths to pick.
 * @returns {Object} Returns the new object.
 */
export const pickBy = (object) => {
  const obj = {};
  for (const key in object || {}) {
    if (object[key] !== null && object[key] !== false && object[key] !== undefined) {
      obj[key] = object[key];
    }
  }
  return obj;
};

/**
 * Produces a duplicate-free version of the array, using === to test object equality.
 *
 * @example
 * const arr = [1, 2, 1, 4, 1, 3]
 * uniq(arr)
 * // => [1, 2, 4, 3]
 *
 * @param {Array} array The array to inspect.
 * @returns {Array} Returns the new duplicate free array.
 */
export const uniq = (arr) => {
  if (!Array.isArray(arr) || !arr.length) return [];
  return [...new Set(arr)];
};

/**
 * This accepts `iteratee` which is invoked for each element in `array`
 * to generate the criterion by which uniqueness is computed. The order
 * of result values is determined by the order they occur in the array.
 * The iteratee is invoked with one argument: (value).
 *
 * @example
 * const arr = [{'id': 'a'}, {'id': 'a'}, {'id': 'b'}, null, null, undefined]
 * uniqBy(arr, 'id')
 * // => [{'id': 'a'}, {'id': 'b'}, null, undefined]
 *
 * @param {Array} array The array to inspect.
 * @param {Function} iteratee The iteratee invoked per element.
 * @returns {Array} Returns the new duplicate free array.
 */
export const uniqBy = (arr, predicate) => {
  if (!Array.isArray(arr) || !arr.length) return [];
  const cb = typeof predicate === 'function' ? predicate : (o) => o[predicate];

  return [...arr.reduce((map, item) => {
    const key = (item === null || item === undefined)
      ? item : cb(item);

    map.has(key) || map.set(key, item);

    return map;
  }, new Map()).values()];
};

/**
 * Recursively flattens `array`.
 *
 * @example
 * flattenDeep([1, [2, [3, [4]], 5]])
 * // => [1, 2, 3, 4, 5]
 *
 * @param {Array} arr The array to flatten.
 * @returns {Array} Returns the new flattened array.
 */
export const flattenDeep = (arr) => {
  // TODO: failing in test as jest doesn't support ES2019 yet
  // return arr.flatMap(subArray => Array.isArray(subArray)
  //   ? flattenDeep(subArray)
  //   : subArray);
  return Array.isArray(arr)
    ? arr.reduce((a, b) => a.concat(flattenDeep(b)), [])
    : [arr];
};
