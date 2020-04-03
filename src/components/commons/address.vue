<template lang="pug">
  v-layout(row wrap)
    v-flex(xs12 md6).pa-1
      v-text-field(
        ref="street1Ref"
        :value="address.street1"
        @input="update()"
        label="Street 1"
        outline
      )
    v-flex(xs12 md6).pa-1
      v-text-field(
        ref="street2Ref"
        :value="address.street2"
        @input="update()"
        label="Street 2"
        outline
      )
    v-flex(xs12 md6).pa-1
      v-autocomplete(
        ref="countryRef"
        :value="address.country"
        @input="update()"
        label="Country"
        :items="countries"
        outline
      )
    v-flex(xs12 md6).pa-1
      v-layout(row wrap)
        v-flex(xs21 md6)
          v-text-field(
            ref="provinceRef"
            :value="address.province"
            @input="update()"
            label="Provice"
            outline
          )
        v-flex(xs21 md6).pl-1
          v-text-field(
            ref="cityRef"
            :value="address.city"
            @input="update()"
            label="City/Municipality"
            outline
          )

</template>

<script>
import { countries } from '../../assets/fixtures/countries';

export default {
  props: {
    address: {
      type: Object,
      default: undefined,
    },
  },
  computed: {
    countries () {
      return countries;
    },
  },
  methods: {
    update () {
      this.$emit('input', {
        country: this.$refs.countryRef.value,
        province: this.$refs.provinceRef.value,
        city: this.$refs.cityRef.value,
        street1: this.$refs.street1Ref.value,
        street2: this.$refs.street2Ref.value,
      });
    },
  },
};
</script>
