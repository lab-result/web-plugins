<template lang="pug">
  v-layout(v-if="facility" row wrap)
    v-flex(xs2 md2)
      img(
        v-if="facilityPicValue"
        :src="facilityPicValue"
        height="75"
        width="75"
      ).mr-2
    v-flex(xs8 md8)
      v-layout(column).text-xs-center
        h5.mc-header {{facility.name}}
        small(v-if="facility.address") {{facility.address | prettifyAddress}}
        small
          span(v-if="facility.email") {{facility.email}}
          span(v-else) Email: N/A
          | ,
          span(v-if="facility.phone")  {{facility.phone}}
          span(v-else)  Phone: N/A
    v-flex(xs2 md2)
      .placeholder.ml-2
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

.placeholder {
  height: 75px;
  width: 75px;
}
</style>
