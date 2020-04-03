<template lang="pug">
  v-card
    v-toolbar(flat)
      v-toolbar-title
        h4(:class="{ 'grey--text': loading }") Edit User
          span(v-if="loading" :class="operationClass").ml-2 {{ operationText }}...
      v-spacer
      v-menu(bottom left v-if="organizationsAvailable.length")
        template(slot="activator" slot-scope="{ on }")
          v-btn(
            color="warning"
            :loading="loading && operation==='transfer'"
            :disabled="loading"
            v-on="on"
          ) Transfer User
        v-list
          v-list-tile(v-for="(org,i) in organizationsAvailable" :key="i" @click="organizationTo=org")
            v-list-tile-title {{ org.name }}
      v-btn(
        color="error"
        :loading="loading && operation==='remove'"
        :disabled="loading"
        @click="remove"
      ) Remove User
      v-btn(v-if="dialog" icon :disabled="loading" @click="close")
        v-icon mdi-close

    v-card-text
      v-form(v-model="valid" ref="form")
        v-layout(row)
          v-flex(xs6).px-2
            v-text-field(disabled v-model="email" flat outline label="Email")
          v-flex(xs6).px-2
            v-text-field(v-model="externalId" flat outline label="External ID")
        v-layout(row)
          v-flex(xs6).px-2
            v-text-field(disabled v-model="firstName" flat outline label="First Name")
          v-flex(xs6).px-2
            v-text-field(disabled v-model="lastName" flat outline label="Last Name")
        v-layout(row)
          v-flex(xs6 v-if="checkIfDoctor").px-2
            v-select(
              v-model="tags"
              :items="doctorPaymentTypes"
              item-text="text"
              item-value="value"
              chips
              multiple
              outline
              label="Doctor Payment Type"
            )
              template(slot="selection" slot-scope="data")
                v-chip(color="primary" dark) {{ data.item.text }}
        v-layout(row)
          v-flex(xs12).px-2
            v-select(
              v-model="roles"
              :items="rolesAvailable"
              item-text="name"
              item-value="id"
              chips
              multiple
              outline
              label="Select User Role(s) *"
              :rules="rolesRules"
            )
              template(slot="selection" slot-scope="data")
                v-chip(color="primary" dark) {{ data.item.name }}
        v-layout(row).px-2
          member-privileges(v-model="privileges" :roles="roles")

    //- actions
    v-divider
    v-card-actions
      v-spacer
      v-btn(
        @click="edit"
        color="primary"
        :loading="loading && operation==='update'"
        :disabled="loading || !hasChanges || !valid"
      ) Update
      v-btn(
        @click="close"
        flat
        color="error"
        :disabled="loading"
      ) {{ dialog ? 'Cancel' : 'Reset' }}
    v-dialog(v-if="organizationTo" v-model="dialogTransfer" width="600" persistent)
      v-card
        v-card-title Transfer Member
        v-card-text
          p Are you sure you want to transfer this member to {{ organizationTo.name }}?
        v-card-actions
          v-spacer
          v-btn(
            @click="transfer"
            color="error"
            :loading="loading && operation==='transfer'"
            :disabled="loading"
          ) Transfer
          v-btn(
            @click="dialogTransfer=false"
            flat
            :disabled="loading"
          ) {{ dialog ? 'Cancel' : 'Reset' }}
</template>

<script>
// components
import MemberPrivileges from './member-privileges';
// constants
import { DOCTOR_ROLES, ROLES } from './constants';
// utils
import _ from 'lodash';
import { initLogger } from '../../../utils/logger';

const log = initLogger('SettingsClinicMemberEdit');

/**
 * @typedef {import('../../../plugins/settings/store').OrganizationMember} OrganizationMember
 */

