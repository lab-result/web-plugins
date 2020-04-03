<template lang="pug">
  div.text-xs-center
    //- picture
    v-layout(row wrap align-center justify-center style="min-height: 100px;")
      img(:src="picURL" style="border-radius: 50%" width="100px")

    //- name
    template(v-if="name.length > 30")
      v-tooltip(bottom)
        span {{ name }}
        template(slot="activator" slot-scope="{ on }")
          strong(v-on="on")
            br
            | {{ name | truncate(30) }}
    template(v-else)
      strong
        br
        | {{ name }}

    //- email
    template(v-if="email.length > 30")
      v-tooltip(bottom)
        span {{ email }}
        template(slot="activator" slot-scope="{ on }")
          p(style="font-size: 10px;" v-on="on") {{ email | truncate(30) }}
    template(v-else)
      p(style="font-size: 10px;") {{ email }}

    //- description/roles
    v-layout(column align-center)
      template(v-for="(role,index) in limitedDescription")
        v-chip(
          v-if="role.name"
          :color="role.color"
          text-color="white"
        ) {{ role.name }}
      v-chip(
        v-if="doRolesExceedLimit"
        dark
      )
        v-icon mdi-dots-horizontal
</template>

<script>
import _ from 'lodash';
import { ROLES_MAP } from './constants';
import defaultProfile from '@/assets/images/person-placeholder.png';

/**
 * @typedef {import('../../../plugins/settings/store').OrganizationMember} OrganizationMember
 */

export default {
  filters: {
    truncate (val, length = 30) {
      return _.truncate(val, { length });
    },
  },
  props: {
    /** @type {OrganizationMember} */
    member: {
      type: Object,
      required: true,
    },
    hover: {
      type: Boolean,
    },
  },
  data: () => ({
    loading: false,
  }),
  computed: {
    invitedAt () {
      return this.member.invitedAt;
    },
    name () {
      if (!_.get(this.member, 'account.name')) return '';
      return [
        _.get(this.member, 'account.name.firstName'),
        _.get(this.member, 'account.name.lastName'),
      ].filter(Boolean).join(' ');
    },
    email () {
      return _.get(this.member, 'account.email') || '';
    },
    picURL () {
      return _.get(this.member, 'account.picURL') || defaultProfile;
    },
    description () {
      const roles = this.member.roles || [];
      return roles.map(id => {
        const role = ROLES_MAP[id] || {};
        return role;
      });
    },
    limitedDescription () {
      return _.take(this.description, 2);
    },
    doRolesExceedLimit () {
      return _.size(this.description) > 2;
    },
  },
};
</script>
