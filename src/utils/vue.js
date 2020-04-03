import { getSetterName } from './store';
import _ from 'lodash';

export const useModel = (prop = 'value', event = 'input') => ({
  get () {
    return this[prop];
  },
  set (value) {
    return this.$emit(event, value);
  },
});

/**
 * Creates a computed property to handle a syncable prop.
 *
 * @example
 * export default {
 *   props: ['myProp'],
 *   computed: {
 *     myPropModel: syncProp('myProp')
 *   }
 * }
 * // myPropModel is now a settable computed property
 * // :my-prop.sync is handled transparently
 *
 * @param {string} prop Prop name
 * @return {Object} Vue computed object with getter and setter.
 */
export const syncProp = prop => useModel(prop, `update:${prop}`);

/**
 * Creates a settable computed property to handle a prop in Vuex state.
 *
 * @example
 * export default {
 *   computed: {
 *     myPropModel: syncVuexState('namespace', 'myProp')
 *   }
 * }
 * // myPropModel is now a settable computed property
 * // accessing myPropModel will return the state in namespace.myProp
 * // mutating myPropModel will commit the corresponding mutation
 *
 * @param {string} namespace Vuex store namespace for state to sync
 * @param {string} prop Prop name for state to sync
 * @return {Object} Vue computed object with getter and setter.
 */
export const syncVuexState = (namespace, prop) => ({
  get () {
    return _.get(this.$store, ['state', namespace, prop]);
  },
  set (value) {
    return this.$store.commit(`${namespace}/${getSetterName(prop)}`, value);
  },
});
