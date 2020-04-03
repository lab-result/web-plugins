<template lang="pug">
  div
    table(width="100%" style="border: 0px !important")
      tr(style="line-height: 14px")
        td(
          width="50%"
          :style="rowCellStyle"
        )
          small Name: {{pxName}}
        td(
          width="50%"
          :style="rowCellStyle"
        )
          small Date: {{createdAt | morph-date('MMM. DD, YYYY')}}
      tr(style="line-height: 14px")
        td(
          width="50%"
          :style="rowCellStyle"
        )
          small Age: {{calcExactAgeUtil(px.dateOfBirth)}}
        td(
          width="50%"
          :style="rowCellStyle"
        )
          small Sex: {{sex}}
      tr(style="line-height: 14px" v-if="showCompanies")
        td(
          :colspan="showAccountNo ? '1' : '2'"
          :style="rowCellStyle"
        )
          small Company: {{companyNames}}
        td(
          colspan="1"
          :style="rowCellStyle"
          v-if="showAccountNo"
        )
          small Account No: {{accountNumber}}
      tr(style="line-height: 14px")
        td(
          colspan="2"
          :style="rowCellStyle"
          v-if="showAddress"
        )
          small Address: {{px.address | prettify-address}}
        td(
          colspan="2"
          :style="rowCellStyle"
          v-if="doctor"
        )
          small Attending Physician: {{ doctor }}
    v-divider.mb-2.mt-2
</template>

<script>
import _ from 'lodash';
import { prettifyName, middleInitalInjector } from '../../utils/string';
import { calcExactAgeUtil } from '../../utils/date';

export default {
  props: {
    px: {
      type: Object,
      default: () => {
        return {};
      },
    },
    createdAt: {
      type: [Date, Number],
      default: undefined,
    },
    showAddress: {
      type: Boolean,
      default: true,
    },
    showAccountNo: {
      type: Boolean,
      default: false,
    },
    attendingPhysician: {
      type: Object,
      default: () => {
        return {};
      },
    },
  },
  // created () {
  //   this.init();
  // },
  data () {
    return {
      calcExactAgeUtil: calcExactAgeUtil,
      rowCellStyle: {
        border: '0px !important',
        padding: '0px 2px 0px 2px',
        height: '20px',
      },
    };
  },
  computed: {
    pxName () {
      if (_.isEmpty(this.px)) return '';
      return this.$formatName(this.px.name, 'firstName middleInitial lastName');
    },
    sex () {
      const sex = _.get(this.px, 'sex');
      if (!sex) return '-';
      return sex.substring(0, 1).toUpperCase();
    },
    showCompanies () {
      return !_.isEmpty(this.px.companies) || !_.isEmpty(this.px.companyPartners);
    },
    companyNames () {
      if (_.isEmpty(this.px.companies) && _.isEmpty(this.px.companyPartners)) {
        return 'None provided';
      }

      const companies = _.uniq([
        ..._.map(this.px.companyPartners, 'name'),
        ..._.map(this.px.companies, 'name'),
      ]);

      return companies.filter(Boolean).join(', ');
    },
    accountNumber () {
      if (_.isEmpty(this.px)) return '';

      const insuranceCards = this.px.insuranceCards || [];

      if (_.isEmpty(insuranceCards)) return '';

      const accountNumbers = [];
      _.each(insuranceCards, insurance => {
        accountNumbers.push(insurance.number);
      });
      return accountNumbers.join(', ');
    },
    doctor () {
      if (_.isEmpty(this.attendingPhysician)) return '';

      return prettifyName(middleInitalInjector(this.attendingPhysician));
    },
  },
  // methods: {
  //   async init () {
  //     const query = {
  //       facility: this.$activeOrganization ? this.$activeOrganization.id : '',
  //       id: this.patient
  //     };
  //     this.px = await this.$store.dispatch('patients/getPatient', query);
  //     this.$emit('ready', true);
  //   }
  // }
};
</script>

<style scoped>
  table {
    border-collapse: collapse;
  }

  table, th, td {
    border: 1px solid lightgrey;
  }
</style>
