import rules from '../../utils/text-field-rules';
import { log, initLogger } from '../../utils/logger';
import _ from 'lodash';

export const mcGlobalMixinsPlugin = {
  install (Vue) {
    Vue.mixin({
      data () {
        return {
          ...rules,
          $log: log,
        };
      },
      methods: {
        $initLogger (namespace) {
          this.$log = initLogger(namespace);
        },
        $formatName (name, format) {
          const { firstName, middleName, lastName } = name;
          return format.replace(/firstName/gi, firstName)
            .replace(/middleName/gi, middleName || '')
            .replace(/middleInitial/gi, !_.isEmpty(middleName) ? `${middleName.substr(0, 1).toUpperCase()}.` : '')
            .replace(/lastName/gi, lastName);
        },
        $sort (direction, field, array) {
          if (direction === 'asc') { return array.sort((a, b) => a[field] - b[field]); }
          if (direction === 'desc') { return array.sort((a, b) => b[field] - a[field]); }
        },
        $forceUpdateRoute () {
          this.$router.push({ query: { ...this.$route.query, update: true } })
            // no-op catch: NavigationDuplicated errors are fine
            .catch(() => {});
          this.$router.push({ query: { ...this.$route.query, update: undefined } })
            // no-op catch: NavigationDuplicated errors are fine
            .catch(() => {});
        },
      },
    });
  },
};
