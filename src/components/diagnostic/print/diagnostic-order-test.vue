<template lang="pug">
  .root
    v-btn(
      v-if="!isFinalized"
      flat
      @click="$router.go(-1)"
    ).mc-hide.mb-2
      v-icon mdi-chevron-left
      |  Back
    div(v-if="!isFinalized").mc-draft-watermark
      span DRAFT
    print-facility-header-default(
      v-if="printHeaderTemplate === 'default'"
      :facility="facility"
      @ready="$emit('ready')"
    )
    print-facility-header-template2(
      v-if="printHeaderTemplate === 'template-2'"
      :facility="facility"
      @ready="$emit('ready')"
    )
    img(
      v-if="printHeaderTemplate === 'custom'"
      :src="printHeaderPicURL"
      width="100%"
    )
    v-divider
    table.mc-header-table.mt-2.mb-3
      tbody
        tr
          td
            span Name: {{patientName | format-name}}
          td
            span(v-if="specimen")
              | {{specimenLabel}}: {{specimen}}
            span(v-else)
              | {{specimenLabel}}: N/A
        tr
          td
            span(v-if="patientDateOfBirth") Age: {{patientAge}} years old
            span(v-else) Age: N/A
          td
            span(v-if="order && order.requestingPhysician")
              | Requesting Physician: {{order.requestingPhysician}}
            span(v-else)
              | Requesting Physician: N/A
        tr
          td
            span Sex: {{patientSex | morph-capitalize}}
          td
            span(v-if="orderTags")
              | Exam Type: {{orderTags}}
            span(v-else)
              | Exam Type:
        tr
          td
            span(v-if="patientInsuranceCardNumbers") Member ID: {{patientInsuranceCardNumbers}}
            span(v-else) Member ID: N/A
          td
            span {{dateRequestedLabel}}: {{orderTest.createdAt | morph-date('MMM DD, YYYY hh:mm A')}}
        tr
          td
            span(v-if="patientCompanies") Company: {{patientCompanies}}
            span(v-else) Company: N/A
          td
            span {{dateReleasedLabel}}: {{releasedAt | morph-date('MMM DD, YYYY hh:mm A')}}
    slot
</template>

<script>
import _ from 'lodash';
import PrintFacilityHeaderDefault from '../../print/facility-header-default';
import PrintFacilityHeaderTemplate2 from '../../print/facility-header-template2';
import { compile, prettifyNameFirst, middleInitalInjector } from '../../../utils/string';
import { differenceInYears } from 'date-fns';

export default {
  filters: {
    formatName (name) {
      return prettifyNameFirst(middleInitalInjector(name, false));
    },
  },
  components: {
    PrintFacilityHeaderDefault,
    PrintFacilityHeaderTemplate2,
  },
  props: {
    order: {
      type: Object,
      default: undefined,
    },
    orderTest: {
      type: Object,
      required: true,
    },
    facility: {
      type: Object,
      required: true,
    },
  },
  computed: {
    printHeaderTemplate () {
      this.$log('computed#printHeaderTemplate#facility: %O', this.facility);
      return _.get(this.facility, 'mf_printHeaderTemplate.template') || 'default';
    },
    printHeaderPicURL () {
      return _.get(this.facility, 'mf_printHeaderTemplate.picURL');
    },
    patientName () {
      return _.get(this.orderTest, 'patient.name');
    },
    patientSex () {
      return _.get(this.orderTest, 'patient.sex');
    },
    patientDateOfBirth () {
      return _.get(this.orderTest, 'patient.dateOfBirth');
    },
    patientAge () {
      return differenceInYears(new Date(), new Date(this.patientDateOfBirth));
    },
    patientInsuranceCardNumbers () {
      const insuranceCards = _.get(this.orderTest, 'patient.insuranceCards');
      if (_.isEmpty(insuranceCards)) return;

      return _.map(insuranceCards, card => {
        const number = _.get(card, 'number');

        return number;
      }).join(',');
    },
    patientCompanies () {
      const companies = _.get(this.orderTest, 'patient.companies');
      if (_.isEmpty(companies)) return;

      const formatCompany = compile`${'name'} - ${'companyId'}`;
      const companyPartners = _.get(this.orderTest, 'patient.companyPartners');

      return _.map(companies, card => {
        const company = _.find(companyPartners, c => c.id === card.id || c.id === card.company);
        const name = _.get(company, 'name') ||
          _.get(company, 'insurerName') ||
          _.get(card, 'name');
        const companyId = _.get(card, 'companyId');

        return formatCompany({ name, companyId });
      }).join(', ');
    },
    activeOrganization () {
      return this.$activeOrganization;
    },
    type () {
      return _.get(this.orderTest, 'type');
    },
    specimenLabel () {
      return this.type === 'laboratory' ? 'Specimen No' : 'Control No';
    },
    specimen () {
      return _.get(this.orderTest, 'specimen');
    },
    languageConfig () {
      return _.get(this.activeOrganization, 'configFacility.languages');
    },
    dateRequestedLabel () {
      return _.get(this.languageConfig, 'diagnosticDateRequested') || 'Date Requested';
    },
    dateReleasedLabel () {
      return _.get(this.languageConfig, 'diagnosticDateReleased') || 'Date Released';
    },
    isFinalized () {
      return _.get(this.orderTest, 'finalizedAt');
    },
    releasedAt () {
      this.$log('computed#releaseDate#orderTest: %O', this.orderTest);
      return _.get(this.orderTest, 'finalizedAt');
    },
    orderTags () {
      const tags = _.get(this.orderTest, 'tags') || [];
      return _.uniq(tags).join(', ');
    },
    diagnosis () {
      const diagnosisCode = _.get(this.order, 'diagnosisCode');
      const diagnosisText = _.get(this.order, 'diagnosisText');
      return [diagnosisCode, diagnosisText]
        .filter(d => !_.isEmpty(d))
        .join(' - ');
    },
  },
  created () {
    this.$initLogger('print-diagnostic-order-test');
  },
  mounted () {
    if (this.printHeaderTemplate === 'custom') {
      const img = new window.Image();
      img.src = this.printHeaderPicURL;
      img.onload = () => {
        this.$emit('ready', true);
      };
    }
  },
};
</script>

<style scoped>
@media print {
  .root {
    font-size: 9pt;
  }

  .mc-hide {
    display: none;
  }
}

.mc-draft-watermark {
  transform: rotate(-45deg);
  font-size: 200px;
  color: grey;
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  opacity: 0.15;
}

.mc-draft-watermark > span {
  margin: auto;
}

.mc-header-table {
  table-layout: fixed;
  width: 100%;
  border-collapse: collapse;
}

.mc-header-table td {
  padding: 0px 10px;
  width: 1px;
  vertical-align: top;
  text-align: left;
}
</style>
