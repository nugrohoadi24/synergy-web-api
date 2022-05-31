<template>
  <b-row class="editRow">
    <b-col :sm="label_width">
      <label>{{label}} <font v-if="this.mandatory" style="color:red;margin-left:2px">*</font></label>
    </b-col>
    <!-- -->
    <b-col :sm="value_width">
      <b-form-input  :type="this.type" :disabled="this.disabled" v-model="lovalVal" 
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
        type: Number
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
          if(this.value || this.value == 0){
            let val1 = this.value.toString().replaceAll(".","");
            let val = parseFloat(val1).toFixed(0).toString();
            return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");    
          }
          return "";
        },

        set: function (newVal) {
          this.$emit('update:value', parseFloat(newVal.toString().replace(".","")));
        }
      }
    },
    
    data () {
      return {
        selection:0
      }
    },
    async created () {
    },

    methods: {
      addComma (num, per) {
        // (A1) CONVERT NUMBER TO STRING
        var cString = num.toString();

        // (A2) SPLIT WHOLE & DECIMAL NUMBERS
        var cWhole = "", cDec = "",
        cDot = cString.indexOf(".");
        if (cDot == -1) { cWhole = cString; }
        else {
          cWhole = cString.substring(0, cDot);
          cDec = cString.substring(cDot);
        }
      
        // (A3) ADD COMMAS TO WHOLE NUMBER
        var aComma = "", count = 0;
        if (cWhole.length > per) {
          for (let i=(cWhole.length-1); i>=0; i--) {
            aComma = cWhole.charAt(i) + aComma;
            count++;
            if (count == per && i!=0) {
              aComma = "," + aComma; 
              count = 0;
            }
          }
        }
      
        // (A4) RETURN "WHOLE WITH COMMA" PLUS DECIMAL PLACES
        return aComma + cDec;
      },

      validateKeypress(evt){
        const el = evt.target;
        this.selection = el.selectionStart;
        this.selection++;
        var value1 = evt.target.value + String.fromCharCode(evt.which || evt.keyCode) ;

        value1 = value1.replaceAll(".","");

        if(Number(value1)>=999999999999){
          evt.preventDefault();
          return;
        }
        

        setTimeout(() => {
          el.setSelectionRange(this.selection, this.selection);
        },300)
        return this.isNumber(evt);
      },

      isNumber: function(evt) {
        
        evt = (evt) ? evt : window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;        
        if ((charCode > 31 && (charCode < 48 || charCode > 57)) && charCode !== 46) {
          evt.preventDefault();
        } else {
          return true;
        }
      }
    }
  }
</script>

<style>
 
</style>