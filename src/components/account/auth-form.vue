<template lang="pug">
  v-form(ref="form" v-model="valid" @keydown.native.enter="valid && submit()")
    v-text-field(
      v-model="email"
      type="email"
      :label="emailLabel"
      :solo="solo"
      :box="box"
      :outline="outline"
      :rules="emailRules"
      required
      :disabled="loading || passwordOnly"
      autofocus
    )
    v-text-field(
      v-model="password"
      type="password"
      :label="passwordLabel"
      :solo="solo"
      :box="box"
      :outline="outline"
      :rules="passwordRules"
      required
      :disabled="loading"
    )
    v-alert(
      type="warning"
      :value="error"
      dismissible
    ) {{errorMsg}}

    twofa-login-dialog(
      :dialog.sync="mfaLoginDialog"
      :isMobile="isMFAMobileNoEnabled"
      :email="email"
      :password="password"
      @success="twofaSuccess"
    )
</template>

<script>
import _ from 'lodash';
import twoFaLoginDialog from './2fa-login-dialog';

export default {
  components: {
    'twofa-login-dialog': twoFaLoginDialog,
  },
  props: {
    isReauth: Boolean,
    emailLabel: {
      type: String,
      default: 'Email Address',
    },
    emailPrefill: {
      type: String,
      default: '',
    },
    passwordLabel: {
      type: String,
      default: 'Password',
    },
    passwordOnly: {
      type: Boolean,
      default: false,
    },
    solo: Boolean,
    box: Boolean,
    outline: Boolean,
  },
  data () {
    return {
      emailModel: this.emailPrefill,
      valid: false,
      loading: false,
      error: false,
      errorMsg: '',
      emailRules: [
        v => !!v || 'Email address is required',
        v => /.+@.+/.test(v) || 'Email address must be valid',
      ],
      passwordRules: [
        v => !!v || 'Password is required',
      ],
      mfaLoginDialog: false,
      isMFAMobileNoEnabled: false,
      strat: 'local',
      // models
      password: '',
      user: {},
    };
  },
  computed: {
    email: {
      set (val) {
        this.emailModel = val;
      },
      get () {
        return this.emailModel;
      },
    },
  },
  watch: {
    valid (val) {
      this.$emit('isValid', val);
    },
    loading (val) {
      this.$emit('isLoading', val);
    },
  },
  methods: {
    async submit (strat) {
      try {
        this.strat = strat;
        this.loading = true;
        this.error = false;

        if (!_.isEmpty(this.$route.query.target)) { this.strat = 'jwt'; }
        this.user = await this.$store.dispatch('auth/signin', {
          email: this.email,
          password: this.password,
          setCurrentUser: !this.isReauth,
        });

        if (this.strat === 'local' || _.isEmpty(this.strat)) {
          this.$emit('success');
        } else {
          this.$emit('jwtSuccess', await this.$store.dispatch('auth/getAccessToken'));
        }

        this.password = '';
        this.$refs.form.resetValidation();
      } catch (e) {
        console.error(e);
        const { code, message } = e;

        if (e.data) {
          this.isMFAMobileNoEnabled = e.data.isMFAMobileNoEnabled || false;

          if (e.data.code === 'auth/wrong-password' || e.data.code === 'auth/invalid-email' || e.data.code === 'auth/user-not-found') {
            this.passwordOnly ? this.errorMsg = 'Password is incorrect' : this.errorMsg = 'Email or password is incorrect.';
          }
        }

        if (e.code === 206) {
          this.mfaLoginDialog = true;
          return;
        }

        if (e.message === 'Network Error') { this.errorMsg = 'There was an error on our side. We apoligize, please try again later.'; }

        if (!code || !message) { this.errorMsg = 'There was an unknown error. Please try again later.'; }

        this.error = true;
      } finally {
        this.loading = false;
      }
    },
    async twofaSuccess () {
      if (!_.isEmpty(this.$route.query.target)) { this.strat = 'jwt'; }
      if (this.strat === 'local' || _.isEmpty(this.strat)) {
        this.$emit('success');
      } else {
        this.$emit('jwtSuccess', await this.$store.dispatch('auth/getAccessToken'));
      }
    },
  },
};
</script>
