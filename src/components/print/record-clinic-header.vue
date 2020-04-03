<template lang="pug">
  div.white
    template(v-if="doctorHeader")
      doctor-header(
        :doctor="doctor"
        :doctorHeader="doctorHeader"
      )
    template(v-else)
      print-facility-header-default(
        v-if="printHeaderTemplate === 'default' || !printHeaderTemplate"
        :facility="$activeOrganization"
        @ready="defaultTemplatePicLoaded = $event"
      )
      print-facility-header-template2(
        v-if="printHeaderTemplate === 'template-2'"
        :facility="$activeOrganization"
        @ready="template2PicLoaded = $event"
      )
      img(
        v-if="printHeaderTemplate === 'custom'"
        :src="printHeaderPicURL"
        width="100%"
      )
    v-divider.mb-2.mt-1
</template>

<script>
import _ from 'lodash';
import DoctorHeader from './doctor-header';
import PrintFacilityHeaderDefault from './facility-header-default';
import PrintFacilityHeaderTemplate2 from './facility-header-template2';

export default {
  components: {
    DoctorHeader,
    PrintFacilityHeaderDefault,
    PrintFacilityHeaderTemplate2,
  },
  props: {
    doctor: {
      type: Object,
      default: undefined,
    },
    doctorHeader: {
      type: Object,
      default: undefined,
    },
  },
  data () {
    return {
      defaultTemplatePicLoaded: false,
      template2PicLoaded: false,
      customHeaderPicLoaded: false,
    };
  },
  computed: {
    printHeaderTemplate () {
      return _.get(this.$activeOrganization, 'mf_printHeaderTemplate.template') || 'default';
    },
    printHeaderPicURL () {
      return _.get(this.$activeOrganization, 'mf_printHeaderTemplate.picURL');
    },
  },
  watch: {
    printHeaderTemplate (val) {
      console.warn('val', val);
    },
    defaultTemplatePicLoaded (val) {
      if (val) this.init();
    },
    template2PicLoaded (val) {
      if (val) this.init();
    },
    customHeaderPicLoaded (val) {
      if (val) this.init();
    },
  },
  mounted () {
    this.init();
  },
  methods: {
    async init () {
      try {
        if (this.printHeaderTemplate === 'custom') {
          const img = new window.Image();
          img.src = this.printHeaderPicURL;
          img.onload = () => (this.customHeaderPicLoaded = true);
        }
        if (this.defaultTemplatePicLoaded || this.template2PicLoaded || this.customHeaderPicLoaded) {
          this.$emit('ready', true);
        }
      } catch (e) {
        console.error(e);
      }
    },
  },
};
</script>
