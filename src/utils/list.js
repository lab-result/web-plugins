import _ from 'lodash';

/**
 * Pushes items to the start of an array. Does not mutate the array.
 *
 * @example
 * console.log(pushStart([1, 1, 1], 2));
 * // [2, 1, 1, 1]
 * console.log(pushStart([1, 1, 1], 1, 2, 3));
 * // [3, 2, 1, 1, 1, 1]
 *
 * @param {any[]} arr - Array to push to.
 * @param {...any} items - Items to push into the start of the array.
 * @return {any[]} Resulting array.
 */
export const pushStart = (arr, ...items) => [..._.reverse(items), ...arr];

/**
 * Like {@link pushStart}, but pushes to the end. Does not mutate the array.
 *
 * @example
 * console.log(pushEnd([1, 1, 1], 2));
 * // [1, 1, 1, 2]
 * console.log(pushEnd([1, 1, 1], 1, 2, 3));
 * // [1, 1, 1, 1, 2, 3]
 */
export const pushEnd = (arr, ...items) => [...arr, ...items];

/**
 * Sets the given index of the array to the given value. Does not mutate the
 * array.
 *
 * @example
 * console.log(setIndex(['foo', 'bar', 'baz'], 1, 'quax'))
 * // ['foo', 'quax', 'baz']
 *
 * @param {any[]} arr - Array to change.
 * @param {number} index - Index of element to be set.
 * @param {any} value - Value to set.
 * @return {any[]} Resulting array.
 */
export const setIndex = (arr, index, value) => arr.map((v, i) =>
  i === index ? value : v);

/**
 * Removes the element with the given index from the array. Does not mutate the
 * array.
 *
 * @example
 * console.log(removeIndex(['foo', 'bar', 'baz'], 1))
 * // ['foo', 'baz']
 *
 * @param {any[]} arr - Array to remove from.
 * @param {number} index - Index of element to be removed.
 * @return {any[]} Resulting array.
 */
export const removeIndex = (arr, index) => arr.filter((v, i) =>
  i !== index);

/**
 * Pads an array if necessary to reach a minimum length. The provided padding
 * item is appended to the array.
 *
 * @example
 * console.log(padEnd(['foo', 'bar'], 5, '--'));
 * // ['foo', 'bar', '--', '--', '--']
 *
 * @param {any[]} arr - Array to pad.
 * @param {number} length - Minimum length of the resulting padded array.
 * @param {any} item - Item to pad if arr does not meet the minimum length.
 * @return {any[]} The padded array.
 */
export const padEnd = (arr = [], length, item) => arr.length > length
  ? arr
  : _.concat(arr, Array(length - arr.length).fill(item));

/**
 * Assigns a weight property to each item in an array based on their order.
 * Items can be grouped into a sub-array to assign equal weights to them. Useful
 * for calculating weights of queue items.
 *
 * @example
 * console.log(assignWeight([{}, {}, {}]));
 * // [{weight: 0}, {weight: 1}, {weight: 2}]
 * console.log(assignWeight([{}, [{auto: true}, {auto: true}], {}]));
 * // [{weight: 0}, {auto: true, weight: 1}, {auto: true, weight: 1}, {weight: 2}]
 *
 * @param {Object[]} arr - Array of objects to which weights must be assigned.
 * @param {number} [startAt=0] - Minimum weight to start at.
 * @return {Object[]} Flat array of all weighted objects.
 */
export const assignWeight = (arr, initialIndex = 0) => (
  arr.flatMap((item, i) => _.isArray(item)
    ? item.map(v => ({ ...v, weight: +initialIndex + i }))
    : ({ ...item, weight: +initialIndex + i }))
);

/**
 * Sorts array of objects whether by ascending or descending.
 *
 * @example
 * console.log(sortArrayOfObject([{ foo: '2' }, { foo: '1' }], true, 'foo'));
 * // [{ foo: '1' }, { foo: '2' }]
 * console.log(sortArrayOfObject([{ foo: 1 }, { foo: 2 }], false, 'foo'));
 * // [{ foo: 2 }, { foo: 1 }]
 *
 * @param {Object[]} arr - Array of object to be sorted.
 * @param {boolean} isAscending - Sort specs.
 * @param {string} sortKey - Key to be sorted.
 */
export const sortArrayOfObject = (arr, isAscending, sortKey) => arr
  .sort((item1, item2) => {
    if (!item1[sortKey]) return 0;
    if (!item2[sortKey]) return 0;
    const a = item1[sortKey];
    const b = item2[sortKey];

    return isAscending
      ? a > b ? 1 : -1
      : a < b ? 1 : -1;
  });

