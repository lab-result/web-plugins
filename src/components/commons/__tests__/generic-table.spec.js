import Vue from 'vue';
import Vuetify from 'vuetify';
import GenericTable from '../generic-table';
import { mount } from '@vue/test-utils';
import faker from 'faker';

beforeEach(() => {
  // handling transient components such as VMenu and VTooltip
  // see: https://github.com/vuetifyjs/vuetify/issues/3456
  const el = document.createElement('div');
  el.setAttribute('data-app', true);
  document.body.appendChild(el);
});

describe('GenericTable', () => {
  Vue.use(Vuetify);

  describe('props', () => {
    it('should render without required props', () => {
      const wrapper = mount(GenericTable);
      expect(wrapper.html()).toMatchSnapshot({}, 'empty');
    });

    it('should render a table with items and headers', () => {
      const wrapper = mount(GenericTable, {
        propsData: {
          items: [
            { a: 1, b: 5, c: 9 },
            { a: 2, b: 6, c: 10 },
            { a: 3, b: 7, c: 11 },
            { a: 4, b: 8, c: 12 },
          ],
          headers: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
            { label: 'C', value: 'c' },
          ],
        },
      });
      expect(wrapper.html()).toMatchSnapshot({}, 'items and headers');
    });

    it('should render #filter with :filterable', async () => {
      const wrapper = mount(GenericTable);
      expect(wrapper.find('[data-test="filter"]').element).toBeFalsy();
      wrapper.setProps({ filterable: true });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-test="filter"]').element).toBeTruthy();
      expect(wrapper.html()).toMatchSnapshot({}, ':filterable');
    });

    it('should render #search with :searchable', async () => {
      const wrapper = mount(GenericTable);
      expect(wrapper.find('[data-test="search"]').element).toBeFalsy();
      wrapper.setProps({ searchable: true });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-test="search"]').element).toBeTruthy();
      expect(wrapper.html()).toMatchSnapshot({}, ':searchable');
    });

    it('should allow custom #items', async () => {
      const id = faker.random.uuid();
      const wrapper = mount(GenericTable, {
        slots: {
          items: `<div id="${id}" />`,
        },
        propsData: {
          items: [
            { a: 1, b: 5, c: 9 },
            { a: 2, b: 6, c: 10 },
            { a: 3, b: 7, c: 11 },
            { a: 4, b: 8, c: 12 },
          ],
          headers: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
            { label: 'C', value: 'c' },
          ],
        },
      });
      expect(wrapper.find(`[id="${id}"]`).element).toBeTruthy();
    });
  });
});
