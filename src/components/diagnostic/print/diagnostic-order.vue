<template lang="pug">
  .root
    print-facility-header-default(
      v-if="printHeaderTemplate === 'default'"
      :facility="order.facility"
      @ready="$emit('ready')"
    )
    print-facility-header-template2(
      v-if="printHeaderTemplate === 'template-2'"
      :facility="order.facility"
      @ready="$emit('ready')"
    )
    img(
      v-if="printHeaderTemplate === 'custom'"
      :src="printHeaderPicURL"
      width="100%"
    )
    v-divider.my-3
    table.mc-header-table.mb-5
      tbody
        tr
          td
            span Name: {{order.patient.name | prettifyNameFirst}}
          td
        tr
          td
            span(v-if="patientDateOfBirth") Age: {{patientAge}} years old
            span(v-else) Age: N/A
          td
            span(v-if="order.requestingPhysician")
              | Requesting Physician: {{order.requestingPhysician}}
            span(v-else)
              | Requesting Physician: N/A
        tr
          td
            span Sex: {{order.patient.sex | morph-capitalize}}
          td
            span(v-if="order.reason")
              | Diagnosis/Reason: {{order.reason}}
            span(v-else)
              | Diagnosis/Reason: N/A
        tr
          td
            span(v-if="patientInsuranceCards") HMO: {{patientInsuranceCards}}
            span(v-else) HMO: N/A
          td
            span {{dateRequestedLabel}}: {{order.createdAt | morph-date('MMM DD, YYYY hh:mm A')}}
        tr
          td
            span(v-if="patientCompanies") Company: {{patientCompanies}}
            span(v-else) Company: N/A
          td
            span {{dateReleasedLabel}}: {{releasedAt | morph-date('MMM DD, YYYY hh:mm A')}}

    slot
</template>

<script>
// components
import PrintFacilityHeaderDefault from '../../print/facility-header-default';
import PrintFacilityHeaderTemplate2 from '../../print/facility-header-template2';
// utils
import _ from 'lodash';
import { differenceInYears } from 'date-fns';
import { compile } from '../../../utils/string';
import { initLogger } from '../../../utils/logger';

const log = initLogger('DiagnosticOrder');

export default {
  components: {
    PrintFacilityHeaderDefault,
    PrintFacilityHeaderTemplate2,
  },
  props: {
    order: {
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
      log('computed#printHeaderTemplate#facility: %O', this.facility);
      return this.facility?.['mf_printHeaderTemplate']?.template || 'default';
    },
    printHeaderPicURL () {
      return this.facility?.['mf_printHeaderTemplate']?.picURL;
    },
    patientDateOfBirth () {
      return this.order?.patient?.dateOfBirth;
    },
    patientAge () {
      return differenceInYears(new Date(), new Date(this.patientDateOfBirth));
    },
    patientInsuranceCards () {
      const insuranceCards = this.order?.patient?.insuranceCards;
      if (_.isEmpty(insuranceCards)) return;

      const formatHmo = compile`${'name'} - ${'number'}`;
      const hmos = this.order?.patient?.hmos;

      return insuranceCards
        ?.map(card => {
          const hmo = hmos?.find(h => h.id === card.insurance);
          const name = hmo?.name;
          const number = card?.number;

          return formatHmo({ name, number });
        })
        ?.join(',');
    },
    patientCompanies () {
      const companies = this.order?.patient?.companies;
      if (_.isEmpty(companies)) return;

      const formatCompany = compile`${'name'} - ${'companyId'}`;
      const companyPartners = this.order?.patient?.companyPartners;

      return companies
        ?.map(card => {
          const company = companyPartners?.find(c => c.id === card.id || c.id === card.company);
          const name = company?.name ||
            company?.insurerName ||
            card?.name;
          const companyId = card?.companyId;

          return formatCompany({ name, companyId });
        })
        ?.join(',');
    },
    activeOrganization () {
      return this.$activeOrganization;
    },
    languageConfig () {
      return this.activeOrganization?.configFacility?.languages;
    },
    dateRequestedLabel () {
      return this.languageConfig?.diagnosticDateRequested || 'Date Requested';
    },
    dateReleasedLabel () {
      return this.languageConfig?.diagnosticDateReleased || 'Date Released';
    },
    releasedAt () {
      log('computed#releaseDate#order: %O', this.order);
      return this.order.tests
        ?.map(t => _.get(t, 'finalizedAt'))
        ?.filter(Boolean)
        ?.sort((a, b) => a - b)
        ?.[0];
    },
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
  methods: {
    goBack () {
      this.$router.go(-1);
    },
    async print () {
      window.print();
    },
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

  .mc-header-table {
    table-layout: fixed;
    width: 100%;
    border-collapse: collapse;
  }

  .mc-header-table td {
    border: 1px solid gray;
    padding: 5px;
  }
</style>
