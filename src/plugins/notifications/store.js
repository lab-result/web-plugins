import Vue from 'vue';
import { mapSetters, initLogger } from '../../utils/store';
import { share, take } from 'rxjs/operators';

export const STORE_NAME = 'notifications';
const log = initLogger(STORE_NAME);

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} type
 * @property {string} title
 * @property {string} body
 * @property {boolean} seen flag if seen by current user
 * @property {Object.<string,any>} meta
 */

export default class Store {
  /**
   * @param {import('@mycure/sdk').CoreService} mycure
   */
  constructor (mycure) {
    const state = this.state = { // eslint-disable-line
      /**
       * NOTE: removed
       * uid
       * basis for caching
       * @type {string}
       */
      currentUserUid: null,
      /**
       * NOTE: as is
       * notifications list
       * @type {Notification[]}
       **/
      notifications: [],
      /**
       * NOTE: as is
       * notifications watcher's observable subscription
       * @type {import('rxjs').Subscription}
       **/
      notificationsSub: null,
      /**
       * NOTE: as is
       * list of newly emitted notifications
       * @type {Notification[]}
       **/
      notificationsNew: [],
      /**
       * NOTE: as is
       * list of newly updated notifications
       * @type {Notification[]}
       **/
      notificationsUpdated: [],
    };

    /**
     * @typedef {Object} ActionContext
     * @property {state} state
     * @property {(name: string, obj?: any) => any} commit
     * @property {(name: string, obj?: any) => any} dispatch
     */

    this.getters = {
      /** @param {state} state */
      unreadNotificationsCount (state) {
        return state.notifications.reduce((s, n) => n.seen ? s : s + 1, 0);
      },
    };

    this.mutations = {
      ...mapSetters(Object.keys(this.state)),

      /**
       * returns only added notifications
       * @param {state} state
       * @param {object} obj
       * @param {Notification} obj.notification
       * @param {boolean} obj.addToNewNotifications
       * @returns {Notification}
       */
      addOrUpdateInNotifications (state, obj) {
        const { notification, addToNewNotifications } = obj;
        const notifications = state.notifications;

        // find existing
        const index = notifications.findIndex(n => n.id === notification.id);

        // update existing
        if (~index) {
          // not a valid change, discard
          if (!notification.seen) return;
          // marked as seen
          Vue.set(notifications, index, notification);
          // add to updated list
          state.notificationsUpdated.push(notification);
          return;
        }

        // add to list
        notifications.push(notification);

        // sort ascending
        notifications.sort((a, b) => b.createdAt - a.createdAt);

        // add to new notifs list (if needed)
        if (!notification.seen && addToNewNotifications) {
          const notifications = state.notificationsNew;
          const index = notifications.findIndex(n => n.id === notification.id);
          if (!~index) notifications.push(notification);
        }
      },

      /**
       * @param {state} state
       * @param {object} obj
       * @param {Notification} obj.notification
       */
      removeInNotifications (state, obj) {
        const { notification } = obj;
        const notifications = state.notifications;
        state.notifications = notifications.filter(n => n.id !== notification.id);
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
      async watchNotifications (ctx) {
        const currentUser = await mycure.auth().currentUser();
        if (ctx.state.currentUserUid === currentUser.uid) return;

        // reset state
        log('watchNotifications#reset: %0');
        if (ctx.state.currentUserUid) ctx.commit('setCurrentUserUid', null);
        ctx.dispatch('unwatchNotifications', { root: true });

        // process stream
        log('watchNotifications#processStream: %0');
        const query = { $sort: { createdAt: -1 }, seenBy: { $ne: currentUser.uid } };
        const stream = mycure.notifications().find(query).watch({ emitChangedItem: true }).pipe(share());
        const sub = stream.subscribe(notifications => notifications.forEach(notification => {
          switch (notification.__op) {
            case 'remove': return ctx.commit('removeInNotifications', { notification });
            case 'create':
            case 'update':
            default : {
              notification.seen = !notification.seenBy ? false : !!~notification.seenBy.indexOf(currentUser.uid);
              ctx.commit('addOrUpdateInNotifications', {
                notification,
                addToNewNotifications: notification.__op === 'create',
              });
            }
          }
        }));
        ctx.commit('setCurrentUserUid', currentUser.uid);
        ctx.commit('setNotificationsSub', sub);

        // return first emit
        return stream.pipe(take(1)).toPromise();
      },
      /**
       * @param {ActionContext} ctx
       */
      async unwatchNotifications (ctx) {
        log('unwatchNotifications#start: %0');
        if (ctx.state.notifications.length > 0) ctx.commit('setNotifications', []);
        if (ctx.state.notificationsSub) {
          log('unwatchNotifications#unsubsribe: %0');
          ctx.state.notificationsSub.unsubscribe();
          ctx.commit('setNotificationsSub', null);
        }
        if (ctx.state.notificationsNew.length > 0) ctx.commit('setNotificationsNew', []);
        if (ctx.state.notificationsUpdated.length > 0) ctx.commit('setNotificationsUpdated', []);
        log('unwatchNotifications#end: %0');
      },
      /**
       * NOTE: as is
       * mark a notification or
       * all unseen notifications as seen
       * @param {ActionContext} ctx
       * @param {Object} obj
       * @param {string} [obj.notification] notification id to mark as unseen
       */
      async markAsSeen (ctx, obj) {
        obj = obj || {};
        let query = obj.notification;
        if (!query) {
          let page = 1;
          const $limit = 100;
          const currentUser = await mycure.auth().currentUser();
          const { total } = await mycure.notifications().find({
            seenBy: { $ne: currentUser.uid },
            $limit: 1,
          });

          await ctx.dispatch('unwatchNotifications', { root: true });
          while (total > ((page - 1) * $limit)) {
            query = {
              seenBy: { $ne: currentUser.uid },
              $limit,
            };

            const { items } = await mycure.notifications().find(query);
            const ids = items.map(item => item.id);

            await mycure.notifications().update({ id: { $in: ids } }, { seen: true });
            page++;
          }
          ctx.commit('setCurrentUserUid', null);
          await ctx.dispatch('watchNotifications', { root: true });
        } else {
          await ctx.dispatch('unwatchNotifications', { root: true });
          await mycure.notifications().update(query, { seen: true });
          ctx.commit('setCurrentUserUid', null);
          await ctx.dispatch('watchNotifications', { root: true });
        }
        // for mark all
        // if (typeof query !== 'string') ctx.commit('setNotificationsUpdated', []);
      },
      /**
       * NOTE: as is
       * @param {ActionContext} ctx
       */
      clearNewNotifications (ctx) {
        if (ctx.state.notificationsNew.length) ctx.commit('setNotificationsNew', []);
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
