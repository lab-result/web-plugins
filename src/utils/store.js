import { initLogger as initRootLogger } from './logger';
import _ from 'lodash';

const STORE_NAMESPACE = 'store';
/**
 * Initializes a namespaced logger, for use primarily within store modules.
 *
 * @example
 * import { initLogger } from '@/mc-store/utils';
 * const STORE_NAME = 'foo';
 * const log = initLogger(STORE_NAME);
 * // ...
 * log('foo was logged');
 *
 * @param {string} namespace - Namespace for the store module.
 * @return {function(message: string): void} Log function.
 */
export const initLogger =
  namespace => initRootLogger(`${STORE_NAMESPACE}:${namespace}`);

export const getSetterName = prop => `set${_.upperFirst(prop)}`;
const setGenericProp = prop => (s, val) => {
  s[prop] = val;
};
/**
 * Creates setter mutations dynamically, based on passed-in props.
 *
 * @example
 * const mutations = {
 *   ...mapSetters(['foo', 'bar', 'baz'])
 * };
 * // Will create `setFoo`, `setBar`, and `setBaz` mutations setting their
 * // corresponding props in state.
 *
 * @param {string[]} props - Array of state props to map setters for.
 * @return {Object} Contains all mapped setters. Spread into mutations.
 */
export const mapSetters = props =>
  _.zipObject(props.map(getSetterName), props.map(setGenericProp));

/**
 * Creates mixin keys dynamically, based on passed-in props.
 *
 * @example
 * export default {
 *   computed: {
 *     ...mapState('module', {
 *       ...mapMixinKeys(['foo', 'bar'])
 *     })
 *   }
 * };
 * // Will create {$foo: 'foo', $bar: 'bar'} key pairs
 *
 * @param {string[]} props - Array of keys to map mixin keys for.
 * @return {Object} Contains all mapped mixin keys. Spread into mapState or
 * mapActions.
 */
export const mapMixinKeys = props =>
  props.reduce((acc, key) => ({ ...acc, [`$${key}`]: key }), {});

const getAccessors = (store, namespace, prop) => ({
  get () {
    return _.get(store.state, [namespace, prop]);
  },
  set (val) {
    return store.commit(`${namespace}/${getSetterName(prop)}`, val);
  },
});
/**
 * Creates reactive props, which use computed properties to expose state props
 * and computed setters to transparently commit mutations.
 *
 * @example
 * export default {
 *   computed: {
 *     $module: mapReactiveProps(store, 'module', ['foo'])
 *   }
 * }
 * // this.$module.foo         will return this.$store.state.module.foo
 * // this.$module.foo = 'bar' will call this.$store.commit('module/setFoo', 'bar')
 *
 * @param {string} namespace - Store module namespace.
 * @param {string[]} props - Array of keys to create reactive props for.
 * @return {Object} Contains all reactive props.
 */
export const mapReactiveProps = (store, namespace, props) =>
  props.reduce((acc, prop) => Object.defineProperty(acc, prop, {
    configurable: true,
    enumerable: true,
    ...getAccessors(store, namespace, prop),
  }), {});

/**
 * Normalizes nested $populated from an object. Also normalizes objects under
 * array keys.
 *
 * @example
 * const result = {
 *   a: 1,
 *   b: 2,
 *   $populated: {
 *     c: {
 *       d: 3,
 *       $populated: {e: 4},
 *     },
 *     f: [{g: 5, $populated: {h: 6}}]
 *   }
 * };
 * const normalizedResult = normalizePopulated(result);
 * console.log(normalizedResult);
 * // {a: 1, b: 2, c: {d: 3, e: 4}, f: [{g: 5, h: 6}]}
 *
 * @param {any} val - Object or array of objects to normalize.
 * @return {any} Same object or array, but $populated contents spread into
 * parent.
 */
export const normalizePopulated = val => {
  if (_.isArray(val)) {
    return _.map(val, normalizePopulated);
  } else if (_.isObject(val)) {
    return {
      ..._.omit(val, '$populated'),
      ..._.mapValues(val.$populated, normalizePopulated),
    };
  } else {
    return val;
  }
};

/**
 * Adds pagination controls to an existing query. Use a sorted query for
 * well-defined behavior.
 *
 * @example
 * const query = {facility, $sort: {createdAt: -1}};
 * const { items } = await core.medical.patients()
 *   .find(paginateQuery({query, pageNo: 5}));
 * console.log(items);
 * // 20 patients on page 5
 *
 * @param {Object} opts
 * @param {Object} opts.query - Query to add pagination controls to.
 * @param {number} [opts.pageNo=1] - Page number to fetch.
 * @param {number} [opts.pageSize=20] - Number of items per page.
 * @param {string} [opts.skipOp='$skip'] - Skip operator to use.
 * @param {string} [opts.limitOp='$limit'] - Limit operator to use.
 * @return {Object} Final query to produce paginated results.
 */
