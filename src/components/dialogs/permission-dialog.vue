<template lang="pug">
  div
    v-dialog(v-model="model" width="500" persistent scrollable)
      v-card
        v-toolbar(flat)
          h2 Record Permission
          v-spacer
          v-btn(icon @click="model = false")
            v-icon mdi-close
        v-card-text
          div(v-if="permission === 'public'").text-xs-center
            h1 This record is
              span.warning--text PUBLIC
            p.subheading Anyone in this clinic can see this record.
            v-btn(
              large
              block
              color="success"
              :disabled="loading"
              :loading="loading"
              @click="makePrivate"
              depressed
            ) Make private (Only me)
          div(v-if="permission === 'private'").text-xs-center
            h1 This record is
              span.success--text PRIVATE
            p.subheading Only you can see this record.
            v-btn(
              large
              block
              color="warning"
              :disabled="loading"
              :loading="loading"
              @click="makePublic"
              depressed
            ).black--text Make public (within this clinic)
          div(v-if="permission === 'advanced'").text-xs-center
            h1 This record is
              span.success--text PRIVATE
            p.subheading Only you can see this record.
            v-btn(
              large
              block
              color="warning"
              :disabled="loading"
              :loading="loading"
              @click="makePublic"
              depressed
            ).black--text Make public (within this clinic)
          v-divider.mt-5
          div.pa-0
            v-expansion-panel.elevation-0
              v-expansion-panel-content
                template(slot="actions")
                  v-icon.primary--text mdi-chevron-down
                template(slot="header")
                  h3.primary--text Show Advanced
                v-card(flat)
                  v-divider
                  v-card-text
                    h3 Share to specific users
                  v-card-text.pa-0
                    v-list(two-line)
                      v-list-tile(
                        v-for="member in activeOrganizationDoctors"
                        :key="member.id"
                        @click="toggleUserPemittedState(member.uid)"
                      )
                        v-list-tile-action
                          v-avatar
                            img(:src="member.picURL")
                        v-list-tile-content.pl-2
                          v-list-tile-title {{member.name | prettify-name}}
                          v-list-tile-sub-title foo
                        v-list-tile-action
                          v-icon(v-if="userIsPermitted(member.uid)").success--text mdi-checkbox-marked
                          v-icon(v-else) mdi-checkbox-blank-outline
                  v-divider
                  v-card-text
                    h3 Share to specific clinic
                  v-divider
                  v-card-actions
                    v-spacer
                    v-btn(
                      depressed
                      color="primary"
                      @click="savePermission"
                    ) Save permission
                    v-btn(
                      flat
                      color="error"
                      @click="model = false"
                    ) Cancel

</template>

<script>
import { initLogger } from '../../utils/logger';
import * as organizationMembers from '../../services/organization-members';

const log = initLogger('PermissionDialog');

const DOCTOR_ROLES = [
  'doctor',
  'doctor_pathologist',
  'doctor_radiologist',
  'doctor_sonologist',
  'doctor_cardiologist',
  'doctor_pme',
];

export default {
  props: {
    dialog: Boolean,
    loading: Boolean,
    permission: {
      type: String,
      default: undefined,
    },
    permissions: {
      type: Array,
      default: () => [],
    },
  },
  data () {
    return {
      model: this.dialog,
      specificUserDialog: false,
      permittedUIDs: [],
      activeOrganizationDoctors: [],
    };
  },
  watch: {
    dialog (val) {
      this.model = val;
    },
    model (val) {
      if (!val) {
        this.$emit('close', false);
      }
    },
  },
  created () {
    this.init();
  },
  methods: {
    init () {
      this.permittedUIDs = this.permittedUIDs.concat(this.permissions.map(permission => permission.uid));
    },
    async fetchActiveOrganizationDoctors () {
      try {
        const opts = {
          organization: this.$activeOrganization.id,
          roles: { $in: DOCTOR_ROLES },
          limit: 100,
        };
        const { items } = await organizationMembers.getOrganizationMembers(this.$sdk, opts);
        log('fetchActiveOrganizationDoctors#items: %O', items);
        this.activeOrganizationDoctors = items;
      } catch (error) {
        log('fetchActiveOrganizationDoctors#error: %O', error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
    },
    makePrivate () {
      this.$emit('make-private');
    },
    makePublic () {
      this.$emit('make-public');
    },
    permitUser (uid) {
      this.permittedUIDs.push(uid);
    },
    forbidUser (uid) {
      this.permittedUIDs.splice(this.permittedUIDs.indexOf(uid), 1);
    },
    userIsPermitted (uid) {
      return this.permittedUIDs.includes(uid);
    },
    toggleUserPemittedState (uid) {
      if (this.userIsPermitted(uid)) {
        this.forbidUser(uid);
      } else {
        this.permitUser(uid);
      }
    },
    savePermission () {
      const payload = [
        ...this.permittedUIDs.map(uid => ({ uid })),
      ];
      this.$emit('save', payload);
    },
  },
};
</script>
