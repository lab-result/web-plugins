import Store, { STORE_NAME } from './store';
import { installStoreModule } from '../../utils/plugin';

export const mcMedicalRecordsPlugin = {
  install (Vue, { sdk, store }) {
    installStoreModule(Vue, new Store(sdk).extractModule(), {
      dontInstallMixin: true,
      store,
      STORE_NAME,
    });
  },
};
