<template>
  <b-row class="editRow">
    <b-col sm="3">
      <label>{{label}} <font v-if="this.mandatory" style="color:red;margin-left:2px">*</font></label>
    </b-col>
    <b-col sm="9">
      <b-form-select v-model="currentData.plan_name" :options="planSelectData" value-field="plan_name" text-field="plan_name"></b-form-select>
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
      inputNumber: {
        default: false,
        type: Boolean
      },
      mx: {
        default: "1000",
        type: String
      },
      disabled:{
        default: false,
        type: Boolean
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
    
    data () {
      return {
      }
    },
    async created () {
    },

    methods: {
      validateKeypress(evt){
        if(this.inputNumber){
          return this.isNumber(evt);
        }
      },
      isNumber: function(evt) {
        evt = (evt) ? evt : window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if ((charCode > 31 && (charCode < 48 || charCode > 57)) && charCode !== 46) {
          evt.preventDefault();;
        } else {
          return true;
        }
      }
    }
  }
</script>

<style>
 
</style>