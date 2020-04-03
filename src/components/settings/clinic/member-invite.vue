<template lang="pug">
  v-card
    async-confirm-dialog(ref="confirmDialog")
    v-toolbar(flat)
      v-toolbar-title
        h4 User Details
      v-spacer
      v-btn(v-if="dialog" icon @click.stop="close" :disabled="loading")
        v-icon mdi-close
    v-card-text
      v-form(v-model="valid" ref="form" @submit.prevent="create")
        v-layout(row wrap v-if="enterpriseMode")
          v-flex(xs12).pa-1
            v-radio-group(v-model="inviting" row mandatory)
              v-radio(label="Invite via Email" color="primary" :value="true")
              v-radio(label="Direct Create" color="primary" :value="false")
        v-layout(row wrap)
          v-flex(xs12 md6).pa-1
            v-text-field(
              v-model="email"
              flat
              outline
              label="Email *"
              placeholder="e.g. user@mail.com"
              type="email"
              :rules="[rules.required, rules.email]"
            )
          v-flex(xs12 v-if="!inviting").pa-1
            v-text-field(
              v-model="password"
              flat
              outline
              label="Password *"
              placeholder="Password"
              :type="showPw ? 'text' : 'password'"
              counter
              minlength="6"
              hint=""
              :append-icon="showPw ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append="showPw = !showPw"
              :rules="[rules.required, rules.pw]"
            )
          v-flex(xs12 v-if="!inviting").pa-1
            v-text-field(
              v-model="confirmPassword"
              flat
              outline
              label="Confirm Password *"
              placeholder="Confirm Password"
              :type="showCpw ? 'text' : 'password'"
              :append-icon="showCpw ? 'mdi-eye-off' : 'mdi-eye'"
              :rules="[rules.required, confirmPWRule]"
              @click:append="showCpw = !showCpw"
            )
          v-flex(xs12 md6 v-if="!inviting").pa-1
            v-text-field(
              v-model="name.firstName"
              flat
              outline
              label="First Name *"
              placeholder="First Name"
              :rules="[rules.required]"
            )
          v-flex(xs12 md6 v-if="!inviting").pa-1
            v-text-field(
              v-model="name.lastName"
              flat
              outline
              label="Last Name *"
              placeholder="Last Name"
              :rules="[rules.required]"
            )
          v-flex(xs12 md6 v-if="!inviting").pa-1
            label.grey--text Account type:
            v-radio-group(
              v-model="isDoctor"
              row
              mandatory
            ).mt-0
              v-radio(label="Doctor" color="primary" :value="true")
              v-radio(label="Non-doctor" color="primary" :value="false")
          v-flex(xs12 md6 v-if="!inviting").pa-1
            v-text-field(
              v-model="prcLicense"
              flat
              outline
              type="number"
              label="PRC License"
              placeholder="PRC License"
            )
          v-flex(xs12 md6).pa-1
            v-text-field(
              v-model="externalId"
              flat
              outline
              label="External ID"
            )
          v-flex(xs12).pa-1
            v-select(
              v-model="roles"
              :items="rolesAvailable"
              item-text="name"
              item-value="id"
              chips
              color="blue"
              multiple
              flat
              outline
              label="Roles *"
              placeholder="Nothing selected"
              :rules="[rules.roles]"
            )
          v-flex(xs12 v-if="checkIfDoctor").pa-1
            v-select(
              v-model="tags"
              :items="doctorPaymentTypes"
              item-text="text"
              item-value="value"
              chips
              color="primary"
              multiple
              flat
              outline
              label="Doctor Payment Type"
              placeholder="Nothing selected"
            )
          v-flex(xs12).pa-1
            member-privileges(v-model="privileges" :roles="roles")

    v-divider
    v-card-actions
      v-spacer
      v-btn(
        color="primary"
        :loading="loading"
        :disabled="onpremiseMode || !valid"
        @click.stop="create"
      ) {{ inviting ? 'Send Invitation' : 'Create Member' }}
      v-btn(
        flat
        color="error"
        :disabled="loading"
        @click.stop="close"
      ) {{ dialog ? 'Cancel' : 'Reset' }}
</template>

<script>
// components
import MemberPrivileges from './member-privileges';
import AsyncConfirmDialog from '../../commons/async-confirm-dialog';
// constants
import { DOCTOR_ROLES, ROLES } from './constants';
// utils
import _ from 'lodash';
import { initLogger } from '../../../utils/logger';
import { prettifyNameFirst } from '../../../utils/string';

const log = initLogger('SettingsClinicMemberInvite');

