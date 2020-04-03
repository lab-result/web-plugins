<template lang="pug">
  v-dialog(v-model="model" :width="width" persistent)
    v-card
      v-toolbar(flat)
        v-toolbar-title
          h4 {{title}}
        v-spacer
        v-btn(icon @click="model = false")
          v-icon mdi-close
      v-card-text
        generic-picker(
          :loading="loading"
          :items="diagnosticCenters"
        )
          template(slot-scope="props")
            v-list-tile(
              :key="props.item.id"
              @click="select(props.item)"
            )
              v-list-tile-content
                v-list-tile-title {{props.item.name}}
</template>

<script>
import GenericPicker from '../commons/generic-picker';

export default {
  components: {
    GenericPicker,
  },
  props: {
    dialog: Boolean,
    width: {
      type: String,
      default: '500',
    },
    title: {
      type: String,
      default: 'Select Diagnostic Center',
    },
  },
  data () {
    return {
      loading: false,
      diagnosticCenters: [],
    };
  },
  computed: {
    model: {
      get () {
        return this.dialog;
      },
      set (val) {
        this.$emit('update:dialog', val);
      },
    },
  },
  created () {
    this.$initLogger('dialogs/diagnostic-center-picker');
    this.init();
  },
  methods: {
    async init () {
      try {
        this.loading = true;

        const { items: organizations } = await this.$sdk.service('organizations').find({
          type: 'diagnostic-center',
          overlords: this.$activeOrganization.id,
        });
        this.diagnosticCenters = organizations;
      } catch (e) {
        this.$log('init#error: %O', e);
      } finally {
        this.loading = false;
      }
    },
    select (center) {
      this.$emit('select', center);
      this.model = false;
    },
  },
};
</script>
