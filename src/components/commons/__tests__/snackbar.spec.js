import Vue from 'vue';
import Vuetify from 'vuetify';
import Snackbar from '../snackbar';
import { mount } from '@vue/test-utils';

describe('snackbar.vue', () => {
  it('should emit a change state event', async () => {
    Vue.use(Vuetify);

    const wrapper = mount(Snackbar, {
      sync: false,
    });

    const change = jest.fn();
    wrapper.vm.$on('changeState', change);
    wrapper.vm.show({});
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(change.mock.calls).toHaveLength(1);
  });
});
