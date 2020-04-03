import { mapState, mapGetters, mapActions } from 'vuex';
import { mapMixinKeys, mapReactiveProps } from './store';
import { log } from './logger';
import _ from 'lodash';

export const installComponentsSync = (Vue, components) => {
  try {
    for (const m of components) {
      Vue.component(m.COMPONENT_NAME, m.default);
    }
  } catch (e) {
    log('installComponentsSync#error: %O', e);
  }
};

export const installComponents = async (Vue, components) => {
  try {
    installComponentsSync(Vue, await Promise.all(components));
  } catch (e) {
    log('installComponents#error: %O', e);
  }
};

export const registerStoreModule = (Vue, module, { store, STORE_NAME }) => {
  store.registerModule(STORE_NAME, module);
};

export const installStoreMixin = (Vue, module, { STORE_NAME }) => {
  Vue.mixin({
    computed: {
      ...mapState(STORE_NAME, {
        ...mapMixinKeys(_.keys(module.state)),
      }),
      ...mapGetters(STORE_NAME, {
        ...mapMixinKeys(_.keys(module.getters)),
      }),
    },
    methods: {
      ...mapActions(STORE_NAME, {
        ...mapMixinKeys(_.keys(module.actions)),
      }),
    },
  });
};

export const installReactivePropMixin = (Vue, module, {
  store,
  STORE_NAME,
}) => {
  Vue.mixin({
    computed: {
      [`$${STORE_NAME}`]: () => mapReactiveProps(
        store,
        STORE_NAME,
        _.keys(module.state),
      ),
    },
    methods: {
      ...mapActions(STORE_NAME, {
        ...mapMixinKeys(_.keys(module.actions)),
      }),
    },
  });
};

export const installStoreModule = (Vue, module, opts) => {
  registerStoreModule(Vue, module, opts);
  if (!opts.dontInstallMixin) { installStoreMixin(Vue, module, opts); }
};

export const installPlugins = async (Vue, plugins, { sdk, store }) => {
  const modules = Array.isArray(plugins)
    ? Promise.all(plugins)
    : plugins;
  for (const m of await modules) {
    Vue.use(m, { sdk, store });
  }
};
