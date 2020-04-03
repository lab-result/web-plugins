<template lang="pug">
  div
    v-layout(column)#message-container.message-container
      v-flex(grow)
        template(v-for="(message,i) in messages")
          chat-message(:key="i" :message="message" @resend="sendMessage")
        v-layout(row v-if="loading")
          v-progress-circular(indeterminate).mx-auto
      v-flex
        div#scroll-here
      v-layout(v-if="!isScrolledToBottom" row).fab-container
        v-spacer
        v-badge(
          :value="unseenMessagesCount"
          color="error"
          left
          overlap
        )
          template(slot="badge")
            span {{unseenMessagesCount}}
          v-btn(
            color="grey darken-3"
            fab
            dark
            icon
            small
            @click="scrollDown"
          ).fab
            v-icon mdi-chevron-down
    v-divider
    div.chat-form
      v-form(@submit.prevent="sendMessage()")
        v-layout(row).pa-2
          v-flex(grow)
            v-text-field(
              v-model.trim="text"
              placeholder="Type a message..."
              autofocus
              outline
              no-resize
              height="80"
              hide-details
            )
          v-flex(shrink)
            v-btn(large type="submit" color="primary" :disabled="loading || !text").mt-3
              v-icon mdi-send
</template>

<script>
import _ from 'lodash';
import datefns from 'date-fns';
import ChatMessage from './chat-message';
import defaultImage from '../../assets/images/person-placeholder.png';

export default {
  components: { ChatMessage },
  props: {
    room: {
      type: Object,
      required: true,
    },
    isDisplaying: Boolean,
  },
  data: () => ({
    createdRoom: null,
    loading: false,
    text: '',
    isScrolledToBottom: true,
    /** Counts the number of messages received while scrolled up, out of view of latest messages. */
    unseenMessagesCount: 0,
    /**
     * NOTE: internal
     * Used for counting new messages for incrementing unseenMessagesCount
     */
    prevMessagesSize: 0,
    /**
     * NOTE: internal
     * Used for synchronizing isScrolledToBottom with the IntersectionObserver API
     */
    intersectionObserver: null,
  }),
  computed: {
    messages () {
      return (this.$store.state.chat.chatMessages[this.roomId] || [])
        .sort((a, b) => {
          if (!b.createdAt) return -1;
          return datefns.compareAsc(a.createdAt, b.createdAt);
        });
    },
    roomId () {
      return this.room.id || this.createdRoom;
    },
    picURL () {
      if (this.room.picURL) return this.room.picURL;
      return _.get(this.participant, 'picURL') || defaultImage;
    },
    title () {
      if (this.room.title) return this.room.title;
      const firstName = _.get(this.participant, 'name.firstName');
      const lastName = _.get(this.participant, 'name.lastName');
      return [firstName, lastName].filter(Boolean).join(' ');
    },
    participant () {
      return this.room.participants.filter(p => p.uid !== this.$currentUser.uid)[0];
    },
  },
  watch: {
    room: {
      handler (val, old) {
        if (old && old.id === val.id) return;
        this.loadMessages();
      },
      deep: true,
    },
    messages: {
      handler (messages) {
        const size = _.size(messages);
        // NOTE: can't get this from second argument to watcher
        // because Vue doesn't store the pre-mutate value and relies on the actual reference being different
        // but since we're watching a computed property, no reference is stored anywhere
        const prevSize = this.prevMessagesSize;
        this.$log(`watch#messages#size: ${size}`);
        this.$log(`watch#messages#prevSize: ${prevSize}`);
        // only take action if there are new messages
        if (size === prevSize) return;

        // only take action if not scrolled to bottom
        this.$log(`watch#messages#isScrolledToBottom: ${this.isScrolledToBottom}`);
        if (!this.isScrolledToBottom) {
          this.unseenMessagesCount += size - prevSize;
          this.$log(`watch#messages#unseenMessagesCount: ${this.unseenMessagesCount}`);
        }

        // synchronize sizes after everything
        this.prevMessagesSize = size;
        // stick to bottom if already scrolled down
        if (this.isScrolledToBottom) this.scrollDown();
        // mark as seen if displaying
        if (this.isDisplaying) this.$store.dispatch('chat/markChatRoomAsSeen', { room: this.room.id });
      },
      deep: true,
    },
    isScrolledToBottom (isScrolledToBottom) {
      if (isScrolledToBottom) this.unseenMessagesCount = 0;
    },
    isDisplaying (isDisplaying) {
      if (isDisplaying) this.$store.dispatch('chat/markChatRoomAsSeen', { room: this.room.id });
    },
  },
  created () {
    this.$initLogger('chat-room');
    this.scrollDown();
  },
  mounted () {
    this.watchScrolledState();
    this.loadMessages();
  },
  destroyed () {
    this.unwatchScrolledState();
    this.$store.dispatch('chat/unwatchChatMessages');
  },
  methods: {
    async loadMessages () {
      this.loading = true;
      try {
        if (!this.room.id) {
          const room = await this.$store.dispatch('chat/createChatRoom', {
            participants: this.room.participants.map(p => p.uid).concat(this.$currentUser.uid),
          });
          this.createdRoom = room.id;
        }
        await this.$store.dispatch('chat/watchChatMessages', { room: this.roomId });
      } catch (error) {
        console.error(error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
      this.loading = false;
    },
    async sendMessage (message) {
      const isResend = !!message;
      if (!isResend) {
        message = {
          room: this.roomId,
          text: this.text,
        };
      }
      if (!message.text) return;
      this.$store.dispatch('chat/createChatMessage', message)
        .catch(error => console.error(error));
      if (!isResend) this.text = '';
      this.scrollDown();
    },
    watchScrolledState () {
      const options = {
        root: document.querySelector('#message-container'),
        threshold: [0, 1],
      };
      this.intersectionObserver = new window.IntersectionObserver(
        this.handleScrolledState.bind(this),
        options
      );
      this.$log('watchScrolledState#intersectionObserver: %O', this.intersectionObserver);

      const target = document.querySelector('#scroll-here');
      this.intersectionObserver.observe(target);
    },
    unwatchScrolledState () {
      if (this.intersectionObserver) this.intersectionObserver.disconnect();
      this.$log('unwatchScrolledState: disconnected');
    },
    handleScrolledState (entries) {
      this.$log('handleScrolledState#entries: %O', entries);
      const entry = _.head(entries);
      this.$log('handleScrolledState#entry: %O', entry);

      this.isScrolledToBottom = entry.intersectionRatio === 1;
      this.$log(`handleScrolledState#isScrolledToBottom: ${this.isScrolledToBottom}`);
    },
    scrollDown () {
      setTimeout(() => {
        const div = document.getElementById('message-container');
        if (!div) return;
        div.scrollTop = div.scrollHeight;
      }, 200);
    },
  },
};
</script>

<style scoped>
  .chat-form {
    width: 275px;
    height: 100px;
    background-color: white;
  }

  .message-container {
    height: calc(100vh - 230px);
    overflow: auto;
    position: relative;
  }

  .fab-container {
    position: fixed;
    bottom: 125px;
    right: 25px;
  }
</style>
