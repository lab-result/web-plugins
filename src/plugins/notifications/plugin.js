import Store, { STORE_NAME } from './store';
import {
  installStoreModule,
  // installComponentsSync
} from '../../utils/plugin';

export const mcNotificationsPlugin = {
  install (Vue, { sdk, store }) {
    // installComponentsSync(Vue, [
    //   require('../../components/notifications/notifications')
    // ]);

    installStoreModule(Vue, new Store(sdk).extractModule(), {
      dontInstallMixin: true,
      store,
      STORE_NAME,
    });
  },
};
