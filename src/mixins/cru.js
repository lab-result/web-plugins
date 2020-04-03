import _ from 'lodash';

export default {
  computed: {
    $id () {
      return this.$route.params.id;
    },
    $cruMode () {
      // newer routes have explicit action in params
      const action = _.get(this.$route, 'params.action');
      if (action) return action;

      if (_.isEmpty(this.$id)) {
        return 'create';
      } else {
        return 'update';
      }
    },
    $isCreating () {
      return this.$cruMode === 'create';
    },
    $isEditing () {
      return this.$cruMode === 'update';
    },
    $isReadOnly () {
      return this.$cruMode === 'read';
    },
  },
};
