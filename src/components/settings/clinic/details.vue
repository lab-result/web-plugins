<template lang="pug">
  div
    h1 {{model.name}}
    p {{model.description | morph-truncate(100)}}
    v-card
      v-layout(row justify-center).pt-3
        div.white
          img-pickropper(
            ref="piccropper"
            @done="uploadPic('picURL', $event)"
            force-crop
            :aspect-ratio="1"
            :size-limit-kb="1000"
          )
            template(slot="picker")
              img(
                height="150"
                width="150"
                :src="clinicPicValue"
                @click="!loading && $refs.piccropper.selectFile()"
              ).pic-url.elevation-1.pa-1
          v-progress-linear(indeterminate color="success" v-if="uploadingPic").ma-0.pa-0
      br
      v-form(v-model="valid" ref="formRef" lazy-validation)
        v-layout(row wrap).px-2
          v-flex(xs12 md6).pa-1
            v-select(
              v-if="!isEdit"
              v-model="clinicType"
              :items="clinicTypes"
              item-text="text"
              item-value="value"
              flat
              outline
              label="Clinic Type"
              :rules="genericFieldRules"
              readonly
              :disabled="loading"
            )
        v-layout(row wrap).px-2
          v-flex(xs12 md6).pa-1
            v-text-field(
              v-model="model.name"
              flat
              outline
              label="Clinic Name"
              :rules="genericFieldRules"
              :disabled="loading"
            )
          v-flex(xs12 md6).pa-1
            v-text-field(
              v-model="model.website"
              flat
              outline
              label="Website"
              :disabled="loading"
              hint="Must be a valid uri. E.g. https://labresult.org"
            )
          v-flex(xs12).pa-1
            v-textarea(
              v-model="model.description"
              outline
              label="Description"
              :disabled="loading"
            )
          v-flex(xs12 md6).pa-1
            v-text-field(
              v-model="model.email"
              flat
              outline
              label="Email"
              :rules="[...validEmailRules]"
              :disabled="loading"
            )
          v-flex(xs12 md6).pa-1
            v-text-field(
              v-model="model.phone"
              flat
              outline
              label="Phone"
              :disabled="loading"
            )
          v-flex(xs12 md6).pa-1
            v-text-field(
              v-model="model.externalId"
              flat
              outline
              label="External ID"
              :disabled="loading"
            )
        v-expansion-panel(v-model="panels" expand).elevation-0
          v-expansion-panel-content
            div(slot='header')
              h3.success--text Clinic Address
            div.px-2
              v-layout(row wrap)
                v-flex(xs6).pa-1
                  v-text-field(
                    v-model="model.address.street1"
                    :disabled="loading"
                    flat
                    outline
                    label="Address Line 1"
                  )
                  v-layout(row).mt-1.pt-1
                    v-flex(xs6).pr-1
                      v-text-field(
                        v-model="model.address.city"
                        :disabled="loading"
                        flat
                        outline
                        label="City/Municipality"
                      )
                    v-flex(xs6).pl-1
                      v-text-field(
                        v-model="model.address.province"
                        :disabled="loading"
                        flat
                        outline
                        label="Province"
                      )
                v-flex(xs12 md6).pa-1
                  v-text-field(
                    v-model="model.address.street2"
                    :disabled="loading"
                    flat
                    outline
                    label="Address Line 2"
                  ).mb-2
                  v-autocomplete(
                    v-model="model.address.country"
                    :disabled="loading"
                    :items="countries"
                    flat
                    outline
                    label="Country"
                  )
          v-expansion-panel-content
            div(slot='header')
              h3.success--text Clinic Schedules
            div.px-2.mb-5
              table(width="100%")
                thead
                  tr(align="center")
                    th.pa-1 Day
                    th.py-1.pl-4.pr-1 Opening
                    th.py-1.pl-4.pr-1 Closing
                    th(width="10%").pa-1 Action
                tbody
                  tr
                    td.pa-1
                      v-select(
                        v-model="scheduleModel.day"
                        :items="days"
                        label="Day"
                        item-text="dayName"
                        return-object
                        outline
                        :disabled="loading"
                        hide-details
                      ).small-font
                    td.pa-1
                      time-picker-menu(
                        v-model="scheduleModel.opening"
                        outline
                        :disabled="loading"
                        hide-details
                      )
                    td.pa-1
                      time-picker-menu(
                        v-model="scheduleModel.closing"
                        outline
                        :disabled="loading"
                        hide-details
                      )
                    td.pa-1
                      v-btn(
                        color="success"
                        large
                        flat
                        @click="addSched"
                      ).mb-2
                        v-icon mdi-plus
                  tr
                    td(colspan="4")
                      v-divider
                  //- template(v-for="(group, groupKey) in groupedSchedules")
                  tr(v-for="(sched, index) in groupedSchedules" :key="index").sched-row
                    td.pa-2 {{sched.day | pretty-day(days)}}
                    td.pa-2 {{sched.opening | morph-date('hh:mm A')}}
                    td.pa-2 {{sched.closing | morph-date('hh:mm A')}}
                    td(align="center")
                      v-btn(icon @click="removeSched(index)")
                        v-icon.error--text mdi-trash-can-outline
      v-divider
      v-card-actions
        v-spacer
        v-btn(
          color="success"
          @click="submit"
          large
          :disabled="loading"
          :loading="loading"
        ) {{isEdit ? 'Update' : 'Create new clinic'}}

    v-dialog(v-model="selectClinicTypeDialog" width="500" persistent)
      v-card
        v-toolbar(flat)
          h2 Select Clinic Type
          v-spacer
          v-btn(small outline @click="$router.go(-1)" color="error") Cancel
        v-card-text
          v-layout(row wrap)
            v-flex(xs12).pa-1
              v-card(hover @click="selectClinicType('personal-clinic')")
                v-card-text.text-xs-center
                  img(width="100%" src="../../../assets/images/emr-web-banner-first-panel-doctor-clinic-patients.png")
                  h3 Private Practice
