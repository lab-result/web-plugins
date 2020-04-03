import _ from 'lodash';
import Vue from 'vue';
import { mapSetters } from '../../utils/store';
import { take, share } from 'rxjs/operators';

export const STORE_NAME = 'chat';

/**
 * @typedef {Object} Account
 * @property {string} uid
 * @property {string} picURL
 * @property {Object} name
 * @property {string} name.firstName
 * @property {string} name.middleName
 * @property {string} name.lastName
 */

/**
 * @typedef {Object} ChatRoom
 * @property {string} id
 * @property {string} title
 * @property {Account} creator
 * @property {Account[]} participantsPopulated
 * @property {ChatMessage} lastMessage
 * @property {number} unseenMessages
 * @property {Object.<string, string>} participantsLastMessageSeen
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} [id] sending if no id yet
 * @property {number} createdAt
 * @property {Account} creator
 * @property {string} room
 * @property {string} text
 * @property {string} media
 * @property {ChatMessage} [failed] failed to send if set. original payload to be sent
 */

export default class Store {
  /**
   * @param {import('@mycure/sdk').CoreService} mycure
   */
  constructor (mycure) {
    const state = this.state = { // eslint-disable-line
      // NOTE: removed
      currentUserUid: null,
      /**
       * NOTE: renamed to chat.state.rooms
       * list of all available rooms for the current user
       * @type {ChatRoom[]}
       **/
      chatRooms: [],
      /**
       * NOTE: internal
       * rooms watching subscription
       * @type {import('rxjs').Subscription}
       **/
      chatRoomsSubscription: null,
      /**
       * NOTE: renamed to chat.state.messages
       * map of all messages by
       * @type {Object.<string,ChatMessage[]>}
       **/
      chatMessages: [],
      /**
       * NOTE: internal
       * map of room to messages subscription
       * @type {import('rxjs').Subscription}
       **/
      chatMessagesSubscription: null,
    };

    /**
     * @typedef {Object} ActionContext
     * @property {state} state
     * @property {(name: string, obj?: any) => any} commit
     * @property {(name: string, obj?: any) => any} dispatch
     */

    this.getters = {
      /**
       * NOTE: as is
       * number of unread messages
       * @param {state} state
       * @returns {number}
       */
      unreadMessages (state) {
        return state.chatRooms.reduce((s, r) => s + (r.unseenMessages || 0), 0);
      },
    };

    this.mutations = {
      ...mapSetters(Object.keys(this.state)),
      /**
       * @param {state} state
       * @param {object} obj
       * @param {boolean} obj.equalityCheck
       * @param {ChatMessage} obj.message
       */
      addOrUpdateInMessages (state, obj) {
        const { message, equalityCheck } = obj;
        const messages = state.chatMessages[message.room];
        // new room of messages
        if (!messages) return Vue.set(state.chatMessages, message.room, [message]);
        // update existing
        const index = messages.findIndex(m => equalityCheck ? m === message : m.id === message.id);
        if (~index) return Vue.set(messages, index, message);
        // push message
        messages.push(message);
      },
      /**
       * @param {state} state
       * @param {object} obj
       * @param {boolean} obj.equalityCheck
       * @param {ChatMessage} obj.message
       */
      removeInMessages (state, obj) {
        const { message, equalityCheck } = obj;
        const messages = state.chatMessages[message.room];
        if (!messages) return;
        state.chatMessages[message.room] = messages.filter(m => equalityCheck ? m !== message : m.id !== message.id);
      },
      /**
       * @param {state} state
       * @param {object} obj
       * @param {ChatRoom} obj.room
       */
      addOrUpdateInRooms (state, obj) {
        const { room } = obj;
        room.participants = room.participantsPopulated;
        room.unseenMessages = _.get(room.unseenMessages, state.currentUserUid) || 0;
        const rooms = state.chatRooms;
        // new room
        if (!rooms) return state.chatRooms.push(room);
        const index = rooms.findIndex(r => r.id === room.id);
        if (~index) return Vue.set(rooms, index, room);
        // push room
        rooms.push(room);
        // create messages
        if (state.chatMessages[room.id]) return;
        Vue.set(state.chatMessages, room.id, [room.lastMessage].filter(Boolean));
      },
      /**
       * @param {state} state
       * @param {object} obj
       * @param {ChatRoom} obj.room
       */
      removeInRooms (state, obj) {
        const { room } = obj;
        // remove room
        state.chatRooms = state.chatRooms.filter(r => r.id !== room.id);
        // remove associated messages
        if (!state.chatMessages[room.id]) return;
        state.chatMessages[room.id] = [];
      },
    };

    this.actions = {
      /**
       * NOTE: as is
       * called as soon as possible
       * to start watching for notifs
       * and incoming messages
       * @param {ActionContext} ctx
       */
      async watchChatRooms (ctx) {
        const currentUser = await mycure.auth().currentUser();
        if (ctx.state.currentUserUid === currentUser.uid) return;
        if (ctx.state.chatRoomsSubscription) ctx.state.chatRoomsSubscription.unsubscribe();
        // reset store
        ctx.commit('setChatRooms', []);
        ctx.commit('setChatMessages', {});

        // process stream
        const query = {};
        const stream = mycure.chat.rooms().find(query).watch({
          // timeoutInterval: 5000,
          emitChangedItem: true,
        }).pipe(share());
        const sub = stream.subscribe(rooms => rooms.forEach(room => {
          if (!room.__op) room.__op = 'create';
          room.participants = room.participantsPopulated;
          switch (room.__op) {
            case 'remove': return ctx.commit('removeInRooms', { room });
            case 'create':
            case 'update':
            default : return ctx.commit('addOrUpdateInRooms', { room });
          }
        }));
        ctx.commit('setChatRoomsSubscription', sub);
        ctx.commit('setCurrentUserUid', currentUser.uid);

        // return first emit
        return stream.pipe(take(1)).toPromise();
      },

      /**
       * NOTE: removed
       * called as soon as possible
       * to start watching for notifs
       * and incoming messages
       * @param {ActionContext} ctx
       * @param {object} obj
       * @param {string[]} obj.participants
       */
      async createChatRoom (ctx, obj) {
        if (!obj || !obj.participants || !obj.participants.length) {
          throw new Error('Participants required');
        }
        const room = await mycure.chat.rooms().create(obj);
        ctx.commit('addOrUpdateInRooms', { room });
        return room;
      },

      /**
       * NOTE: untransferred
       * @param {ActionContext} ctx
       * @param {object} obj
       * @param {string} obj.room room id to mark as seen
       */
      async markChatRoomAsSeen (ctx, obj) {
        const room = await mycure.chat.rooms()
          .update(obj.room, { seen: true })
          .catch(error => console.error(error));
        ctx.commit('addOrUpdateInRooms', { room });
      },

      /**
       * NOTE: as is
       * @param {ActionContext} ctx
       * @param {object} obj
       * @param {string} obj.room room id to listen messages in
       */
      async watchChatMessages (ctx, obj) {
        const messageProcessor = message => {
          switch (message.__op) {
            case 'remove': return ctx.commit('removeInMessages', { message });
            case 'create':
            case 'update':
            default: return ctx.commit('addOrUpdateInMessages', { message });
          }
        };
        const markRoomAsSeen = async messages => {
          // mark room as seen
          await ctx.dispatch('markChatRoomAsSeen', { room: obj.room });
          return messages;
        };

        // already have subscription, refetch messages
        if (ctx.state.chatMessagesSubscription) {
          // TODO: limit to only later than the latest in cache
          // const lastMessage = _.sortBy(ctx.state.chatMessages.filter(m => m.room === obj.room));
          const query = { room: obj.room, $limit: 50, $sort: { createdAt: -1 } };
          const messages = await mycure.chat.messages().find(query).then(r => r.items);
          messages.forEach(messageProcessor);
          return markRoomAsSeen(messages);
        }

        // process stream
        const query = { room: obj.room, $limit: 50, $sort: { createdAt: -1 } };
        const stream = mycure.chat.messages().find(query).watch({
          // timeoutInterval: 1000,
          emitChangedItem: true,
        }).pipe(share());
        const sub = stream.subscribe(messages => messages.forEach(messageProcessor));
        ctx.commit('setChatMessagesSubscription', sub);

        // return first emit
        return stream.pipe(take(1)).toPromise().then(markRoomAsSeen);
      },

      /**
       * @param {ActionContext} ctx
       */
      async unwatchChatMessages (ctx) {
        if (ctx.state.chatMessagesSubscription) {
          ctx.state.chatMessagesSubscription.unsubscribe();
          ctx.commit('setChatMessagesSubscription', null);
        }
      },

      /**
       * NOTE: as is
       * @param {ActionContext} ctx
       * @param {object} obj
       * @param {string} [obj.room] - chat room if available
       * @param {string} [obj.text] - chat message
       * @param {string} [obj.media] - for uploaded media
       */
      async createChatMessage (ctx, obj) {
        if (!obj) throw new Error('Chat message required');
        if (!obj.room) throw new Error('Room is require');
        if (!obj.text && !obj.media) throw new Error('Text or media URL required');

        // optimisitc sending
        if (obj.failed) delete obj.failed;
        ctx.commit('addOrUpdateInMessages', { message: obj, equalityCheck: true });

        await new Promise(resolve => setTimeout(resolve, 2000));

        // actual sending
        await mycure.chat.messages().create(obj)
          // remove optimistic message data
          .then(() => ctx.commit('removeInMessages', { message: obj, equalityCheck: true }))
          // mark message as failed send
          .catch(error => {
            obj.failed = true;
            ctx.commit('addOrUpdateInMessages', { message: obj, equalityCheck: true });
            throw error;
          });
      },
    };
  }

  extractModule () {
    return {
      namespaced: true,
      state: this.state,
      getters: this.getters,
      actions: this.actions,
      mutations: this.mutations,
    };
  }
}
