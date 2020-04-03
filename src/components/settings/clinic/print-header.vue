<template lang="pug">
  div
    h1 Print Header
    p Set the default printing header for your {{$activeOrganization.name}}
    //- v-card.mt-3.pa-3
    v-layout(row wrap)
      v-flex(xs6 md4).pa-1
        v-card(hover)
          v-card-actions
            v-spacer
            v-scroll-y-transition
              v-tooltip(bottom v-if="selectedTemplate.template === 'default'")
                v-icon(slot="activator").success--text mdi-check
                | Active template
              div(v-else style="height: 24px;")
          v-card-text.pa-3.text-xs-center
            h3 Template 1
            p.grey--text Left aligned with clinic logo.
          v-divider
          v-card-actions
            v-btn(
              small
              flat
              color="primary"
              :disabled="loading"
              @click="previewTemplateId = 'default'; previewDialog = true"
            ) Preview
            v-spacer
            v-btn(
              small
              outline
              color="success"
              @click="selectTemplate('default')"
              :disabled="loading || selectedTemplate.template === 'default'"
            ) Activate
      v-flex(xs4 md4).pa-1
        v-card(hover)
          v-card-actions
            v-spacer
            v-scroll-y-transition
              v-tooltip(bottom v-if="selectedTemplate.template === 'template-2'")
                v-icon(slot="activator").success--text mdi-check
                | Active template
              div(v-else style="height: 24px;")
          v-card-text.pa-3.text-xs-center
            h3 Template 2
            p.grey--text Center aligned with clinic logo.
          v-divider
          v-card-actions
            v-btn(
              small
              flat
              color="primary"
              :disabled="loading"
              @click="previewTemplateId = 'template-2'; previewDialog = true"
            ) Preview
            v-spacer
            v-btn(
              small
              outline
              color="success"
              @click="selectTemplate('template-2')"
              :disabled="loading || selectedTemplate.template === 'template-2'"
            ) Activate
      v-flex(xs4 md4).pa-1
        v-card(hover)
          v-card-actions
            v-spacer
            v-scroll-y-transition
              v-tooltip(bottom v-if="selectedTemplate.template === 'custom'")
                v-icon(slot="activator").success--text mdi-check
                | Active template
              div(v-else style="height: 24px;")
          v-card-text.pa-3.text-xs-center
            h3 Upload Image
            p.grey--text 1000x100 custom image.
          v-divider
          v-card-actions
            v-btn(
              small
              flat
              color="primary"
              :disabled="loading"
              @click="previewTemplateId = 'custom'; previewDialog = true"
            ) Preview
            v-spacer
            v-btn(
              small
              outline
              color="success"
              @click="selectTemplate('custom')"
              :disabled="loading || selectedTemplate.template === 'custom'"
            ) Activate
            v-btn(
              small
              outline
              color="success"
              @click="selectImage"
              :disabled="loading"
              :loading="loading"
            ) Upload
            input(
              ref="fileInputActivator"
              type="file"
              @change="fileChange"
            ).hide

    v-dialog(v-model="previewDialog" width="700")
      v-card(height="300")
        v-card-text.pa-2
          template(v-if="previewTemplateId === 'default'")
            print-facility-header-default(
              :facility="$activeOrganization"
            )
          template(v-if="previewTemplateId === 'template-2'")
            print-facility-header-template2(
              :facility="$activeOrganization"
            )
          template(v-if="previewTemplateId === 'custom'")
            img(:src="selectedTemplate.picURL" width="100%")
            //- v-img(:src="selectedTemplate.picURL" :aspect-ratio="1000/100")
        v-divider
        v-card-text.pa-5.text-xs-center.grey--text
          p Your clinic information will show in the header.
            br
            | You can update them anytime in&nbsp;
            router-link(:to="{ name: 'settings-clinic-details' }") clinic info settings
            |.
    v-dialog(v-model="invalidImageDimenDialog" width="400")
      v-card
        v-toolbar(flat)
          h3 Invalid image size
        v-card-text
          p We want your print header to look great! To prevent it from looking stretched, please upload image that has
            code 1000x100
            | &nbsp;pixels dimension.
        v-card-actions
          v-spacer
          v-btn(color="primary" @click="invalidImageDimenDialog = false") Got it!
</template>

<script>
import _ from 'lodash';
import PrintFacilityHeaderDefault from '../../print/facility-header-default';
import PrintFacilityHeaderTemplate2 from '../../print/facility-header-template2';

export const COMPONENT_NAME = 'settings-clinic-printing-header';

export default {
  components: {
    PrintFacilityHeaderDefault,
    PrintFacilityHeaderTemplate2,
  },
  data () {
    return {
      loading: false,
      previewDialog: false,
      invalidImageDimenDialog: false,
      previewTemplateId: '',
      selectedTemplate: { template: 'default' },
    };
  },
  async created () {
    await this.init();
  },
  methods: {
    async init () {
      this.selectedTemplate = _.get(this.$activeOrganization, 'mf_printHeaderTemplate') || { template: 'default' };
    },
    selectImage () {
      this.$refs.fileInputActivator.click();
    },
    async selectTemplate (template) {
      try {
        this.loading = true;
        let payload = {
          mf_printHeaderTemplate: {
            template,
            picURL: this.selectedTemplate.picURL || '',
          },
        };

        if (_.isEmpty(payload.mf_printHeaderTemplate.picURL)) payload = _.omit(payload, ['mf_printHeaderTemplate.picURL']);

        const clinic = await this.$store.dispatch('organizations/updateOrganization', { data: payload });
        this.selectedTemplate = clinic.mf_printHeaderTemplate;
        this.$enqueueSnack({
          message: 'Template updated!',
          color: 'success',
        });
      } catch (e) {
        console.error(e);
        this.$enqueueSnack({
          message: 'There was an error. Please try again later.',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    async fileChange (file) {
      try {
        this.loading = true;
        if (!file.target.files[0].name.match(/.(jpg|jpeg|png|gif)$/i)) {
          window.alert('Invalid image file. Must be JPG, JPEG, PNG or GIF');
          file.target.value = null;
          return;
        }
        var reader = new window.FileReader();
        reader.readAsDataURL(file.target.files[0]);
        reader.onload = () => {
          const img = new Image();
          img.src = reader.result;
          img.onload = async () => {
            if (img.width !== 1000 && img.height !== 100) {
              this.invalidImageDimenDialog = true;
              return;
            }
            const uri = await this.$sdk.service('storage').uploadImage(reader.result, {
              service: 'organizations',
              // TODO: add path once supported by sdk
            });
            const data = { mf_printHeaderTemplate: { picURL: uri } };
            await this.$store.dispatch('organizations/updateOrganization', { data });
            this.$enqueueSnack({
              message: 'New custom printing header uploaded.',
              color: 'success',
            });
          };
        };
        reader.onerror = (error) => {
          console.log('Error: ', error);
        };
      } catch (e) {
        console.error(e);
        this.$enqueueSnack({
          message: 'There was an error. Please try again later.',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
  .clinic-pic {
    width: 90px;
    height: 90px;
    background-color: lightgrey;
  }

  .line-main {
    height: 20px;
    width: 300px;
    background-color: lightgrey;
  }

  .line-sub {
    height: 10px;
    width: 280px;
    background-color: lightgrey;
  }

  .hide {
    display: none;
  }
</style>
