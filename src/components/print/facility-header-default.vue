<template lang="pug">
  v-layout(v-if="facility" row align-center)
    img(
      v-if="facilityPicValue"
      :src="facilityPicValue"
      height="75"
      width="75"
    ).mr-2
    v-layout(column)
      h5.mc-header {{facility.name}}
      small(v-if="facility.address") {{facility.address | prettifyAddress}}
      small
        span(v-if="facility.email") {{facility.email}}
        span(v-else) Email: N/A
        | ,
        span(v-if="facility.phone")  {{facility.phone}}
        span(v-else)  Phone: N/A
</template>

<script>
export default {
  props: {
    facility: {
      type: Object,
      required: true,
    },
  },
  computed: {
    facilityPicValue () {
      const base64 = this.facility.picDataURI;
      if (base64) return base64;
      return this.facility.picURL;
    },
  },
  mounted () {
    if (this.facilityPicValue) {
      const clinicPic = new window.Image();
      clinicPic.src = this.facilityPicValue;
      clinicPic.onload = () => {
        this.$emit('ready', true);
      };
    } else {
      this.$emit('ready', true);
    }
  },
};
</script>

<style scoped>
  .mc-header {
    font-size: 21px;
    font-weight: 500;
  }
</style>
