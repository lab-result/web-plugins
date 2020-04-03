<template lang="pug">
  .root
    print-diagnostic-order-test(
      :order="order"
      :order-test="orderTest"
      :facility="facility"
      @ready="$onHeaderReady"
    )
      v-layout(column align-center)
        h2.blue--text {{section | morph-uppercase}}
        v-layout(column align-center v-if="!isTextSame").mt-1
          h3 {{testName}}

        v-layout(column).mc-full-width.mt-2
          div(v-html="resultHTML").mc-full-width

        v-layout(v-if="hasAttachments" row)
          v-flex(xs12).pa-1
            h3 Attachments
            v-layout(row)
              img(
                v-for="attachment in orderTest.attachmentURLs"
                :src="attachment"
                class="mc-attachment"
                height="100px"
                width="100px"
              )

        v-layout(row justify-space-around align-end).my-5.mc-sig.mc-full-width
          v-flex(v-if="orderTest.technician" grow)
            v-layout(column align-center)
              img(
                class="mc-signature"
                v-if="technicianESigValue"
                :src="technicianESigValue"
                width="200px"
                height="75px"
              )
              span {{prettifyProfessionalName(technicianName)}}
              span(v-if="orderTest.technician.PRCLicenseNo")
                | PRC License No. {{orderTest.technician.PRCLicenseNo}}
              span {{technicianLabel}}
          v-flex(v-if="orderTest.verifiedByDetails" grow)
            v-layout(column align-center)
              img(
                class="mc-signature"
                v-if="verifiedByDetailsESigValue"
                :src="verifiedByDetailsESigValue"
                width="200px"
                height="75px"
              )
              span {{prettifyProfessionalName(verifierName)}}
              span(v-if="verifierLicenseNo")
                | PRC License No. {{verifierLicenseNo}}
              span {{verifiedByText}}
          v-flex(v-if="orderTest.radiologist" grow)
            v-layout(column align-center)
              img(
                class="mc-signature"
                v-if="radiologistESigValue"
                :src="radiologistESigValue"
                width="200px"
                height="75px"
              )
              span {{prettifyProfessionalName(radiologistName)}}
              span(v-if="orderTest.radiologist.doc_PRCLicenseNo")
                | PRC License No. {{orderTest.radiologist.doc_PRCLicenseNo}}
              span Radiologist
          v-flex(v-if="orderTest.sonologist" grow)
            v-layout(column align-center)
              img(
                class="mc-signature"
                v-if="sonologistESigValue"
                :src="sonologistESigValue"
                width="200px"
                height="75px"
              )
              span {{prettifyProfessionalName(sonologistName)}}
              span(v-if="orderTest.sonologist.doc_PRCLicenseNo")
                | PRC License No. {{orderTest.sonologist.doc_PRCLicenseNo}}
              span Sonologist
          v-flex(v-if="orderTest.cardiologist" grow)
            v-layout(column align-center)
              img(
                class="mc-signature"
                v-if="cardiologistESigValue"
                :src="cardiologistESigValue"
                width="200px"
                height="75px"
              )
              span {{prettifyProfessionalName(cardiologistName)}}
              span(v-if="orderTest.cardiologist.doc_PRCLicenseNo")
                | PRC License No. {{orderTest.cardiologist.doc_PRCLicenseNo}}
              span Cardiologist
</template>

<script>
// components
import PrintDiagnosticOrderTest from '../print/diagnostic-order-test';
// mixins
import PrintReadyMixin from '../../../mixins/print-ready';
// utils
import _ from 'lodash';
import { differenceInYears } from 'date-fns';
import { compile, prettifyProfessionalName } from '../../../utils/string';

