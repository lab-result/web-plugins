<template lang="pug">
  div
    v-list(two-line)
      v-list-tile(v-for="(clinic, key) in clinics" :key="key" @click="")
        v-list-tile-avatar
          img(:src="clinic.picURL")
        v-list-tile-content
          v-list-tile-title {{clinic.name}}
          v-list-tile-sub-title {{clinic.description}}
        v-list-tile-action
          v-tooltip(bottom)
            v-btn(icon @click="selectClinic(clinic)" slot="activator")
              v-icon.success--text mdi-check
            | Select
</template>

<script>
// unused in vue-cms. TODO: remove completely if unused anywhere else
export default {
  props: {
    showSwitcher: Boolean,
  },
  computed: {
    clinics () {
      return this.$store.getters['organizations/currentUserOrganizations'];
    },
  },
  methods: {
    selectClinic (clinic) {
      if (!clinic) return;
      this.$emit('selected', clinic);
    },
  },
};
</script>
