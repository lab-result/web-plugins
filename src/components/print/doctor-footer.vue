<template lang="pug">
  div
    v-footer(v-if="!isAncillary" app height="auto" color="transparent")
      v-card(
        class="flex"
        flat
        tile
        color="transparent"
      )
        v-card-text.pa-0
          v-layout(row)
            v-flex(xs12).text-xs-right
              img(height="80" :src="eSig")
          v-layout(row)
            v-flex(
              v-if="showNextVisit"
              xs5
              md4
            )
              table
                tr
                  td
                    small Next Visit:
                  td(width="150" style="border-bottom: 1px solid grey;")
            v-flex(
              :xs7="showNextVisit"
              :xs12="!showNextVisit"
            )
              table(width="100%")
                tr
                  //- ENT Physician
                  td(v-if="ent && ent.id!=doctor.id" colspan="2" align="left")
                    b
                      small {{ent | prettifyDoctorNameFirst}}
                  //- Doctor
                  td(colspan="2" align="right")
                    b
                      small {{doctor | prettifyDoctorNameFirst}}
                tr
                  //- ENT Physician
                  template(v-if="ent && ent.id!=doctor.id")
                    td(align="left")
                      v-layout(row)
                        v-flex(xs4)
                          small License No:
                        v-flex(xs6 style="border-bottom: 1px solid grey;")
                          small {{ent.doc_PRCLicenseNo || ''}}
                  //- Doctor
                  td(align="right")
                    small License No:
                  td(width="150" style="border-bottom: 1px solid grey;").text-xs-center.pl-1
                    small {{doctor.doc_PRCLicenseNo || ''}}
                tr
                  //- ENT Physician
                  template(v-if="ent && ent.id!=doctor.id")
                    td(align="left")
                      v-layout(row)
                        v-flex(xs4)
                          small PTR No:
                        v-flex(xs6 style="border-bottom: 1px solid grey;")
                  //- Doctor
                  td(align="right")
                    small PTR No:
                  td(width="150" style="border-bottom: 1px solid grey;").text-xs-center.pl-1
                    small {{doctor.doc_PTRNumber || ''}}
    v-card(
      class="flex"
      flat
      tile
      color="transparent"
      v-else
    )
      v-card-text.pa-0
        v-layout(row)
          v-flex(xs12).text-xs-right
            img(height="80" :src="eSig")
        v-layout(row)
          v-flex(
            v-if="showNextVisit"
            xs4
            md4
          )
            table
              tr
                td
                  small Next Visit:
                td(width="150" style="border-bottom: 1px solid grey;")
          v-flex(
            :xs7="showNextVisit"
            :xs12="!showNextVisit"
          )
            table(width="100%")
              tr
                //- ENT Physician
                td(v-if="ent && ent.id!=doctor.id" colspan="2" align="left")
                  b
                    small {{ent | prettifyDoctorNameFirst}}
                //- Doctor
                td(colspan="2" align="right")
                  b
                    small {{doctor | prettifyDoctorNameFirst}}
              tr
                //- ENT Physician
                template(v-if="ent && ent.id!=doctor.id")
                  td(align="left")
                    v-layout(row)
                      v-flex(xs4)
                        small License No:
                      v-flex(xs6 style="border-bottom: 1px solid grey;")
                        small {{ent.doc_PRCLicenseNo || ''}}
                //- Doctor
                td(align="right")
                  small License No:
                td(width="150" style="border-bottom: 1px solid grey;").text-xs-center.pl-1
                  small {{doctor.doc_PRCLicenseNo || ''}}
              tr
                //- ENT Physician
                template(v-if="ent && ent.id!=doctor.id")
                  td(align="left")
                    v-layout(row)
                      v-flex(xs4)
                        small PTR No:
                      v-flex(xs6 style="border-bottom: 1px solid grey;")
                //- Doctor
                td(align="right")
                  small PTR No:
                td(width="150" style="border-bottom: 1px solid grey;").text-xs-center.pl-1
                  small {{doctor.doc_PTRNumber || ''}}
</template>

<script>
import _ from 'lodash';

export default {
  props: {
    doctor: {
      type: Object,
      default: undefined,
    },
    ent: {
      type: Object,
      default: () => null,
    },
    showNextVisit: Boolean,
    isAncillary: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    eSig () {
      const base64 = _.get(this.doctor, 'doc_eSignatureDataURI');
      const eSig = base64 || _.get(this.doctor, 'doc_eSignatureURL');
      if (!eSig) {
        this.$emit('ready', true);
        return;
      }
      const eSigPic = new window.Image();
      eSigPic.src = eSig;
      eSigPic.onload = () => {
        this.$emit('ready', true);
      };
      if (_.isEmpty(eSig)) return null;
      return eSig;
    },
  },
};
</script>
