<template>
  <b-row class="editRow">

    <b-col :sm="label_width">
      <label>{{label}} <font v-if="this.mandatory" style="color:red;margin-left:2px">*</font></label>
    </b-col>

    <b-col :sm="value_width">
      <b-form-input  :type="this.type" :disabled="this.disabled" v-model="lovalVal" :formatter="upperFormatter" 
      :maxlength="this.mx" @keypress="validateKeypress($event)"></b-form-input>
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
      },
      type:{
        default: "text",
        type: String
      },
      label_width:{
        default: "3",
        type: String
      },
      value_width:{
        default: "9",
        type: String
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
        const el = evt.target;
        var sel = el.selectionStart;
        sel++;

        setTimeout(() => {
          el.setSelectionRange(sel, sel);
        })       
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