export const paginateQuery = ({
  query = {},
  pageNo,
  pageSize,
  skipOp = '$skip',
  limitOp = '$limit',
}) => ({
  ...query,
  [skipOp]: _.isNumber(pageNo) && _.isNumber(pageSize)
    ? pageSize * (pageNo - 1) : 0,
  [limitOp]: _.isNumber(pageNo) && _.isNumber(pageSize)
    ? pageSize : void 0,
});

/**
 * Limits a query to within a date range.
 *
 * @example
 * const query = {facility, type: 'laboratory'};
 * const { items } = await core.diagnostic.orderTests()
 *   .find(limitQueryByDate({
 *     query,
 *     startDate: new Date('2019-03-08').getTime(),
 *     endDate: new Date('2019-03-09').getTime(),
 *     key: 'createdAt'
 *   }));
 * console.log(items);
 * // all items created between 2019-03-08 and 2019-03-09
 *
 * @param {Object} opts
 * @param {Object} opts.query - Query to add date limiting to.
 * @param {Date} opts.startDate - Start of date range.
 * @param {Date} opts.endDate - End of date range.
 * @param {string} [opts.key='createdAt'] - Key for date field to limit by.
 * @return {Object} Final query to produce date-range-limited results.
 */
export const limitQueryByDate = ({
  query = {},
  startDate,
  endDate,
  key = 'createdAt',
}) => {
  if (!startDate || !endDate) return query;
  return {
    ...query,
    [key]: { $gte: startDate, $lte: endDate },
  };
};

/**
 * Adds a regex search to the query, using the given keys.
 *
 * @example
 * const { items } = await core.personalDetails()
 *   .find(searchQueryViaRegex({
 *     query,
 *     searchText,
 *     keys: ['name.firstName', 'name.lastName']
 *   }));
 * console.log(items);
 * // all items with either first or last names matching the regex
 *
 * @param {Object} opts
 * @param {Object} opts.query - Query to add search to.
 * @param {string} opts.searchText - Search text to be used for regex search.
 * @param {string[]} opts.keys - Keys to search.
 * @return {Object} Final query for regex searching.
 */
export const searchQueryViaRegex = ({
  query = {},
  searchText,
  keys = ['name.firstName', 'name.lastName'],
}) => _.isEmpty(searchText)
  ? query
  : ({
    ...query,
    $or: [...query.$or || [], ..._.map(keys, key => ({
      [key]: { $regex: `^${searchText}`, $options: 'i' },
    }))],
  });

/**
 * Injects org family ids to the query.
 *
 * @example
 * const { items } = await core.personalDetails()
 *   .find(injectQueryWithOrgFamily({ query, org, key: 'facility' }));
 * console.log(items);
 * // all items will be related to the org and org's family members
 *
 * @param {Object} opts
 * @param {Object} opts.query - Query to add search to.
 * @param {Object} opts.org - Organization data.
 * @param {string[]} opts.key - Key to inject org ids query.
 * @return {Object} Final query for injecting org ids.
 */
export const injectQueryWithOrgFamily = ({
  query = {},
  org,
  key = 'organization',
}) => {
  if (typeof org !== 'object' || _.isEmpty(org)) return query;
  const parent = typeof org.parent === 'object'
    ? _.get(org, 'parent.id')
    : org.parent;
  const ids = [org._ch, org._sb, parent, org.id];
  const $in = _.filter(_.uniq(_.flatten(ids)), Boolean);
  query[key] = _.size($in) === 1 ? $in[0] : { $in };

  return query;
};

const lift = fn => opts => query => fn({ ...opts, query });

/**
 * Composable versions of query helper functions like {@link paginateQuery}.
 *
 * @example
 * import { compose } from '@/utils/fn';
 * import { fp } from '@/utils/store;'
 *
 * const query = {facility, type: 'laboratory'};
 * const composeQuery = compose(
 *   fp.limitQueryByDate({startDate, endDate}),
 *   fp.paginateQuery({pageNo, pageSize})
 * );
 * const { items } = await core.diagnostic.orderTests()
 *   .find(composeQuery(query));
 * // query with date limits c/o limitQueryByDate
 * // and pagination c/o paginateQuery
 */
export const fp = {
  paginateQuery: lift(paginateQuery),
  limitQueryByDate: lift(limitQueryByDate),
  searchQueryViaRegex: lift(searchQueryViaRegex),
  injectQueryWithOrgFamily: lift(injectQueryWithOrgFamily),
};
