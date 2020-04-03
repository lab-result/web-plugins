<template lang="pug">
  div
    clinic-details(
      :clinic="clinic"
      is-edit
    )
</template>

<script>
import ClinicDetails from './details';
export default {
  components: {
    ClinicDetails,
  },
  props: {
    clinic: {
      type: Object,
      default: undefined,
    },
  },
};
</script>
