<template lang="pug">
  v-dialog(v-model="dialog" width="400" persistent lazy)
    v-card
      v-toolbar(flat)
        h2
      v-card-text
        v-form(v-model="valid" @submit.prevent="valid && submit()")
          v-text-field(
                v-model="otp"
                label="Enter One-time pin (OTP)"
                mask="NNN NNN"
                :rules="[v => !!v || 'OTP is required']"
                :disabled="loading"
                :error-messages="errors"
                autofocus
                box
                @focus="errors = []"
              ).centered-input
          p {{label}}
      v-divider
      v-card-actions
        v-spacer
        v-btn(
          @click="submit"
          color="success"
          :disabled="!valid || loading"
          :loading="loading"
          large
        ).right Verify OTP
        v-btn(
          color="error"
          flat
          @click="close"
          large
        ) Cancel
</template>

<script>
export default {
  props: {
    dialog: Boolean,
    isMobile: Boolean,
    email: {
      type: String,
      default: undefined,
    },
    password: {
      type: String,
      default: undefined,
    },
  },
  data () {
    return {
      valid: false,
      loading: false,
      errors: [],
      //
      otp: '',
    };
  },
  computed: {
    label () {
      return this.isMobile
        ? 'We sent the authentication code to your mobile number. Enter the code in the form above to verify your identity.'
        : 'Enter the code from Google Authenticator in the form above to verify your identity.';
    },
  },
  methods: {
    async submit () {
      try {
        this.errors = [];
        this.loading = true;
        await this.$store.dispatch('auth/signin', {
          email: this.email,
          password: this.password,
          totpToken: this.otp,
        });
        this.$emit('success');
        this.close();
      } catch (e) {
        console.error(e);
        this.errors.push('Invalid OTP');
      } finally {
        this.loading = false;
      }
    },
    close () {
      this.$emit('update:dialog', false);
    },
  },
};
</script>
