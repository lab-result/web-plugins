<template lang="pug">
  div
    v-toolbar.elevation-0
      v-icon(v-if="icon") {{ icon }}
      v-avatar(v-if="picURL")
        img(:src="picURL")
      v-toolbar-title {{ title }}
      v-spacer
      //- v-btn(icon)
        v-icon mdi-chevron-right
      v-btn(icon @click="backToHome" v-if="selectedRoom || newRoom")
        v-icon mdi-close

    //- room
    template(v-if="selectedRoom")
      chat-room(:is-displaying="isDisplaying" :room="selectedRoom")

    //- accounts
    template(v-else-if="newRoom")
      div.pa-2
        v-card(style="background-color: #f5f5f5;")
          v-card-text
            org-members-search(
              solo
              flat
              @select="createNewRoom($event)"
            )
      v-list(two-line v-for="(account, key) in accounts" :key="key")
        v-list-tile(@click="createNewRoom(account)")
          v-list-tile-action
            v-avatar
              img(:src="account.picURL")
          v-list-tile-content
            v-list-tile-title {{ account.name | prettify-name }}

    //- rooms
    template(v-else)
      v-list(two-line)
        v-list-tile(@click="newRoom=true")
          v-list-tile-action
            v-icon mdi-message-plus
          v-list-tile-content
            v-list-tile-title New Conversation
            v-list-tile-sub-title.primary--text Send a chat message to a staff
      v-divider
      div.ml-3.mt-2
        h4.grey--text Recent Conversations
      v-list(two-line v-for="(room, key) in rooms" :key="key")
        v-list-tile(@click="selectRoom(room)")
          v-list-tile-action
            v-avatar
              img(:src="getNotSelf(room).picURL || defaultImage")
          v-list-tile-content
            v-list-tile-title {{ getNotSelf(room).name | prettify-name }}
              small.right.grey--text {{ room.lastMessage.createdAt | morph-date('MMM. DD, YYYY hh:mm A') }}
            v-list-tile-sub-title.grey--text {{ room.lastMessage.text }}
              v-avatar(v-if="room.unseenMessages" size="20" dark).right.error.white--text {{ room.unseenMessages <= 99 ? room.unseenMessages : '99+' }}
</template>

<script>
// components
import ChatRoom from './chat-room';
import OrgMembersSearch from '../org/org-members-search';
// constants
import defaultImage from '../../assets/images/person-placeholder.png';
// utils
import _ from 'lodash';
import * as organizationMembers from '../../services/organization-members';

export default {
  components: {
    ChatRoom,
    OrgMembersSearch,
  },
  props: {
    isDisplaying: Boolean,
  },
  data: () => ({
    defaultImage,
    loading: false,
    newRoom: false,
    selectedRoom: null,
    organizationMembers: [],
  }),
  computed: {
    accounts () {
      return this.organizationMembers.filter(m => m.uid !== this.$currentUser.uid);
    },
    participant () {
      if (!this.selectedRoom) return;
      return this.getNotSelf(this.selectedRoom);
    },
    title () {
      if (!this.selectedRoom && !this.newRoom) return 'Messages';
      if (!this.selectedRoom && this.newRoom) return 'New Conversation';
      if (this.selectedRoom.title) return this.selectedRoom.title;
      const firstName = _.get(this.participant, 'name.firstName');
      const lastName = _.get(this.participant, 'name.lastName');
      return [firstName, lastName].filter(Boolean).join(' ');
    },
    icon () {
      if (this.selectedRoom) return;
      if (this.newRoom) return 'mdi-message-plus';
      return 'mdi-message-text-outline';
    },
    picURL () {
      if (!this.selectedRoom) return;
      return _.get(this.participant, 'picURL') || defaultImage;
    },
    rooms () {
      const rooms = this.$store.state.chat.chatRooms
        .filter(room => room.lastMessage)
        .map(room => {
          room.creator = room.creator || {};
          return room;
        });
      return _.reverse(_.sortBy(rooms, 'lastMessage.createdAt'));
    },
  },
  created () {
    this.loadRooms();
  },
  methods: {
    getNotSelf (room) {
      return _.head(_.filter(
        _.get(room, 'participants'),
        p => p.uid !== this.$currentUser.uid
      ));
    },
    backToHome () {
      this.selectedRoom = null;
      this.newRoom = false;
    },
    selectRoom (room) {
      this.selectedRoom = room;
    },
    createNewRoom (account) {
      this.selectedRoom = {
        participants: [account],
      };
    },
    async loadRooms () {
      this.loading = true;
      try {
        const opts = { organization: this.$activeOrganization.id };
        await organizationMembers.getOrganizationMembers(this.$sdk, opts);
        await this.$store.dispatch('chat/watchChatRooms');
      } catch (error) {
        console.error(error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
      this.loading = false;
    },
  },
};
</script>
