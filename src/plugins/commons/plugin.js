import Store, { STORE_NAME } from './store';
import {
  // installComponentsSync,
  installStoreModule,
} from '../../utils/plugin';

export const mcCommonsPlugin = {
  install (Vue, { sdk, store }) {
    installStoreModule(Vue, new Store(sdk).extractModule(), {
      store,
      STORE_NAME,
    });
  },
};