export default {
  components: {
    MemberPrivileges,
    AsyncConfirmDialog,
  },
  props: {
    // if component will be a child of a dialog
    dialog: {
      type: Boolean,
      default: undefined,
    },
    // facility to invite member to
    facility: {
      type: String,
      required: true,
    },
  },
  data: () => ({
    valid: false,
    loading: false,
    inviting: true,
    showPw: false,
    showCpw: false,
    email: '',
    password: '',
    confirmPassword: '',
    name: { firstName: '', lastName: '' },
    roles: [],
    isDoctor: false,
    prcLicense: null,
    privileges: null,
    tags: [],
    externalId: '',
    doctorPaymentTypes: [
      { text: 'Per Patient Consult', value: 'per-patient-consult' },
      { text: 'Per Hour Consult', value: 'per-hour-consult' },
    ],
    rules: {
      required: v => !!v || 'Required.',
      email: v => /.+@.+/.test(v) || 'E-mail must be valid.',
      pw: v => v.length >= 6 || 'Password must be atleast 6 characters long.',
      confirmPw: v => v === this.password || 'Passwords confirmation password doesn\'t match.',
      roles: v => !!v.length || 'Atleast 1 role is required',
    },
  }),
  computed: {
    confirmPWRule () {
      return () => (this.password === this.confirmPassword) || 'Password must match';
    },
    rolesAvailable () {
      return ROLES;
    },
    /**
     * Returns true if member has any doctor roles.
     * @return {boolean}
     */
    checkIfDoctor () {
      if (_.isEmpty(this.roles)) return false;
      return (!_.isEmpty(_.intersection(this.roles, DOCTOR_ROLES)));
    },
    enterpriseMode () {
      return process.env.VUE_APP_BUILD_MODE === 'enterprise';
    },
    onpremiseMode () {
      return process.env.VUE_APP_MODE === 'onpremise';
    },
  },
  methods: {
    async create () {
      if (this.onpremiseMode) {
        this.$enqueueSnack({
          color: 'warning',
          message: 'Disabled in Syncbase Mode.',
        });
        return;
      }

      if (!this.$refs.form.validate()) {
        this.$enqueueSnack({
          color: 'warning',
          message: 'Please fill up required fields.',
        });
        return;
      }

      try {
        this.loading = true;
        if (this.inviting) {
          await this.invite();
          this.$emit('invite');
        } else {
          await this.createAccount();
          this.$emit('create');
        }
      } catch (error) {
        log('create#error', error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      } finally {
        this.close();
        this.loading = false;
      }
    },
    async invite () {
      const data = {
        type: 'org-membership',
        email: this.email,
        member: {
          ...this.privileges,
          organization: this.facility,
          roles: this.roles,
        },
      };
      log('invite#payload', data);
      await this.$sdk.service('account-invitations').create(data);
      this.$enqueueSnack({
        message: 'Success! Invitation successfully sent.',
        color: 'success',
      });
    },
    async createMembership (uid) {
      const payload = _.pickBy({
        uid,
        organization: this.facility,
        roles: this.roles,
        tags: this.tags,
        externalId: this.externalId,
        ...this.privileges,
      });
      log('createMembership#payload', payload);
      if (!payload.organization) throw new Error('Facility required.');
      if (!payload.uid) throw new Error('Uid required.');
      await this.$sdk.service('organization-members').create(payload);
    },
    async createAccount (force) {
      // check email existence
      const existing = await this.$sdk.service('accounts').findOne({ email: this.email });
      if (!force && existing && existing.uid) {
        const existingEmail = _.get(existing, 'email');
        const existingName = _.get(existing, 'name');
        const displayName = existingName ? prettifyNameFirst(existingName) : existingEmail;
        const res = await this.$refs.confirmDialog.open(
          'Account exists',
          `User ${displayName} already exists. Do you want to add this existing user in ${this.$activeOrganization.name}? Once added, the user will use their current email and password to access your clinic.`,
          { primaryAction: 'Add Member', primaryColor: 'primary' }
        );

        if (res) await this.createAccount(true);
        return;
      }

      const payload = _.pickBy({
        email: this.email,
        password: this.password,
        personalDetails: _.pickBy({
          name: this.name,
          doc_PRCLicenseNo: this.prcLicense,
        }),
      });
      const account = existing || await this.$sdk.service('accounts').create(payload);
      log('createAccount#account', account);
      await this.createMembership(account.uid);
      this.$enqueueSnack({
        message: 'Success! Member successfully created.',
        color: 'success',
      });
    },
    close () {
      this.privileges = null;
      this.email = '';
      this.roles = [];
      this.tags = [];
      this.externalId = '';
      this.$refs.form.resetValidation();
      this.$emit('close');
    },
  },
};
</script>
