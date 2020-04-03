import { initLogger } from '../utils/logger';
import _ from 'lodash';

const log = initLogger('mixins/print-ready');

const loadPic = picURL => new Promise((resolve, reject) => {
  try {
    const img = new window.Image();
    img.src = picURL;
    img.onload = () => resolve(true);
  } catch (e) {
    reject(e);
  }
});
let resolveFn;
const headerLoadState = new Promise(resolve => {
  resolveFn = resolve;
});

export default {
  data () {
    return {
      headerLoadState,
      picLoadStates: [],
    };
  },
  methods: {
    $onHeaderReady: resolveFn,
    async $registerPicHeader (picURL) {
      await loadPic(picURL) && this.$onHeaderReady();
    },
    $registerPicURLs (...picURLs) {
      const normalizedPicURLs = _.filter(_.flatten(picURLs), Boolean);
      log('registerPicURLs#normalizedPicURLs: %O', normalizedPicURLs);

      this.picLoadStates = [
        ...this.picLoadStates,
        ..._.map(normalizedPicURLs, loadPic),
      ].filter(Boolean);
    },
    async $waitUntilPrintReady () {
      const headerLoadState = await this.headerLoadState;
      log(`waitUntilPrintReady#headerLoadState: ${headerLoadState}`);
      const picLoadStates = await Promise.all(this.picLoadStates);
      log('waitUntilPrintReady#picLoadStates: %O', picLoadStates);

      // wait until next tick
      await new Promise(resolve => this.$nextTick(resolve));

      if (_.every(picLoadStates)) return true;
      return false;
    },
  },
};