export default {
  components: {
    MemberPrivileges,
  },
  props: {
    dialog: {
      type: Boolean,
    },
    /** @type {OrganizationMember} */
    member: {
      type: Object,
      required: true,
    },
  },
  data: () => ({
    valid: false,
    loading: false,
    organizationTo: null,
    operation: '',
    model: {},
    rolesRules: [
      v => !!v || 'Roles is required',
      v => !!v.length || 'Atleast 1 role is required',
    ],
    doctorPaymentTypes: [
      { text: 'Per Patient Consult', value: 'per-patient-consult' },
      { text: 'Per Hour Consult', value: 'per-hour-consult' },
    ],
    currentUserMemberships: [],
  }),
  computed: {
    operationText () {
      switch (this.operation) {
        case 'remove': return 'Removing';
        case 'transfer': return 'Transfering';
        default: return 'Updating';
      }
    },
    operationClass () {
      return {
        'green--text': this.operation === 'update' || this.operation === 'transfer',
        'red--text': this.operation === 'remove',
      };
    },
    email () {
      return _.get(this.member, 'account.email') || '';
    },
    firstName () {
      return _.get(this.member, 'account.name.firstName') || '';
    },
    lastName () {
      return _.get(this.member, 'account.name.lastName') || '';
    },
    currentUserOrganizations () {
      return this.currentUserMemberships
        ?.map(membership => membership?.$populated?.organization);
    },
    organizationsAvailable () {
      return this.currentUserOrganizations
        ?.filter(o => {
          if (o.id === this.member.organization) return false;
          if (o.parent && o.parent.id === this.member.organization) return true;
          if (o._ch && ~o._ch.indexOf(this.member.organization)) return true;
          if (o._sb && ~o._sb.indexOf(this.member.organization)) return true;
        });
    },
    dialogTransfer: {
      get () {
        return !!this.organizationTo;
      },
      set (value) {
        if (!value) this.organizationTo = null;
      },
    },
    hasChanges () {
      return !_.isEmpty(this.model);
    },
    activeOrganization () {
      return this.$activeOrganization;
    },
    clinicType () {
      return _.get(this.activeOrganization, 'type');
    },
    subscription () {
      return _.get(this.activeOrganization, 'subscription');
    },
    rolesAvailable () {
      return _.filter(ROLES, role => (
        this.checkIgnoredClinicTypes(role.ignoredClinicTypes) &&
        this.checkSubscriptions(role.subscriptions)
      ));
    },
    roles: {
      get () {
        if (_.isNil(this.model.roles)) return this.member.roles;
        return this.model.roles || [];
      },
      set (value) {
        if (!value.length) this.model = {};
        else this.$set(this.model, 'roles', value);
      },
    },
    tags: {
      get () {
        if (_.isNil(this.model.tags)) return this.member.tags;
        return this.model.tags || [];
      },
      set (value) {
        this.$set(this.model, 'tags', value);
      },
    },
    externalId: {
      get () {
        if (_.isNil(this.model.externalId)) return this.member.externalId;
        return this.model.externalId || '';
      },
      set (value) {
        this.$set(this.model, 'externalId', value);
      },
    },
    currentPrivileges () {
      return _.omit(this.member, [
        'id',
        'createdAt',
        'createdBy',
        'uid',
        'roles',
        'withholdingTax',
        'organization',
        'account',
        'name',
        'sex',
        'picURL',
        'email',
        'doc_eSignatureURL',
        'invitation',
        'invitedAt',
      ]);
    },
    privileges: {
      get () {
        const { roles, ...privileges } = this.model;
        return _.keys(this.currentPrivileges).reduce((acc, key) => {
          if (typeof acc[key] !== 'undefined') return acc;
          return { ...acc, [key]: this.currentPrivileges[key] };
        }, privileges);
      },
      set (value) {
        const curr = { roles: this.member.roles, ...this.currentPrivileges };
        const next = _.pickBy({ roles: this.model.roles, ...value }, v => v != null);
        this.model = _.isEqual(next, curr) ? {} : next;
      },
    },
    /**
     * Returns true if member has any doctor roles.
     * @return {boolean}
     */
    checkIfDoctor () {
      if (_.isEmpty(this.roles)) return false;
      return (!_.isEmpty(_.intersection(this.roles, DOCTOR_ROLES)));
    },
  },
  watch: {
    member: {
      handler () {
        this.model = {};
      },
      deep: true,
    },
  },
  mounted () {
    this.fetchCurrentUserMemberships();
  },
  methods: {
    /**
     * Returns true if active organization does not match any of the ignored types.
     * @return {boolean}
     */
    checkIgnoredClinicTypes (ignoredClinicTypes) {
      if (_.isEmpty(ignoredClinicTypes)) return true;
      // we don't want any of ignoredClinicTypes
      return !_.includes(ignoredClinicTypes, this.clinicType);
    },
    /**
     * Returns true if active subscription has any of the required keys.
     * @return {boolean}
     */
    checkSubscriptions (subscriptions) {
      if (_.isEmpty(subscriptions)) return true;
      return _.some(subscriptions, s => _.get(this.subscription, s));
    },
    async fetchCurrentUserMemberships () {
      this.loading = true;
      try {
        const { items } = await this.$sdk.service('organization-members').find({
          uid: this.$currentUser?.uid,
          $select: ['id', 'uid', 'organization'],
          $limit: 100,
          $populate: {
            organization: {
              service: 'organizations',
              method: 'get',
              localKey: 'organization',
              $select: ['id', 'name'],
            },
          },
        });
        log('fetchCurrentUserMemberships#items: %O', items);
        this.currentUserMemberships = items;
      } catch (error) {
        log('fetchCurrentUserMemberships#error: %O', error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
      this.loading = false;
    },
    close () {
      this.organizationTo = null;
      this.model = {};
      this.$emit('close');
    },
    async edit () {
      this.operation = 'update';
      this.loading = true;
      try {
        const data = _.omit(this.model, ['facility']);
        await this.$sdk.service('organization-members').update(this.member.id, data);
        this.$enqueueSnack({
          message: 'Success! Changes Saved',
          color: 'success',
        });
        this.$emit('update');
        this.close();
      } catch (error) {
        log('edit#error: %O', error);
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Please try again.',
          color: 'error',
        });
      }
      this.loading = false;
    },
    async remove () {
      this.operation = 'remove';
      this.loading = true;
      try {
        await this.$sdk.service('organization-members').remove(this.member.id);
        this.$enqueueSnack({
          message: 'Success! Member removed',
          color: 'success',
        });
        if (this.member.uid === this.$currentUser.uid) {
          await this.signOut();
        }
        this.close();
      } catch (error) {
        log('remove#error: %O', error);
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Please try again.',
          color: 'error',
        });
      }
      this.loading = false;
    },
    async transfer () {
      this.operation = 'transfer';
      this.loading = true;
      try {
        const data = {
          $transfer: this.organizationTo.id,
        };
        await this.$sdk.service('organization-members').update(this.member.id, data);
        this.$enqueueSnack({
          message: 'Success! Member Transferred',
          color: 'success',
        });
        this.close();
      } catch (error) {
        log('transfer#error: %O', error);
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Please try again',
          color: 'error',
        });
      }
      this.loading = false;
    },
    async signOut () {
      try {
        this.loading = true;
        this.$router.replace({ name: 'signout' });
      } catch (e) {
        log('signOut#error: %O', e);
        this.$enqueueSnack({
          message: e.message || 'Something went wrong! Please try again',
          color: 'error',
        });
      } finally {
        this.loading = true;
      }
    },
  },
};
</script>
