<template lang="pug">
  v-dialog(v-model="model" width="500" scrollable)
    v-card
      v-card-title
        h2 Switch Clinic
      v-divider
      v-card-text(style="height: 400px;").pa-0
        v-list(two-line)
          v-tooltip(
            v-for="organization in sortedOrganizations"
            :key="organization.id"
            bottom
            :disabled="organization.id === $activeOrganization.id"
          )
            | Select {{ organization.name }}
            v-list-tile(
              slot="activator"
              :inactive="organization.id === $activeOrganization.id"
              :class="{ 'blue': organization.id === $activeOrganization.id, 'lighten-5': organization.id === $activeOrganization.id }"
              @click="onOrganizationSelect(organization)"
            )
              v-list-tile-avatar
                img(:src="picValue(organization)")
              v-list-tile-content
                v-list-tile-title {{organization.name}}
                v-list-tile-sub-title {{organization.description}}
              v-list-tile-action(v-if="organization.id === $activeOrganization.id")
                  v-icon(color="success") mdi-check
    yes-or-no(
      :dialog="yesNoDialog"
      @close="v => yesNoDialog = v"
    )
</template>

<script>
import YesOrNo from '../dialogs/yes-no';
import { syncProp } from '../../utils/vue';
import { initLogger } from '../../utils/logger';

const log = initLogger('SwitchFacility');

export default {
  components: {
    YesOrNo,
  },
  props: {
    dialog: Boolean,
  },
  data () {
    return {
      loading: false,
      yesNoDialog: false,
      currentUserMemberships: [],
    };
  },
  computed: {
    model: syncProp('dialog'),
    currentUserOrganizations () {
      return this.currentUserMemberships
        ?.map(membership => membership?.$populated?.organization);
    },
    sortedOrganizations () {
      return this.currentUserOrganizations?.sort((a, b) => {
        if (a.id === this.$activeOrganization?.id) return -1;
        if (b.id === this.$activeOrganization?.id) return 1;
        return 0;
      });
    },
  },
  mounted () {
    this.fetchCurrentUserMemberships();
  },
  methods: {
    picValue ({ picDataURI, picURL }) {
      if (picDataURI) return picDataURI;
      if (picURL) return picURL;
      return require('../../assets/images/facility-placeholder.png');
    },
    async fetchCurrentUserMemberships () {
      this.loading = true;
      try {
        const { items } = await this.$sdk.service('organization-members').find({
          uid: this.$currentUser?.uid,
          $select: ['id', 'uid', 'organization'],
          $limit: 100,
          $populate: {
            organization: {
              service: 'organizations',
              method: 'get',
              localKey: 'organization',
              $select: ['id', 'name', 'description', 'picURL', 'picDataURI'],
            },
          },
        });
        log('fetchCurrentUserMemberships#items: %O', items);
        this.currentUserMemberships = items;
      } catch (error) {
        log('fetchCurrentUserMemberships#error: %O', error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
      this.loading = false;
    },
    onOrganizationSelect (organization) {
      this.$emit('select', organization);
      this.model = false;
    },
  },
};
</script>
