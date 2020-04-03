<template lang="pug">
  div
    loader-dialog(ref="loader")
    div.mb-3
      h1 Manage Team Members
      p Add your team members and manage their details & user permissions.
      v-card.pb-2
        v-layout(row)
          v-flex(xs3).pl-3
            v-autocomplete(
              v-model="roleFilter"
              flat
              outline
              clearable
              hide-details
              label="Filter Type"
              item-text="name"
              item-value="id"
              :items="rolesAvailable"
            ).mt-3
          v-spacer
          v-flex(xs3)
            v-text-field(
              v-model.trim="searchString"
              flat
              outline
              clearable
              hide-details
              label="Search here"
              prepend-inner-icon="mdi-magnify"
            ).mt-3
          v-flex(shrink).mt-3
            v-tooltip(bottom)
              template(slot="activator")
                v-btn(
                  :disabled="onpremiseMode || loading"
                  color="primary"
                  flat
                  icon
                  large
                  @click="dialogInvite = true"
                )
                  v-icon mdi-plus
              span {{ onpremiseMode ? 'Disabled in Syncbase Mode' : 'Add Clinic Member' }}
            v-dialog(v-model="dialogInvite" :disabled="loading" width="700" persistent scrollable)
              member-invite(
                dialog
                :facility="$activeOrganization.id"
                @create="fetchMembers"
                @invite="fetchInvitedMembers"
                @close="dialogInvite = false"
              )
        br
        v-divider
        v-progress-linear(v-show="loading" indeterminate).mt-0
        v-layout(row wrap).px-1
          v-flex(xs3 v-for="(member, key) in membersData" :key="key").px-2.py-3
            v-card(style="border-radius: 10px" height="100%" hover @click.stop="editMember(member)")
              v-card-text
                member-card(:member="member").pa-3
        v-divider
        v-card-actions
          v-spacer
          v-pagination(
            v-model="page"
            :length="length"
            :total-visible="7"
          )
          v-spacer
    v-dialog(v-if="member" v-model="dialogEdit" width="700" persistent scrollable)
      member-edit(
        dialog
        :member="member"
        @close="closeEditor"
        @update="fetchMembers()"
      )
    div(v-if="invitedTotal")
      br
      h1 Pending Invitations
      p Resend or cancel pending invitations.
      v-card.pb-2
        v-progress-linear(v-show="invitesLoading" indeterminate).mt-0
        v-layout(row wrap).px-1
          v-flex(xs3 v-for="(member, key) in membersInvited" :key="key").px-2.py-3
            v-card(style="border-radius: 10px" height="280" hover).normal-cursor
              v-card-text
                v-layout(row style="position: absolute; right: 10px;")
                  v-menu(bottom left)
                    template(slot="activator" slot-scope="{ on }")
                      v-btn(icon slot="activator" v-on="on")
                        v-icon mdi-dots-horizontal
                    v-list
                      v-list-tile(:disabled="onpremiseMode" @click.stop="resendInvitation(member)")
                        v-list-tile-title
                          v-icon.mr-2 mdi-reload
                          | Resend Invitation
                      v-list-tile(:disabled="onpremiseMode" @click.stop="cancelInvitation(member)")
                        v-list-tile-title
                          v-icon.mr-2 mdi-cancel
                          | Cancel Invitation
                member-card(:member="member").pa-3
        v-divider
        v-card-actions
          v-spacer
          v-pagination(
            v-model="invitedPage"
            :length="invitedLength"
            :total-visible="7"
          )
          v-spacer
</template>

<script>
// components
import MemberCard from './member-card';
import MemberEdit from './member-edit';
import MemberInvite from './member-invite';
import LoaderDialog from '../../commons/loader-dialog';
// constants
import * as constants from '../../../constants/organizations';
// utils
import { debounce } from 'lodash';
import { initLogger } from '../../../utils/logger';
import { syncVuexState } from '../../../utils/vue';
import { paginateQuery } from '../../../utils/store';
import * as organizationMembers from '../../../services/organization-members';

const log = initLogger('SettingsClinicMembers');

