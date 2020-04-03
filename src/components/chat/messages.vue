<template lang="pug">
  div
    template(v-for="(msg, key) in chatMessages")
      v-layout(row :justify-end="isMe(msg.createdBy)")
        //- me
        template(v-if="isMe(msg.createdBy)")
          v-scroll-y-transition
            v-flex(shrink).pa-2.ma-2.box.elevation-3.right.primary.white--text.arrow-right
              span(v-html="msg.text")
              br
              br
              small {{msg.createdAt | morph-date('MMM. DD, YYYY hh:mm:ss A')}}
        //- !me
        template(v-else)
            v-flex(shrink).pl-2
              v-avatar(size="25").mt-3
                img(:src="(room.creator || {}).picURL")
            v-flex(shrink).pa-2.ma-2.box.elevation-3.right.white
              span(v-html="msg.text")
              br
              br
              small.right {{msg.createdAt | morph-date('MMM. DD, YYYY hh:mm:ss A')}}
</template>

<script>
export default {
  props: {
    room: {
      type: Object,
      default: undefined,
    },
  },
  computed: {
    chatMessages () {
      return this.$store.state.chat.chatMessages;
    },
  },
  methods: {
    isMe (uid) {
      return uid === this.$currentUser.uid;
    },
  },
};
</script>

<style scoped>
  .box {
    min-width: 200px;
    border-radius: 5px;
  }
</style>
