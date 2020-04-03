<template lang="pug">
  v-dialog(v-model="model" fullscreen persistent scrollable)
    v-card
      v-toolbar(flat color="primary")
        v-toolbar-title.white--text Drawing
        v-spacer
        v-btn(icon @click="close(); $refs.canvasRef.init()" dark)
          v-icon mdi-close
      v-card-text.pa-0
        drawing-board(
          ref="canvasRef"
          :pencilColor="color"
          :pencilSize="size"
          :image="template"
          @save="save"
        )
      v-divider
      v-card-actions
        v-layout(row)
          v-flex(xs12 md3).mr-3
            label Pencil Color
            v-select(
              :items="colors"
              v-model="color"
              label="Pencil Color"
              solo
              hide-details
            ).mt-2
              template(slot="item" slot-scope="props")
                v-list-tile-action
                  div(:style="{backgroundColor: props.item}").color-view
                v-list-tile-content
                  v-list-tile-title {{props.item | morph-capitalize}}
              template(slot="selection" slot-scope="props")
                v-list-tile-action
                  div(:style="{backgroundColor: props.item}").color-view
                v-list-tile-content
                  v-list-tile-title {{props.item | morph-capitalize}}
          v-flex(xs12 md3)
            label Pencil Size
            v-select(
              :items="sizes"
              v-model="size"
              label="Pencil Size"
              solo
              hide-details
            ).mt-2
        v-btn(
          large
          flat
          @click="$refs.canvasRef.init()"
        ) Clear Drawing
        v-btn(
          large
          color="success"
          @click="$refs.canvasRef.save()"
        ) Save Drawing
</template>

<script>
import DrawingBoard from '../../commons/canvas';
import { PEN_COLORS, PEN_SIZES } from './constants';
export default {
  components: {
    DrawingBoard,
  },
  props: {
    dialog: Boolean,
    template: {
      type: String,
      default: undefined,
    },
  },
  data () {
    return {
      color: 'red',
      size: 2,
    };
  },
  computed: {
    model: {
      set (val) {
        this.$emit('update:dialog', val);
      },
      get () {
        return this.dialog;
      },
    },
  },
  created () {
    this.colors = PEN_COLORS;
    this.sizes = PEN_SIZES;
  },
  methods: {
    close () {
      this.$emit('update:dialog', false);
    },
    save (img) {
      this.$emit('save', img);
      this.close();
    },
  },
};
</script>

<style scoped>
  .color-view {
    width: 15px;
    height: 15px;
  }
</style>
