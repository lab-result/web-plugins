<template lang="pug">
  v-toolbar(app fixed style="margin-top: 60px;" color="white")
    v-avatar
      img(:src="px.picURL")
    div.ml-2
      h4 {{px.name | prettify-name}}
      span.caption {{px.sex | morph-capitalize}}
        v-icon(style="font-size: 18px;").mx-1.grey--text mdi-chevron-right
        //- | {{$calcExactAge(px.dateOfBirth)}}
        v-icon(style="font-size: 18px;").mx-1.grey--text mdi-chevron-right
        | Blood Type: {{px.bloodType || '--' | morph-capitalize}}
        v-icon(style="font-size: 18px;").mx-1.grey--text mdi-chevron-right
      span.caption {{px.dateOfBirth | morph-date('MMM DD, YYYY')}}
        v-icon(style="font-size: 18px;").mx-1.grey--text mdi-chevron-right
        | {{px.mobileNo || 'Mobile: --'}}
        //- br(v-if="HMOs")
        //- span(v-if="HMOs").caption HMO: {{HMOs}}
        //- br(v-if="companies")
        //- span(v-if="companies").caption Company: {{companies}}
    v-spacer
    //- v-btn(icon)
      v-icon mdi-chevron-up
</template>

<script>
// components
// constants
// utils
import { initLogger } from '../../utils/store';
import { getPatient } from '../../services/patients';

const log = initLogger('PatientProfileMin');

export default {
  props: {
    patient: {
      type: String,
      default: undefined,
    },
  },
  data () {
    return {
      px: {},
    };
  },
  async created () {
    await this.init();
  },
  methods: {
    async init () {
      try {
        const query = { id: this.patient };
        this.px = await getPatient(this.$sdk, query);
        log('init#px: %O', this.px);
      } catch (error) {
        console.error(error);
      } finally {
        //
      }
    },
  },
};
</script>
