import { STORE_NAME } from './constants';
import Store from './store';
import {
  installStoreModule,
} from '../../utils/plugin';

export const mcTablePlugin = {
  install (Vue, { sdk, store }) {
    installStoreModule(Vue, new Store(sdk).extractModule(), {
      dontInstallMixin: true,
      store,
      STORE_NAME,
    });
  },
};
