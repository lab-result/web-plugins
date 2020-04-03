<template lang="pug">
  div
    print-record-clinic-header(
      :doctor="doctor"
      :doctorHeader="doctorHeader"
      @ready="headerReady = $event"
    )
    print-patient-header(
      v-if="px"
      :px="px"
      :createdAt="record.createdAt"
    )
    lab-order-print-preview(
      :record="record"
      is-print-page
    )
    doctor-footer(
      v-if="doctor"
      :doctor="doctor"
      @ready="footerReady = $event"
    )
</template>

<script>
// components
import DoctorFooter from '../print/doctor-footer';
import PrintPatientHeader from '../print/patient-header';
import PrintRecordClinicHeader from '../print/record-clinic-header';
import LabOrderPrintPreview from '../medical-records/lab-order/print-preview';
// constants
// utils
import _ from 'lodash';
import { initLogger } from '../../utils/logger';
import { getPatient } from '../../services/patients';
import { getPrescriptionHeader } from '../../services/medical-records';

const log = initLogger('PrintLabTestOrder');

export default {
  components: {
    LabOrderPrintPreview,
    PrintRecordClinicHeader,
    PrintPatientHeader,
    DoctorFooter,
  },
  props: {
    record: {
      type: Object,
      default: undefined,
    },
    patient: {
      type: String,
      default: undefined,
    },
    fromRoute: {
      type: String,
      default: undefined,
    },
    fromParams: {
      type: Object,
      default: undefined,
    },
    fromQueries: {
      type: Object,
      default: undefined,
    },
  },
  data () {
    return {
      doctor: null,
      px: null,
      doctorHeader: null,
      headerReady: false,
      footerReady: false,
    };
  },
  computed: {
    printReady () {
      return this.headerReady && this.footerReady && this.px;
    },
  },
  watch: {
    headerReady (val, oldVal) {
      if (val && !oldVal) { this.print(); }
    },
    footerReady (val, oldVal) {
      if (val && !oldVal) { this.print(); }
    },
    doctor (val, oldVal) {
      if (val && !oldVal) { this.print(); }
    },
    px (val, oldVal) {
      if (val && !oldVal) { this.print(); }
    },
  },
  async mounted () {
    this.init();
  },
  methods: {
    async init () {
      await this.loadDoctor();
      this.px = await this.loadPx();
    },
    print () {
      if (this.printReady) {
        setTimeout(() => {
          window.print();
          this.$router.push({
            name: this.fromRoute,
            params: this.fromParams,
            query: this.fromQueries,
          });
        }, 500);
      }
    },
    async loadDoctor () {
      try {
        if (_.isEmpty(this.record.createdBy)) {
          this.doctor = null;
          this.footerReady = true;
        } else {
          this.doctor = await this.$store.dispatch('accounts/getPersonalDetails', {
            uid: this.record.createdBy,
            // fields: [], // declare needed fields here
          });
        }
        this.doctorHeader = await getPrescriptionHeader(this.$sdk, {
          facility: this.$activeOrganization.id,
          uid: this.record.createdBy,
        });
      } catch (error) {
        console.error(error);
        log('loadDoctor#error');
      }
    },
    async loadPx () {
      try {
        const query = { id: this.patient };
        return getPatient(this.$sdk, query);
      } catch (error) {
        console.error(error);
        log('loadPx#error');
      }
    },
  },
};
</script>
