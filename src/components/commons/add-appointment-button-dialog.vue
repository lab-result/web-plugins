<template lang="pug">
  div
    h1 New Appointment
    br
    v-dialog(
      v-model="newDialog"
      width="700"
    )
      v-card
        v-toolbar(flat)
          v-toolbar-title
            h4 New Appointment
          v-spacer
          v-btn(icon @click="newDialog = false")
            v-icon mdi-close
        v-card-text.pa-3
          h4 Select Appointment Type
          br
          v-radio-group(
            v-model="newAppointment.type"
            color="primary"
            row
            @change="typeChanged"
          )
            v-radio(
              v-for="type in types"
              color="primary"
              :key="type"
              :label="type"
              :value="type"
            )
          br
          v-layout(row justify-center)
            v-flex(xs6).pr-2
              h4 *Start:
              date-picker-menu(
                v-model="newAppointment.from"
                datetime
              )
            v-flex(xs6).pl-2
              h4 *End:
              date-picker-menu(
                v-model="newAppointment.end"
                datetime
              )
          br
          h4 *Indicate reason for getting an appointment
            v-text-field(
              v-model="newAppointment.reason"
              box
            ).pt-4
          v-divider
        v-card-actions
          v-spacer
          v-btn(color="primary" @click="addAppointment") Save
          v-btn(@click="newDialog =false" flat color="error") Cancel
    v-btn(
      v-if="iconOnly"
      @click.stop="newDialog=true"
      :color="colorButton"
      :flat="flat"
      :fab="fab"
      :icon="icon"
    )
      v-icon(:color="colorIcon") {{ iconType }}
    v-btn(
      v-if="!iconOnly"
      @click.stop="newDialog=true"
      :color="colorButton"
      :outline="outline"
    ) {{ buttonText }}
</template>

<script>
// components
import DatePickerMenu from './date-picker-menu';
// constants
// utils

export default {
  components: {
    DatePickerMenu,
  },
  props: {
    buttonText: {
      type: String,
      default: 'NEW BUTTON',
    },
    colorButton: {
      type: String,
      default: 'info',
    },
    colorIcon: {
      type: String,
      default: 'info',
    },
    fab: Boolean,
    flat: Boolean,
    outline: Boolean,
    icon: Boolean,
    iconOnly: Boolean,
    iconType: {
      type: String,
      default: 'mdi-calendar-plus',
    },
  },
  data () {
    return {
      newAppointment: {
        type: null,
        from: null,
        end: null,
        reason: null,
      },
      newDialog: false,
      typeGroup: null,
      types: [
        'Visit', 'Follow Up', 'Procedure', 'Diagnostic', 'PME', 'Others',
      ],
    };
  },
  methods: {
    addAppointment () {
      //
    },
    typeChanged () {
      this.newAppointment.reason = this.newAppointment.type;
    },
  },
};
</script>

<style scoped>

</style>
