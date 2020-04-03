<template lang="pug">
  div
    v-container(fluid).mt-5
      v-layout(row fill-height)
        v-flex(xs12 md3).pa-2
          v-card(height="100%")
            v-card-text
              generic-search(
                :items="searchableNavs"
                outline
                item-text="title"
                label="Search settings"
                @select="routeSelect"
              )
                template(slot="item" slot-scope="props")
                  v-list-tile-content(v-if="isNavEnabled(props.item)")
                    v-list-tile-title {{ props.item.title }}
            v-card-text.pa-0
              v-list
                v-list-group(
                  v-for="group in navGroups"
                  v-if="isNavEnabled(group)"
                  :key="group.title"
                  :prepend-icon="group.icon"
                  :value="getActive(group)"
                )
                  v-list-tile(slot="activator")
                    v-list-tile-title.settings-nav-tile-title {{group.title}}
                  template(
                    v-for="nav in group.navs"
                    v-if="isNavEnabled(nav)"
                  )
                    v-list-tile(:to="nav.route")
                      v-list-tile-title.settings-nav-tile-title
                        span.ml-4 {{nav.title}}
                      v-list-tile-action
                        v-icon {{nav.icon}}
        v-flex(xs12 md9 fixed).pa-2
          router-view(fluid).mt-5
</template>

<script>
import _ from 'lodash';
import { permitRoles } from '../../utils/permissions';
import { NAV_GROUPS } from './constants';
import GenericSearch from '../commons/generic-search';

export const COMPONENT_NAME = 'mc-settings';

const BASE_ROLE_INITIAL_ROUTE_NAME_ASSOCIATIONS = [
  { baseRole: 'admin', routeName: 'settings-clinic-details' },
  { baseRole: 'lab_head', routeName: 'settings-laboratory-test-directory' },
];

export default {
  components: {
    GenericSearch,
  },
  data () {
    return {
      navGroups: NAV_GROUPS,
    };
  },
  computed: {
    isRootRoute () {
      return this.$route.name === 'settings';
    },
    searchableNavs () {
      return _(this.navGroups)
        .filter(this.isNavEnabled.bind(this))
        .flatMap(group => _(group.navs)
          .filter(this.isNavEnabled.bind(this))
          .map(nav => ({ ...nav, title: `${group.title} - ${nav.title}` }))
          .value())
        .value();
    },
    clinicType () {
      return _.get(this.$activeOrganization, 'type');
    },
    subscription () {
      return _.get(this.$activeOrganization, 'subscription');
    },
  },
  mounted () {
    if (this.isRootRoute) this.redirect();
  },
  beforeDestroy () {
    /* this is needed to reset the navGroups' active
     value. its value is acting weird, when opening
     a submodule then clicking the back button to
     go back to CMS then going back to the settings
     the previously opened submodule's parent menu
     list is still opened. */
    this.navGroups.forEach(group => {
      group.active = false;
    });
  },
  methods: {
    redirect () {
      for (const { baseRole, routeName } of BASE_ROLE_INITIAL_ROUTE_NAME_ASSOCIATIONS) {
        if (permitRoles(this.$activeMembership, [baseRole])) {
          return this.$router.replace({ ...this.$route, name: routeName });
        }
      }
    },
    getActive (group) {
      group.navs.forEach(nav => {
        if (nav.route.name === this.$router.currentRoute.name) {
          group.active = true;
          return group.active;
        }
      });
      return group.active;
    },
    routeSelect (nav) {
      if (!nav) return;
      this.$router.push({ name: nav.route.name });
    },
    isNavEnabled ({
      clinicTypes,
      ignoredClinicTypes,
      subscriptions,
      roles,
    }) {
      return this.checkClinicTypes(clinicTypes) &&
        this.checkIgnoredClinicTypes(ignoredClinicTypes) &&
        this.checkSubscriptions(subscriptions) &&
        this.checkRoles(roles);
    },
    /**
     * Returns true if active organization matches any of the required types.
     * @return {boolean}
     */
    checkClinicTypes (clinicTypes) {
      if (_.isEmpty(clinicTypes)) return true;
      return _.includes(clinicTypes, this.clinicType);
    },
    /**
     * Returns true if active organization does not match any of the ignored types.
     * @return {boolean}
     */
    checkIgnoredClinicTypes (ignoredClinicTypes) {
      if (_.isEmpty(ignoredClinicTypes)) return true;
      // we don't want any of ignoredClinicTypes
      return !_.includes(ignoredClinicTypes, this.clinicType);
    },
    /**
     * Returns true if active subscription has any of the required keys.
     * @return {boolean}
     */
    checkSubscriptions (subscriptions) {
      if (_.isEmpty(subscriptions)) return true;
      return _.some(subscriptions, s => _.get(this.subscription, s));
    },
    /**
     * Returns true if active membership has any of the required roles.
     * Superadmin bypasses this check; returns true immediately.
     * @return {boolean}
     */
    checkRoles (roles) {
      if (_.isEmpty(roles)) return true;
      return permitRoles(this.$activeMembership, roles);
    },
  },
};
</script>

<style scoped>
.settings-nav-tile-title {
  font-size: 13px;
}
</style>
