import _ from 'lodash';
import Store from './store';
import { STORE_NAME } from './constants';
import { mapMixinKeys } from '../../utils';
import { mapState, mapActions } from 'vuex';

export const mcSnackbarPlugin = {
  install (Vue, options) {
    const { store } = options;
    const uiStore = new Store();
    const module = uiStore.extractModule();
    store.registerModule(uiStore.storeName, module);

    Vue.mixin({
      computed: {
        ...mapState(STORE_NAME, {
          ...mapMixinKeys(_.keys(module.state)),
        }),
      },
      methods: {
        ...mapActions(STORE_NAME, {
          ...mapMixinKeys(_.keys(module.actions)),
        }),
      },
    });
  },
};