export default {
  components: {
    MemberCard,
    MemberInvite,
    MemberEdit,
    LoaderDialog,
  },
  data () {
    return {
      loading: false,
      dialogInvite: false,
      dialogEdit: false,
      member: null,
      membersData: [],
      total: 0,
      invitedTotal: 0,
      limit: 12,
      debouncedFetch: debounce(this.fetchMembers, 1000),
      // NOTE: moved from settings store
      membersInvited: [],
      invitesLoading: false,
    };
  },
  computed: {
    page: syncVuexState('table', 'settingsClinicMembersPage'),
    roleFilter: syncVuexState('table', 'settingsClinicMembersRoleFilter'),
    invitedPage: syncVuexState('table', 'settingsClinicMembersInvitedPage'),
    searchString: syncVuexState('table', 'settingsClinicMembersSearchText'),
    rolesAvailable () {
      return constants.ROLES;
    },
    onpremiseMode () {
      return process.env.VUE_APP_MODE === 'onpremise';
    },
    length () {
      return Math.ceil(this.total / this.limit) || 0;
    },
    invitedLength () {
      return Math.ceil(this.invitedTotal / this.limit) || 0;
    },
  },
  watch: {
    searchString: {
      handler (val) {
        this.page = 1;
        this.debouncedFetch();
      },
      deep: true,
    },
    roleFilter: {
      handler (val) {
        this.page = 1;
        this.debouncedFetch();
      },
      deep: true,
    },
    page () {
      this.fetchMembers();
    },
    invitedPage () {
      this.fetchInvitedMembers();
    },
  },
  created () {
    this.fetchMembers();
    this.fetchInvitedMembers();
  },
  methods: {
    editMember (member) {
      this.member = member;
      this.dialogEdit = true;
    },
    closeEditor () {
      this.member = null;
      this.dialogEdit = false;
    },
    async fetchMembers () {
      this.loading = true;
      try {
        const query = {
          organization: this.$activeOrganization.id,
        };

        log('fetchMembers#searchString: ', this.searchString);
        if (this.searchString) query.searchString = this.searchString;
        if (this.roleFilter) query.roles = this.roleFilter;

        log('fetchMembers#query: %O', query);

        const { items: members, total } = await organizationMembers.getOrganizationMembers(
          this.$sdk,
          paginateQuery({
            query,
            pageNo: this.page,
            pageSize: this.limit,
            skipOp: 'skip',
            limitOp: 'limit',
          })
        );
        this.total = total;

        log('fetchMembers#members: %O', members);
        const personalDetails = await Promise.all(
          members?.map(mem => this.$store.dispatch('accounts/getPersonalDetails', {
            uid: mem.uid,
          }))
        );
        this.membersData = members?.map(mem => {
          return {
            ...mem,
            account: personalDetails?.find(pD => pD.id === mem.uid),
          };
        });
      } catch (error) {
        log('fetchMembers#error');
        console.error(error);
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Please try again.',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    async fetchInvitedMembers () {
      try {
        this.invitesLoading = true;
        const query = {
          type: 'org-membership',
          'member.organization': this.$activeOrganization.id,
          $populate: {
            account: {
              service: 'accounts',
              key: 'email',
              $select: ['name', 'email'],
            },
          },
        };

        // execute ops
        const result = await this.$sdk.service('account-invitations')
          .find(paginateQuery({ query, pageNo: this.invitedPage, pageSize: this.limit }));
        this.invitedTotal = result.total;
        this.membersInvited = result.items.map(({ $populated: { account }, id, createdAt, email, member }) => ({
          invitation: id,
          invitedAt: createdAt,
          ...member,
          account: { email, ...account },
        }));
        log('fetchInvitedMembers#membersInvited: %O', this.membersInvited);
      } catch (error) {
        log('fetchInvitedMembers#error');
        console.error(error);
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Please try again.',
          color: 'error',
        });
      } finally {
        this.invitesLoading = false;
      }
    },
    async resendInvitation (member) {
      this.$refs.loader.open('Resending Invitation...');
      try {
        if (!member.invitation) throw new Error('Member has no invitation');
        await this.$sdk.service('account-invitations').update(member.invitation, {
          resend: true,
        });
        await this.fetchInvitedMembers();
        this.$enqueueSnack({
          message: 'Success! Invitation sent.',
          color: 'success',
        });
      } catch (error) {
        log('resendInvitation#error');
        console.error(error);
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Please try again.',
          color: 'error',
        });
      } finally {
        this.$refs.loader.close();
      }
    },
    async cancelInvitation (member) {
      this.$refs.loader.open('Cancelling Invitation...');
      try {
        if (!member.invitation) throw new Error('Member has no invitation');
        await this.$sdk.service('account-invitations').remove(member.invitation);
        this.invitedPage = 1;
        await this.fetchInvitedMembers();
        this.$enqueueSnack({
          message: 'Success! Invitation cancelled.',
          color: 'success',
        });
      } catch (error) {
        log('cancelInvitation#error');
        console.error(error);
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Please try again.',
          color: 'error',
        });
      } finally {
        this.$refs.loader.close();
      }
    },
  },
};
</script>

<style scoped>
.normal-cursor {
  cursor: default;
}
</style>
