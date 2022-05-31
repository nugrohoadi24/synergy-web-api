<template>
  <b-row class="editRow">
    <b-col sm="3">
      <label>{{label}} <font v-if="this.mandatory" style="color:red;margin-left:2px">*</font></label>
    </b-col>
    <b-col sm="9">
      <b-form-textarea :disabled="this.disabled" rows="3" max-rows="6" v-model="lovalVal" 
      :formatter="upperFormatter" @keypress="onKeyPressKeepPosition($event)" :maxlength="this.mx"></b-form-textarea>
    </b-col>          
  </b-row>
</template>

<script>
  export default {
    props: {
      label: {
        type: String
      },
      value: {
        type: String
      },
      mandatory: {
        default: false,
        type: Boolean
      },
      mx: {
        default: "2000",
        type: String
      },
      disabled :{
        default: false,
        type: Boolean
      }
    },
    data () {
      return {
      }
    },
    computed: {
      lovalVal:{
        get: function () {
          return this.value;
        },
        set: function (newVal) {
          this.$emit('update:value', newVal);
        }
      }
    },
    async created () {
    },

    methods: {
     
    }
  }
</script>

<style>
 
</style>