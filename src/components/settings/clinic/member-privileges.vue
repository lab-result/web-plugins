<template lang="pug">
  v-layout(column)
    v-layout(v-for="(role,i) in rolesMapped" :key="i" column).mb-3
      h2 {{ role.name }} Privileges
      v-data-table(:headers="headers" :items="mapPrivileges(role.privileges)" hide-actions)
        template(slot="items" slot-scope="{ item }")
          td {{ item.name }}
          td
            v-checkbox(
              hide-details
              style="width: 1%"
              :input-value="item.all.value"
              @change="updatePrivilege(item.all.key, !item.all.value)"
            )
          td
            v-checkbox(
              v-if="item.create"
              hide-details
              style="width: 1%"
              :readonly="item.all.value"
              :input-value="item.create.value"
              @change="updatePrivilege(item.create.key, !item.create.value)"
            )
          td
            v-checkbox(
              v-if="item.view"
              hide-details
              style="width: 1%"
              :readonly="item.all.value"
              :input-value="item.view.value"
              @change="updatePrivilege(item.view.key, !item.view.value)"
            )
          td
            v-checkbox(
              v-if="item.update"
              hide-details
              style="width: 1%"
              :readonly="item.all.value"
              :input-value="item.update.value"
              @change="updatePrivilege(item.update.key, !item.update.value)"
            )
          td
            v-checkbox(
              v-if="item.remove"
              hide-details
              style="width: 1%"
              :readonly="item.all.value"
              :input-value="item.remove.value"
              @change="updatePrivilege(item.remove.key, !item.remove.value)"
            )
</template>

<script>
import _ from 'lodash';
import * as constants from './constants';
import * as organizationConstants from '@mycure/vue-plugins/lib/organizations/constants';

/**
 * @typedef {import('../../../plugins/settings/store').OrganizationMember} OrganizationMember
 */

export default {
  props: {
    roles: {
      type: Array,
      required: true,
    },
    value: {
      type: Object,
      default: undefined,
    },
  },
  data: () => ({
    headers: [
      {
        text: 'Privilege',
        sortable: false,
        align: 'left',
        width: '95%',
      },
      {
        text: 'All',
        sortable: false,
        align: 'center',
        width: '1%',
      },
      {
        text: 'Create',
        sortable: false,
        align: 'center',
        width: '1%',
      },
      {
        text: 'View',
        sortable: false,
        align: 'center',
        width: '1%',
      },
      {
        text: 'Update',
        sortable: false,
        align: 'center',
        width: '1%',
      },
      {
        text: 'Remove',
        sortable: false,
        align: 'center',
        width: '1%',
      },
    ],
  }),
  computed: {
    rolesAvailable () {
      return organizationConstants.ROLES;
    },
    rolesMapped () {
      return this.roles.map(id => {
        const role = this.rolesAvailable.find(r => r.id === id);
        if (!role) throw new Error(`Invalid role '${role}'`);
        return role;
      });
    },
  },
  watch: {
    roles () {
      this.resetPrivileges();
    },
  },
  created () {
    this.resetPrivileges();
  },
  methods: {
    mapPrivileges (privileges) {
      return privileges.map(privilege => {
        const priv = {
          key: privilege,
          name: constants.PRIVILEGE_DESCRIPTION[privilege],
          all: { key: privilege, value: !!this.value[privilege] },
        };
        [
          { name: 'create', suffix: 'Create' },
          { name: 'view', suffix: 'Read' },
          { name: 'update', suffix: 'Update' },
          { name: 'remove', suffix: 'Delete' },
        ].forEach(({ name, suffix }) => {
          const key = privilege + suffix;
          if (!constants.PRIVILEGE_DESCRIPTION[key]) return;
          priv[name] = { key, value: priv.all.value || !!this.value[key] };
        });
        return priv;
      });
    },
    updatePrivilege (privilege, value) {
      const prevs = { ...this.value };
      prevs[privilege] = value;
      this.$emit('input', prevs);
    },
    resetPrivileges () {
      const privileges = this.roles.reduce((acc, id) => {
        const role = this.rolesAvailable.find(r => r.id === id);
        if (!role) return acc;
        role.privileges.forEach(key => {
          acc[key] = this.value[key];
          if (typeof acc[key] === 'undefined') acc[key] = true;
        });
        return acc;
      }, {});
      if (!_.isEqual(privileges, this.value)) this.$emit('input', privileges);
    },
  },
};
</script>
