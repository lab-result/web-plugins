<template lang="pug">
  v-dialog(
    v-model="dialog"
    persistent
    scrollable
    max-width="1000"
  )
    v-card
      v-card-title
        span.headline {{ editId ? 'Edit' : 'Create' }} Patient
      v-divider(light)
      v-card-text
        patient-create(
          ref="createPx"
          emit-result
          hide-actions
          hide-card-elevation
          :edit-id="editId"
          :initial-value="initialValue"
          :go-back-on-success="false"
          @success="primary($event)"
          @cancel="cancel()"
          v-if="dialog"
        )
      v-divider(light)
      v-card-actions
        v-spacer
        v-btn(
          color="primary"
          :depressed="true"
          :loading="$refs.loading"
          :disabled="$refs.loading"
          @click="$refs.createPx.submit()"
        ) Save
        v-btn(
          :depressed="true"
          :loading="$refs.loading"
          :disabled="$refs.loading || $refs.loadingAccount"
          @click="$refs.createPx.cancel()"
        ) Cancel
</template>
<script>
import PatientCreate from '../patient/create';
/**
   * Insert component where you want to use it:
   * <mc-create-patient-dialog ref="createPatientDialog"></mc-create-patient-dialog>
   *
   * Call it:
   * this.$refs.createPatientDialog.open({ editId }).then((res) => {})
   */
export const COMPONENT_NAME = 'mc-create-patient-dialog';
export default {
  components: {
    PatientCreate,
  },
  data () {
    return {
      dialog: false,
      resolve: null,
      reject: null,
      editId: null,
      initialValue: null,
    };
  },
  methods: {
    open ({ editId, initialValue }) {
      this.dialog = true;
      this.editId = editId;
      this.initialValue = initialValue;

      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },
    primary (val) {
      this.resolve(val);
      this.dialog = false;
    },
    cancel () {
      this.resolve(false);
      this.dialog = false;
    },
  },
};
</script>
