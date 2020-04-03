import { mapSetters, initLogger } from '../../utils';
import _ from 'lodash';

export const STORE_NAME = 'commons';
const log = initLogger(STORE_NAME);

export default class Store {
  constructor () {
    this.state = {
      // NOTE: renamed to state.global-snackbar.queue
      snackbarQueue: [],
    };

    this.getters = {};

    this.actions = {
      // NOTE: dispatch global-snackbar/enqueueSnack
      enqueueSnack: async ({ state, commit }, options) => {
        const { snackbarQueue } = state;
        log('enqueueSnack#snack: %O', options);
        commit('setSnackbarQueue', _.concat(snackbarQueue, options));
      },
      // NOTE: dispatch global-snackbar/dequeueSnack
      dequeueSnack: async ({ state, commit }) => {
        const { snackbarQueue } = state;
        commit('setSnackbarQueue', _.drop(snackbarQueue));
        log('dequeueSnack#snack: %O', _.head(snackbarQueue));
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
