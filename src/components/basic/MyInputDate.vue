<template>
  <b-row class="editRow">
    <b-col sm="3">
      <label>{{label}} <font v-if="this.mandatory" style="color:red;margin-left:2px">*</font></label>
    </b-col>
    <b-col sm="9">
      <b-form-datepicker size="md" v-model="lovalVal" class="mb-2"  @input="onChange" :disabled="this.disabled"
          :date-format-options="{ year: 'numeric', month: 'short', day: '2-digit' }"/>
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
      disabled :{
        default: false,
        type: Boolean
      }

    },
    data () {
      return {
        localval:this.value
      }
    },
    async created () {
    },

    methods: {
      onChange(textvalue){
        this.localval = textvalue;
        this.$emit('update:value', this.localval);
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
    
  }
</script>

<style>
 
</style>