/**
 * Finds the intersection of elements between two arrays.
 *
 * An object of keys is first built to check values against, to allow for O(n)
 * to get the intersection instead of a naive nested loop for O(n^2).
 *
 * To compare arrays of objects, pass in a third `path` parameter to use for
 * extracting an identifying key (e.g. 'id').
 *
 * @example
 * const arr1 = ['foo', 'bar', 'baz'];
 * const arr2 = ['bar', 'baz', 'quax'];
 * console.log(intersect(arr1, arr2));
 * // ['bar', 'baz']
 *
 * const objArr1 = [{id: 1}, {id: 2}, {id: 3}];
 * const objArr2 = [{id: 2}, {id: 4}, {id: 6}];
 * console.log(intersect(objArr1, objArr2, 'id'));
 * // [{id: 2}]
 *
 * @param {any[]} arr1
 * @param {any[]} arr2
 * @param {String} [path] - Path for extracting an ID for comparing objects.
 * @return {any[]} Intersection of arr1 and arr2.
 */
export const intersect = (arr1, arr2, path) => {
  arr1 = arr1 || [];
  arr2 = arr2 || [];
  const map = arr1.reduce((acc, val) => {
    const key = _.isObject(val) ? val[path] : val;
    return _.set(acc, key, val);
  }, {});
  const filtered = arr2.filter(val => {
    const key = _.isObject(val) ? val[path] : val;
    return _.has(map, key);
  });
  const merged = filtered.map(val => {
    if (!_.isObject(val)) return val;

    const other = _.get(map, val[path]);
    return { ...other, ...val };
  });
  return merged;
};

/**
 * Finds the set difference between two arrays. That is, all elements of the
 * first array that are not also elements of the second array.
 *
 * Has the same object-building optimization as {@link intersect}.
 *
 * To compare arrays of objects, pass in a third `path` parameter to use for
 * extracting an identifying key (e.g. 'id').
 *
 * @example
 * const arr1 = ['foo', 'bar', 'baz'];
 * const arr2 = ['bar', 'baz', 'quax'];
 * console.log(subtract(arr1, arr2));
 * // ['foo']
 *
 * const objArr1 = [{id: 1}, {id: 2}, {id: 3}];
 * const objArr2 = [{id: 2}, {id: 4}, {id: 6}];
 * console.log(subtract(objArr1, objArr2, 'id'));
 * // [{id: 1}, {id: 3}]
 *
 * @param {any[]} arr1
 * @param {any[]} arr2
 * @param {String} [path] - Path for extracting an ID for comparing objects.
 * @return {any[]} Intersection of arr1 and arr2.
 */
export const subtract = (arr1, arr2, path) => {
  // build a map from arr2, since we'll be comparing against arr2
  const map = arr2.reduce((acc, val) => {
    const key = _.isObject(val) ? val[path] : val;
    return _.set(acc, key, val);
  }, {});
  const filtered = arr1.filter(val => {
    const key = _.isObject(val) ? val[path] : val;
    return !_.has(map, key);
  });
  return filtered;
};

function increment (arr, bounds, index = 0) {
  const result = [...arr];
  const max = bounds[index];
  if (index >= arr.length) return null;
  if (+arr[index] < max - 1) {
    result[index]++;
    return result;
  } else {
    result[index] = 0;
    return increment(result, bounds, index + 1);
  }
}
function * walkCombinations (arr2d) {
  let state = Array(arr2d.length).fill(0);
  const bounds = arr2d.map(arr => arr.length);
  while (state !== null) {
    yield arr2d.map((arr, i) => arr[state[i]]);
    state = increment(state, bounds);
  }
}

/**
 * Generates all combinations (as in combinatorics) of the given sets of
 * elements.
 *
 * The generated combinations will contain one element from each of the given
 * arrays: first element will be from the first array, second element from the
 * second array, and so on.
 *
 * @example
 * console.log(getCombinations(['soft', 'hard'], ['red', 'blue', 'green']));
 * // [
 * //   ['soft', 'red'],
 * //   ['hard', 'red'],
 * //   ['soft', 'blue'],
 * //   ['hard', 'blue'],
 * //   ['soft', 'green'],
 * //   ['hard', 'green'],
 * // ]
 *
 * @param {...any[]} arrs - The arrays from which elements will be taken for
 *                          generating combinations.
 * @return {any[][]} The generated combinations.
 */
export const getCombinations = (...arrs) => [...walkCombinations(arrs)];

const sumObjValues = (a, b) => _.mergeWith(a, b, (x = 0, y = 0) => +x + +y);

/**
 * Sums a list of corresponding object values.
 *
 * @example
 * const arr = [{a: 2, b: 5}, {a: 3, b: 5}];
 * console.log(sumObjects(arr));
 * // {a: 5, b: 10}
 *
 * @param {Object[]} arr - Array of objects whose values will be summed.
 * @return {Object} Object whose keys contain the sums of all corresponding
 * values in the given array.
 */
export const sumObjects = arr => arr.reduce(sumObjValues, {});

const rangeGenerator = function * (start, end) {
  for (let i = start; i <= end; i++) {
    yield i;
  }
};

export const range = (firstArg, secondArg) => {
  let start;
  let end;

  if (_.isNil(secondArg)) {
    // case: range(n), count from 1 to n
    start = 1;
    end = firstArg;
  } else {
    // case: range(start, end), count from start to end
    start = firstArg;
    end = secondArg;
  }

  return [...rangeGenerator(start, end)];
};
