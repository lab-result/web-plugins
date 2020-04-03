<template lang="pug">
  div
    v-menu(offset-y left)
      v-btn(flat slot="activator" icon large)
        v-avatar(:size="43")
          img(v-if="$currentUser && picURL" :src="picURL")
          img(v-else src="@/assets/images/person-placeholder.png")
      v-list(style="width: 300px;")
        v-list-tile(avatar two-line)
          v-list-tile-avatar
            img(v-if="picURL" :src="picURL")
            img(v-else src="@/assets/images/person-placeholder.png")
          v-list-tile-content
            v-list-tile-title {{name | prettifyNameFirst}}
            v-list-tile-sub-title {{email}}
        //- v-layout(row wrap).pa-1
        //-   template(v-for="(role, key) in $activeMembership.rolesValues")
        //-     v-chip(
        //-       :color="role.color"
        //-       text-color="white"
        //-       small
        //-     ) {{role.name}}
        v-divider
        v-list-tile(@click="goAccount")
          v-list-tile-title
            v-icon(style="font-size: 20px;").mr-2 mdi-account-outline
            | My Account
        v-list-tile(href="https://tutorials.mycure.md/")
          v-list-tile-title
            v-icon(style="font-size: 20px;").mr-2 mdi-help
            | Help
        v-list-tile(@click="confirmLogout = true")
          v-list-tile-title.error--text
            v-icon(style="font-size: 20px;").error--text.mr-2 mdi-logout-variant
            | Sign out
        //- v-divider
        //- v-list-tile.pa-0
          v-list-tile-title.pa-0
            small.right App version: 4.15.3-beta.75

    confirm-dialog(
      :dialog.sync="confirmLogout"
      :message="`Do you really want to logout?`"
      @yes="logout"
    )
</template>

<script>
import _ from 'lodash';
import ConfirmDialog from '../commons/confirm-dialog';

export default {
  components: {
    ConfirmDialog,
  },
  props: {
    accountsLink: {
      type: String,
      default: undefined,
    },
    helpLink: {
      type: String,
      default: undefined,
    },
    isAccount: Boolean,
  },
  data () {
    return {
      confirmLogout: false,
    };
  },
  computed: {
    picURL () {
      if (_.isEmpty(this.$currentUser)) {
        return '';
      }
      return this.$currentUser.picURL;
    },
    name () {
      if (_.isEmpty(this.$currentUser)) {
        return {};
      }
      return this.$currentUser.name;
    },
    email () {
      if (_.isEmpty(this.$currentUser)) {
        return {};
      }
      return this.$currentUser.email;
    },
    syncbaseStatus () {
      return this.$store.getters['ui/syncbaseStatus'];
    },
    serverURL () {
      return this.$store.getters['ui/serverURL'];
    },
  },
  methods: {
    async logout () {
      await this.$store.dispatch('auth/signout');
    },
    async goAccount () {
      if (this.isAccount) {
        this.$router.push({ name: 'account-personal-details' });
      } else {
        const token = await this.$store.dispatch('auth/getAccessToken');
        let link = `${process.env.VUE_APP_SIGNIN_URL}?token=${token}`;
        if (this.syncbaseStatus === 'enabled') {
          link += `&syncbaseuri=${this.serverURL}`;
        }
        window.location.href = link;
      }
      this.dialog = false;
    },
  },
};
</script>
