<template lang="pug">
  div
    viewer(:images="attachments")
      v-layout(row wrap)
        v-flex(xs4 md2 v-for="(url, key) in attachments" :key="key").ma-1
          v-flex(xs12)
            v-layout(row fill-width)
              v-spacer
              v-menu(left)
                v-btn(
                  slot="activator"
                  flat
                  icon
                )
                  v-icon mdi-dots-horizontal
                v-list
                  v-list-tile(@click="$emit('delete', key)")
                    | Delete
          v-tooltip(bottom)
            div(v-ripple slot="activator").img-container.elevation-1.white
              img(
                :ref="'imgRef'+key"
                :src="url"
                width="100%"
              )
            | View attachment
</template>

<script>
export default {
  props: {
    attachments: {
      type: Array,
      required: true,
    },
  },
};
</script>

<style scoped>
.mc-attachment {
  object-fit: cover;
}
</style>
