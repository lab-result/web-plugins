import _ from 'lodash';

/**
 * Assigns props from src into dest, based on list of mappings passed.
 *
 * @example
 * const mappings = [
 *   {from: 'a.b', to: 'foo'},
 *   {from: 'a.c', to: 'bar'},
 *   {from: 'd', to: 'baz'}
 * ];
 * const src = {a: {b: 1, c: 2}, d: 3};
 * const dest = {};
 * genericAssign(mappings, src, dest);
 * console.log(dest);
 * // {foo: 1, bar: 2, baz: 3}
 *
 * @param {Object[]} mappings - List of mappings.
 * @param {string} mapping.from - Key for extraction from src object.
 * @param {string} [mapping.to] - Key for injection into dest object.
 * @param {function} [mapping.format=x => x] - Format function during mapping.
 * @param {boolean} [mapping.skipEmpty] - Skip setting if value in src object is nil.
 * @param {Object} src - Source object from which values are mapped.
 * @param {Object} dest - Destination object into which values are mapped.
 */
export const genericAssign = (mappings, src, dest) => {
  for (const mapping of mappings) {
    const { from, to = from, format = x => x, skipEmpty, provideSource } = mapping;
    const value = _.get(src, from);
    if (skipEmpty && _.isNil(value)) continue;
    _.set(dest, to, provideSource ? format(value, src) : format(value));
  }
};

/**
 * Non-mutative version of {@link genericAssign}.
 *
 * @param {Object[]} mappings
 * @param {Object} obj
 * @return {Object}
 */
export const genericTransform = (mappings, obj) => {
  const result = {};
  genericAssign(mappings, obj, result);
  return result;
};

export const getMissingKeys = (obj, keys) =>
  _.keys(_.pickBy(_.pick(obj, keys), _.isNil));

export const pickByDeep = (obj, pickBy) =>
  _.mapValues(_.pickBy(obj, pickBy), val => (
    _.isPlainObject(val)
      ? pickByDeep(val, pickBy)
      : val
  ));
