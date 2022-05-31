<template>
  <b-row class="editRow">
    <b-col :sm="label_width">
      <label>{{label}} <font v-if="this.mandatory" style="color:red;margin-left:2px">*</font></label>
    </b-col>
    <b-col :sm="value_width">
      <table style="padding-top:3px;padding-bottom:3px">
          <tr>
            <td>
              <b-form-datepicker size="md" v-model="localDate"  class="mb-2" placeholder=" ___ __, ____" @input="onChangeDate" :disabled="this.disabled" :date-format-options="{ year: 'numeric', month: 'short', day: '2-digit' }"/>
            </td>
            <td>
               <b-form-timepicker  size="md" v-model="localTime"  class="mb-2" placeholder="__:__" :hour12="false"  hourCycle="h23"  @input="onChangeTime" :disabled="this.disabled" />
            </td>
          </tr>
      </table>             
    </b-col>          
  </b-row>
</template>

<script>
  import moment from 'moment'
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
    data () {
      return {
        //localDate:this.value,
        //localTime:this.value
      }
    },
    async created () {
    },

    methods: {
      onChangeDate(textvalue){
  //      this.localDate = textvalue
    //    console.log(this.localDate + " " + this.localTime);
  //      this.$emit('update:value', this.localDate + " " + this.localTime);
      },
      onChangeTime(textvalue){
//        this.localTime = textvalue
      //  console.log(this.localDate + " " + this.localTime);
        //this.$emit('update:value', this.localDate + " " + this.localTime);
      }
    },
    computed: {
      localDate:{
        get: function () {
          //console.log("-" + this.value);
          //console.log("-" + moment(this.value).format("yyyy-MM-DD"));
          if(Boolean(this.value))
            return moment(this.value).format("yyyy-MM-DD");
          else
            return null;
        },
        set: function (newVal) {
          this.$emit('update:value', newVal + " " +  this.localTime);
        }
      },
      localTime:{
        get: function () {
          //console.log("+" + this.value);
          if(Boolean(this.value))
            return moment(this.value).format("HH:mm:ss");
          else
            return null;

        },
        set: function (newVal) {
          this.$emit('update:value',this.localDate + " " +  newVal);
        }
      }
    },
    
  }
</script>

<style>
 
</style>