export default {
  components: {
    PrintDiagnosticOrderTest,
  },
  mixins: [PrintReadyMixin],
  data () {
    return {
      orderTest: {},
    };
  },
  computed: {
    cardiologistESigValue () {
      const base64 = this.orderTest?.cardiologist?.['doc_eSignatureDataURI'];
      if (base64) return base64;
      return this.orderTest?.cardiologist?.['doc_eSignatureURL'];
    },
    radiologistESigValue () {
      const base64 = this.orderTest?.radiologist?.['doc_eSignatureDataURI'];
      if (base64) return base64;
      return this.orderTest?.radiologist?.['doc_eSignatureURL'];
    },
    sonologistESigValue () {
      const base64 = this.orderTest?.sonologist?.['doc_eSignatureDataURI'];
      if (base64) return base64;
      return this.orderTest?.sonologist?.['doc_eSignatureURL'];
    },
    technicianESigValue () {
      const base64 = this.orderTest?.technician?.['doc_eSignatureDataURI'];
      if (base64) return base64;
      return this.orderTest?.technician?.['doc_eSignatureURL'];
    },
    verifiedByDetailsESigValue () {
      const base64 = this.orderTest?.verifiedByDetails?.['doc_eSignatureDataURI'];
      if (base64) return base64;
      return this.orderTest?.verifiedByDetails?.['doc_eSignatureURL'];
    },
    activeOrganization () {
      return this.$activeOrganization;
    },
    verifiedByText () {
      return this.activeOrganization?.configFacility?.languages?.diagnosticVerifiedBy ||
        'Verified by';
    },
    orderTestId () {
      return this.$route.params.id;
    },
    facility () {
      return this.orderTest?.facility || {};
    },
    patient () {
      return this.orderTest?.patient;
    },
    order () {
      return this.orderTest?.order;
    },
    testName () {
      return this.orderTest?.test?.name;
    },
    section () {
      return this.orderTest?.test?.section;
    },
    technicianLabel () {
      return this.orderTest?.test?.technicianLabel ||
        'Radiologic Technologist';
    },
    technicianName () {
      return this.orderTest?.technician?.name;
    },
    verifierName () {
      return this.orderTest?.verifiedByDetails?.name;
    },
    verifierLicenseNo () {
      const verifier = this.orderTest?.verifiedByDetails;
      return verifier?.['doc_PRCLicenseNo'] ||
        verifier?.PRCLicenseNo;
    },
    radiologistName () {
      return this.orderTest?.radiologist?.name;
    },
    sonologistName () {
      return this.orderTest?.sonologist?.name;
    },
    cardiologistName () {
      return this.orderTest?.cardiologist?.name;
    },
    resultHTML () {
      return this.orderTest?.results?.[0]?.value;
    },
    hasAttachments () {
      return !_.isEmpty(this.orderTest?.attachmentURLs);
    },
    isFinalized () {
      return this.orderTest?.finalizedAt;
    },
    isTextSame () {
      if (this.section || this.testName) { return this.section.toUpperCase() === this.testName.toUpperCase(); }
      return false;
    },
  },
  created () {
    this.$initLogger('print-ris-order-test');
    this.init();
  },
  methods: {
    async init () {
      this.orderTest = await this.$store.dispatch('diagnostic/getOrderTest', this.orderTestId);
      this.$log('init#orderTest: %O', this.orderTest);

      if (!this.isFinalized) return;

      // trigger printing
      this.$registerPicURLs(
        this.cardiologistESigValue,
        this.radiologistESigValue,
        this.sonologistESigValue,
        this.technicianESigValue,
        this.verifiedByDetailsESigValue,
        _.get(this.orderTest, 'attachmentURLs'),
      );
      await this.$waitUntilPrintReady();
      this.$nextTick(() => {
        setTimeout(() => {
          window.print();
          this.$router.go(-1);
        }, 3000);
      });
    },
    getSetHeader (index) {
      const prevSet = _.get(this.results, [index - 1, 'measure', 'set']);
      const set = _.get(this.results, [index, 'measure', 'set']);

      if (!_.isEmpty(set) && prevSet !== set) return set;
    },
    getReferenceRange (test, measure) {
      const isWithinSex = r => {
        if (_.isNil(r.sex)) return true;
        if (r.sex === 'all') return true;
        return r.sex === this.patient.sex;
      };

      const patientAge = differenceInYears(test.createdAt, this.patient.dateOfBirth);
      const isWithinAge = r => {
        if (!_.isNil(r.ageMin) && r.ageMin > patientAge) return false;
        if (!_.isNil(r.ageMax) && r.ageMax < patientAge) return false;
        return true;
      };

      const referenceRange = _.find(measure.referenceRanges,
        r => isWithinSex(r) && isWithinAge(r));
      return referenceRange || {};
    },
    getReferenceRangeText (test, measure) {
      const format = compile`${'min'}-${'max'}`;

      return format(this.getReferenceRange(test, measure));
    },
    getSiReferenceRangeText (test, measure) {
      const format = compile`${'simin'}-${'simax'}`;

      return format(this.getReferenceRange(test, measure));
    },
    prettifyProfessionalName,
  },
};
</script>

<style scoped>
@media print {
  .root {
    font-size: 9pt;
  }
}

.mc-full-width {
  width: 100%;
}

.mc-attachment {
  object-fit: cover;
}

.mc-sig {
  break-inside: avoid;
}

.mc-sig span {
  text-align: right;
}

.mc-signature {
  object-fit: contain;
}
</style>
