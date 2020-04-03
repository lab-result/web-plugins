<template lang="pug">
  div
    v-progress-linear(v-if="loading" indeterminate :height="3").ma-0
    //- actions
    v-layout(row)
      v-btn(flat icon @click="close")
        v-icon mdi-close
      v-spacer
      v-btn(v-if="unreadNotificationsCount" flat @click="markAllAsRead") Mark All as Read

    //- notifs list
    v-list(v-if="notificationsCount" three-line)
      v-list-tile(
        v-for="notification in notifications"
        :key="notification.id"
        :class="{ read: notification.seen }"
        @click="onNotificationClick(notification)"
      ).notification-tile
        v-list-tile-content
          v-layout(row)
            v-flex
              div(:style="getStyle(notification)").bubble
            v-flex(grow)
              v-list-tile-title.mc-title {{ getTitle(notification) }}
              v-list-tile-sub-title {{ notification.body }}
              v-list-tile-sub-title
                small.mc-underline
                  | {{ notification.createdAt | morph-date('MMM DD, YYYY hh:mm A') }}
        v-list-tile-action(v-if="notification.seen")
          v-icon.mc-icon mdi-eye

    //- no notifs view
    v-layout(v-else column align-center).my-5
      v-flex(shrink)
      img(src="@/assets/images/lab-result-icon-192x192.png" height="100" width="100")
      v-flex(shrink).mt-3
        h2 No Notifications
      v-flex(shrink)
        span All caught up!
</template>

<script>
import _ from 'lodash';
import { permitBaseRoles } from '../../utils/permissions';
import {
  NOTIFICATION_TITLE_MAP,
  NOTIFICATION_ROUTE_BUILDER_MAP,
  NOTIFICATION_CODE_COLOR_MAP,
  QUEUE_TYPE_BASE_ROLES_MAP,
  QUEUE_ROUTE_BASE_ROLES_MAP,
} from './constants';

/**
 * @typedef {import('../../plugins/notifications/store').Notification} Notification
 */

export default {
  data () {
    return {
      loading: false,
      snackNotifs: _.debounce(() => {
        const notifications = this.notificationsNew;
        if (!notifications.length) return;
        let message = notifications[0].title;
        if (notifications.length > 2) message += `and ${notifications.length - 1} more`;
        this.$enqueueSnack({
          message,
          top: true,
          right: true,
          theme: 'toasted-primary',
          action: {
            text: 'Close',
            onClick: (e, toast) => void toast.goAway(0),
          },
        });
        this.$store.dispatch('notifications/clearNewNotifications');
      }, 300),
    };
  },
  computed: {
    currentUserMembership () {
      return this.$activeMembership;
    },
    /** @returns {Notification[]} */
    notifications () {
      /** @type {Notification[]} */
      const notifications = this.$store.state.notifications.notifications;
      /** @type {Notification[]} */
      const notificationsUpdated = this.$store.state.notifications.notificationsUpdated;
      return notifications
        .filter(n => !n.seen)
        .concat(notificationsUpdated)
        .filter(Boolean);
    },
    /** @returns {Notification[]} */
    notificationsNew () {
      return this.$store.state.notifications.notificationsNew;
    },
    /** @returns {number} */
    notificationsCount () {
      return this.notifications.length;
    },
    /** @returns {number} */
    unreadNotificationsCount () {
      return this.$store.getters['notifications/unreadNotificationsCount'];
    },
  },
  watch: {
    notificationsNew (notifications) {
      if (!notifications.length) return;
      this.snackNotifs();
    },
  },
  created () {
    this.$initLogger('notifications-list');
    this.init();
  },
  methods: {
    async init () {
      this.loading = true;
      try {
        await this.$store.dispatch('notifications/watchNotifications');
      } catch (error) {
        this.$log('init#error: %O', error);
      }
      this.loading = false;
    },
    async markAsRead (notification) {
      if (notification.seen) return;
      this.loading = true;
      try {
        await this.$store.dispatch('notifications/markAsSeen', { notification: notification.id });
      } catch (e) {
        this.$log('onNotificationClick#error: %O', e);
      }
      this.loading = false;
    },
    async markAllAsRead () {
      this.loading = true;
      try {
        await this.$store.dispatch('notifications/markAsSeen');
      } catch (error) {
        this.$log('markAllAsRead#error: %O', error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
      this.loading = false;
    },
    close () {
      this.$emit('close');
    },
    getTitle (notification) {
      if (!notification) return;
      return _.get(NOTIFICATION_TITLE_MAP, notification.type);
    },
    getStyle (notification) {
      return { 'background-color': this.getColor(notification) };
    },
    getColor (notification) {
      if (!notification) return;

      return _.get(NOTIFICATION_CODE_COLOR_MAP, notification.code);
    },
    onNotificationClick (notification) {
      this.gotoRoute(notification);
      this.markAsRead(notification);
    },
    gotoRoute (notification) {
      this.$log('gotoRoute#notification: %O', notification);
      const notificationType = _.get(notification, 'type');

      const routeBuilder = _.get(
        NOTIFICATION_ROUTE_BUILDER_MAP,
        notificationType
      );
      this.$log('gotoRoute#routeBuilder: %O', routeBuilder);
      if (!routeBuilder) return;

      const route = routeBuilder(notification);
      this.$log('gotoRoute#route: %O', route);
      if (!route) return;

      // handle role checking
      const baseRoles = _.get(QUEUE_ROUTE_BASE_ROLES_MAP, _.get(route, 'name'));
      if (!_.isEmpty(baseRoles) &&
        !permitBaseRoles(this.currentUserMembership, baseRoles)) {
        return;
      }

      // add role checking for queues
      this.$log(`gotoRoute#notificationType: ${notificationType}`);
      if (notificationType === 'queue-item') {
        const queueType = _.get(notification, 'meta.queueObject.type');
        this.$log(`gotoRoute#queueType: ${queueType}`);

        const baseRoles = _.get(QUEUE_TYPE_BASE_ROLES_MAP, queueType);
        this.$log('gotoRoute#baseRoles: %O', baseRoles);
        if (!permitBaseRoles(this.currentUserMembership, baseRoles)) return;
      }

      this.$router.push(route);
      this.$emit('close');
    },
  },
};
</script>

<style scoped>
.read {
  background-color: #f5f5f5;
}

.read .mc-title, .read .mc-subtitle, .read .mc-icon {
  font-weight: normal;
  color: #9e9e9e;
}

.notification-tile {
  border-bottom: solid 1px #eff3f5;
}

.bubble {
  height: 18px;
  width: 18px;
  margin: 3px 8px 0px 0px;
  border-radius: 5px;
}

.mc-underline {
  text-decoration: underline;
}
</style>
