// import _ from 'lodash';
import { STORE_NAME } from './constants';
import { mapSetters } from '../../utils';
import _ from 'lodash';

export default class Store {
  constructor () {
    this.storeName = STORE_NAME;
    this.state = {
      snackbarQueue: [],
    };
    this.getters = {};
    this.actions = {
      enqueueSnack: async ({ state, commit }, options) => {
        const { snackbarQueue } = state;
        commit('setSnackbarQueue', _.concat(snackbarQueue, options));
      },
      dequeueSnack: async ({ state, commit }) => {
        const { snackbarQueue } = state;
        commit('setSnackbarQueue', _.drop(snackbarQueue));
        return _.head(snackbarQueue);
      },
    };
    this.mutations = {
      ...mapSetters(Object.keys(this.state)),
    };
  }

  extractModule () {
    return {
      namespaced: true,
      state: this.state,
      getters: this.getters,
      actions: this.actions,
      mutations: this.mutations,
    };
  }
}
