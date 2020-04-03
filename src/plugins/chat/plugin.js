import Store, { STORE_NAME } from './store';
// import { installComponentsSync } from '../../utils/plugin';
import { installStoreModule } from '../../utils/plugin';

export const mcChatPlugin = {
  install (Vue, { sdk, store }) {
    // installComponentsSync(Vue, [
    //   require('../../components/chat/chat')
    // ]);

    installStoreModule(Vue, new Store(sdk).extractModule(), {
      dontInstallMixin: true,
      store,
      STORE_NAME,
    });
  },
};
