<template>
  <div style="width:100%;background-color:#fafafa;border: 1px solid darkgrey;padding-top:2px;padding-bottom:2px;padding-left:10px;padding-right:10px;margin-top:20px">
    <table cellpadding="0px" cellspacing="0px">
      <tr>
        <td style="width:100%;font-size:12px">Data Id</td>
        <td style="font-size:10px;text-align: right;white-space: nowrap;padding-left:15px;padding-top:3px;padding-bottom:3px;">
          {{localVal.created_info}}
        </td>
        <td style="font-size:12px;text-align: right;white-space: nowrap;padding-left:15px;padding-top:3px;padding-bottom:3px;">
          {{localVal.created_at}}
        </td>
      </tr>
      <tr>
        <td style="width:70%;font-size:12px;text-align:left">{{localVal._id}}</td>
        <td style="font-size:10px;text-align: right;white-space: nowrap;padding-left:15px;padding-top:3px;padding-bottom:3px;border-top:1px #d0d0d0 solid">
          {{localVal.updated_info}}
        </td>
        <td style="font-size:12px;text-align: right;white-space: nowrap; padding-left:15px;padding-top:3px;padding-bottom:3px;border-top:1px #d0d0d0 solid">
          {{localVal.updated_at}}
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
  import moment from 'moment';
  export default {
    props: {
      data: {
        type: Object
      }
    },
    data () {
      return {
      }
    },
    async created () {
    },

    computed: {
      localVal:{
        get: function () {
          
          if(Boolean(this.data)){
            var result = {
              _id: this.data._id
            };
              updated_info:""
            result.created_info = "";
            if(Boolean(this.data.created_by)){
              if(Boolean(this.data.created_by.name))              
                result.created_info += " Created By " + this.data.created_by.name + " (" + this.data.created_by._id + ")";
            }

            result.created_at = "";
            if(Boolean(this.data.created_at))              
              result.created_at += "   at " + moment(this.data.created_at).format("DD MMM yyyy HH:mm:ss");

            result.updated_info = "";
            if(Boolean(this.data.updated_by)){
              if(Boolean(this.data.updated_by.name))              
                result.updated_info += " Updated By " + this.data.updated_by.name + " (" + this.data.updated_by._id + ")"
            }

            result.updated_at = "";
            if(Boolean(this.data.updated_at))              
              result.updated_at += "   at " + moment(this.data.updated_at).format("DD MMM yyyy HH:mm:ss");

            return result;
          }else{
            return {
              _id:"",
              created_info:"",
              created_at:"",
              updated_info:"",
              updated_at:""
            };
          }
        }
      }
    },

    methods: {
    }
  }
</script>

<style>
 
</style>