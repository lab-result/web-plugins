<template lang="pug">
  v-dialog(v-model="model" :width="width" lazy persistent)
    v-card
      v-card-text
        form(@submit.prevent="submit")
          v-layout(row)
            v-spacer
            v-btn(flat icon @click="model = false")
              v-icon mdi-close
          v-layout(column align-center full-width)
            img(
              src="../../assets/images/lab-result-logo.svg"
              width="250"
            ).mb-5
          span Please confirm authentication for this action.
          v-layout(row).my-1
            v-flex(xs12)
              v-text-field(
                v-model="email"
                label="Email"
                required
                hide-details
                solo
                :disabled="passwordOnly"
              )
          v-layout(row).my-1
            v-flex(xs12)
              v-text-field(
                v-model="password"
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                :append-icon="eyeIcon"
                required
                hide-details
                solo
                @click:append="showPassword = !showPassword"
              )
          v-layout(row).my-1
            v-btn(
              color="primary"
              block
              large
              :loading="loading"
              :disabled="loading"
              type="submit"
            ) {{loginText}}
</template>

<script>
import _ from 'lodash';
import { initLogger } from '../../utils/logger';

const log = initLogger('AuthenticateLogger');

export default {
  props: {
    dialog: Boolean,
    width: {
      type: String,
      default: '500',
    },
    title: {
      type: String,
      default: 'Login Required',
    },
    loginText: {
      type: String,
      default: 'Login',
    },
    email: {
      type: String,
      default: '',
    },
    passwordOnly: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      loading: false,
      // email: null,
      password: null,
      showPassword: false,
    };
  },
  computed: {
    model: {
      get () {
        return this.dialog;
      },
      set (val) {
        this.$emit('update:dialog', val);
      },
    },
    eyeIcon () {
      return this.showPassword ? 'mdi-eye-off' : 'mdi-eye';
    },
  },
  methods: {
    async submit () {
      try {
        this.loading = true;

        const user = await this.$store.dispatch('auth/signin', {
          email: this.email,
          password: this.password,
          setCurrentUser: false,
        });
        log('submit#user: %O', user);
        if (_.isEmpty(user) || _.isEmpty(user.accessToken)) {
          throw Error('An unknown login error occurred. Please check credentials.');
        }

        this.$emit('auth', user);
      } catch (e) {
        console.error('submit#error: %O', e);
        this.$enqueueSnack({
          color: 'error',
          message: e.message,
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
