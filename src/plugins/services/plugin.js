import Store, { STORE_NAME } from './store';
import {
  // installComponentsSync,
  installStoreModule,
} from '../../utils/plugin';

export const mcServicesPlugin = {
  install (Vue, { sdk, store }) {
    // installComponentsSync(Vue, [
    //   import('../../components/path/to/component/a'),
    //   import('../../components/path/to/component/b'),
    // ]);

    const module = new Store(sdk).extractModule();

    installStoreModule(Vue, module, {
      dontInstallMixin: true,
      store,
      STORE_NAME,
    });
  },
};