</template>

<script>
import _ from 'lodash';
import { countries } from '../../../assets/fixtures/countries';
import ImgPickropper from '../../commons/img-pickropper';
import TimePickerMenu from '../../commons/time-picker-menu';
export const COMPONENT_NAME = 'mc-clinic-details';
export default {
  components: {
    ImgPickropper,
    TimePickerMenu,
  },
  filters: {
    prettyDay (str, days) {
      const day = days.find(day => day.day === str);
      return day.dayName;
    },
  },
  props: {
    clinic: {
      type: Object,
      default: undefined,
    },
    isEdit: Boolean,
  },
  data () {
    return {
      loading: false,
      uploadingPic: false,
      uploadingCover: false,
      selectClinicTypeDialog: false,
      clinicTypes: [
        {
          text: 'Private Practice',
          value: 'personal-clinic',
        },
      ],
      valid: false,
      nowAllowed: false,
      clinicType: null,
      coverPlaceholder: require('../../../assets/images/facility-cover-placeholder.png'),
      picPlaceholder: require('../../../assets/images/kiosk-data-security-person.png'),
      panels: [true, true],
      base64: null,
      picField: null,
      model: {
        website: '',
        address: {},
      },
      scheduleModel: {
        day: {
          order: 1,
          day: 'mon',
          dayName: 'Monday',
        },
        opening: Date.now(),
        closing: Date.now(),
      },
      schedulesModel: [],
      days: [
        {
          order: 1,
          day: 'mon',
          dayName: 'Monday',
        },
        {
          order: 2,
          day: 'tue',
          dayName: 'Tuesday',
        },
        {
          order: 3,
          day: 'wed',
          dayName: 'Wednesday',
        },
        {
          order: 4,
          day: 'thu',
          dayName: 'Thursday',
        },
        {
          order: 5,
          day: 'fri',
          dayName: 'Friday',
        },
        {
          order: 6,
          day: 'sat',
          dayName: 'Saturday',
        },
        {
          order: 7,
          day: 'sun',
          dayName: 'Sunday',
        },
      ],
      countries: countries,
      fields: [
        'name',
        'website',
        'description',
        'email',
        'phone',
        'externalId',
        'address',
        'mf_schedule',
        'picDataURI',
      ],
    };
  },
  computed: {
    groupedSchedules () {
      // FIXME: remove unexpected side effect
      return this.schedulesModel.sort((a, b) => a.order - b.order); // eslint-disable-line
    },
    // This means that the build is 'enterprise' and
    // the pic mode is base64. See .env.exmaple
    isPicTypeBase64 () {
      return process.env.VUE_APP_BUILD_MODE === 'enterprise' && process.env.VUE_APP_PIC_TYPE === 'base64';
    },
    clinicPicValue () {
      if (this.model.picDataURI) return this.model.picDataURI;
      return this.model.picURL;
    },
  },
  async created () {
    await this.init();
  },
  methods: {
    async init () {
      if (_.isEmpty(this.model.picURL)) { this.model.picURL = this.picPlaceholder; }
      if (_.isEmpty(this.model.coverURL)) { this.model.coverURL = this.coverPlaceholder; }

      if (this.isEdit) {
        this.model = _.cloneDeep(this.clinic) || {};

        if (_.isEmpty(this.model.address)) { this.model.address = {}; }

        this.schedulesModel = _.map(this.model.mf_schedule, (sched) => {
          const { order } = this.days.find(day => day.day === sched.day);
          return {
            order,
            ...sched,
          };
        });
      } else {
        this.selectClinicTypeDialog = true;
      }
    },
    async submit () {
      try {
        const valid = this.$refs.formRef.validate();
        if (!valid) {
          this.$enqueueSnack({
            message: 'Please fix all form requirements.',
            color: 'warning',
          });
          return;
        }

        this.loading = true;

        this.model.mf_schedule = this.schedulesModel.map(sched => ({ ..._.pick(sched, ['day', 'opening', 'closing']) }));

        const url = this.model.website;
        if (url) {
          if (url.substr(0, 7) !== 'http://' && url.substr(0, 8) !== 'https://') {
            this.model.website = `https://${url}`;
          }
        }

        const payload = _.pickBy(_.pick(this.model, this.fields), Boolean);

        // unset picURL value when
        // updating picDataURI
        if (this.isPicTypeBase64) {
          payload.picURL = undefined;
        } else {
          payload.picDataURI = undefined;
        }

        let successMessage = '';

        if (this.isEdit) {
          if (this.model.id === this.$activeOrganization.id) {
            await this.$store.dispatch('organizations/updateOrganization', { data: payload });
          } else {
            await this.$sdk.service('organizations').update(this.model.id, payload);
          }
          successMessage = `${this.model.name} successfully updated!`;
        } else {
          /**
          * NOTE: This feature is only applicable for
          * personal clinic.
          */
          if (typeof this.clinicType === 'string') { payload.type = this.clinicType; } else { payload.type = this.clinicType.value; }
          const newClinic = await this.$sdk.service('organizations').create(payload);
          // TODO: determine if personal-clinics
          // is bound to the enterprise rules when
          // uploading photos.
          if (this.base64) {
            // TODO: replace with sdk upload
            const uri = await this.$fbUploader({
              file: this.base64,
              service: 'organizations',
            });
            await this.$sdk.service('organizations').update(newClinic.id, { [this.picField]: uri });
            this.model[this.picField] = uri;
          }
          successMessage = `New clinic ${this.model.name} successfully created!`;
          await this.switchClinic(newClinic.id);
        }

        this.$enqueueSnack({
          message: successMessage,
          color: 'success',
        });
      } catch (e) {
        console.error(e);
        let errorMessage = 'There was an error. Please try again later.';
        let color = 'error';

        if (e.message === 'Member has insufficient privilege!') {
          errorMessage = 'Member has insufficient privilege!';
          color = 'warning';
        }

        this.$enqueueSnack({
          message: errorMessage,
          color,
        });
      } finally {
        this.loading = false;
      }
    },
    async uploadPic (field, base64) {
      try {
        this.loading = true;
        if (field === 'picURL') { this.uploadingPic = true; }
        if (field === 'coverURL') { this.uploadingCover = true; }

        // If true, do not upload photo
        if (this.isPicTypeBase64) {
          this.$set(this.model, 'picDataURI', base64);
          return;
        }

        if (this.isEdit) {
          this.$set(this.model, 'picURL', base64);
          this.$set(this.model, 'picDataURI', undefined);
          // TODO: replace with sdk upload
          this.model[field] = await this.$fbUploader({
            file: base64,
            service: 'organizations',
          });
          const payload = _.pick(this.model, ['picURL', 'picDataURI']);

          // Update the new photo to org
          // FIXME: unset not working
          if (this.model.id === this.$activeOrganization.id) {
            await this.$store.dispatch('organizations/updateOrganization', { data: payload });
          } else {
            await this.$sdk.service('organizations').update(this.model.id, payload);
          }
          // TODO:remove later
          // await this.$store.dispatch('organizations/uploadOrganizationPhoto', {
          //   id: this.model.id,
          //   base64: base64,
          //   field,
          //   save: true,
          // });

          this.$enqueueSnack({
            message: 'Clinic details updated!',
            color: 'success',
          });
        } else {
          this.picField = field;
          this.base64 = base64;
          this.$set(this.model, 'picURL', base64);
          this.$set(this.model, 'picDataURI', undefined);
        }
      } catch (e) {
        console.error(e);
        let errorMessage = 'There was an error. Please try again later.';
        let color = 'error';

        if (e.message === 'Member has insufficient privilege!') {
          errorMessage = 'Member has insufficient privilege!';
          color = 'warning';
        }

        this.$enqueueSnack({
          message: errorMessage,
          color,
        });
      } finally {
        this.loading = false;
        this.uploadingPic = false;
        this.uploadingCover = false;
      }
    },
    addSched () {
      if (this.scheduleModel.opening === this.scheduleModel.closing) {
        this.$enqueueSnack({
          color: 'warning',
          message: 'Cannot put the same time and date!',
        });
      } else {
        this.schedulesModel.push({
          order: this.scheduleModel.day.order,
          day: this.scheduleModel.day.day,
          ..._.omit(this.scheduleModel, ['day']),
        });
      }
    },
    removeSched (i) {
      this.schedulesModel.splice(i, 1);
    },
    uploadNewCover () {
      this.$refs.uploadCoverPhoto.click();
    },
    selectClinicType (type) {
      const value = type === 'personal-clinic' ? 'personal-clinic' : 'cms';
      this.clinicType = {
        text: type,
        value,
      };
      this.selectClinicTypeDialog = false;
    },
    async switchClinic (id) {
      await this.$store.dispatch('organizations/setActiveMembership', {
        organization: id,
      });
      // TODO: for removal
      this.$store.dispatch('inventory/clearStockRooms');
      this.$store.dispatch('table/resetState');
      this.$router.push({ name: 'landing' });
    },
  },
};
</script>

<style scoped>
  .avatar {
    border-style: solid;
    border-color: white;
    border-width: 5px;
    border-radius: 10px;
  }

  .cover-pic {
    height: 350px;
    background-size: cover;
    background-position: center center;
    background-image: url('../../../assets/images/facility-cover-placeholder.png');
  }

  .cover-pic:hover {
    cursor: pointer;
  }

  .sched-row:nth-child(odd) {
    background-color: #f5f5f5;
  }

  .sched-row:nth-child(even) {
    background-color: white;
  }

  .pic-url:hover {
    cursor: pointer;
  }

  .small-font {
    font-size: 12px !important;
  }
</style>
