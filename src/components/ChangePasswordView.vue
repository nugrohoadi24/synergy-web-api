<template>
  <b-row class="vh-100 text-center" align-v="center" align-h="center">   
    <b-col>
    <b-row>
      <b-col>
        <center>
        <b-card title="CHANGE PASSWORD" sub-title="SILAHKAN MASUKAN PASSWORD LAMA ANDA DAN PASSWORD BARU" 
          style="padding:15px;width:600px;margin-top:-60px;"> 

            <MyInputText type="password" label="OLD PASSWORD" :value.sync="currentData.oldPassword" mx=20 style="margin-top:30px"/>  
            <MyInputText type="password" label="NEW PASSWORD" :value.sync="currentData.password" mx=20 style="margin-top:10px"/>  
            <MyInputText type="password" label="CONFIRM PASSWORD" :value.sync="currentData.confirmPassword" mx=20 style="margin-top:10px" />  

            <b-btn type="submit" @click="changePassword" variant="success" style="margin-top:40px">CHANGE PASSWORD</b-btn>
        </b-card>
        </center>
      </b-col>
    </b-row>
    </b-col>
  </b-row>
</template>



<script>
  import api from '@/apiClient/AuthApi'
  export default {
    data () {
      return {
        loading: false,
        currentData:{
          oldPassword : "",
          confirmPassword:"",
          password:""
        }
      }
    },
    
    async created () {
    },

    methods: {
      async changePassword (bvModalEvt) {
        bvModalEvt.preventDefault();
    
        var errmsg = "";

        if(!Boolean(this.currentData.oldPassword))
          errmsg += "* Silahkan input password lama anda \r\n";

        if(!Boolean(this.currentData.password))
          errmsg += "* Silahkan input password baru\r\n";

        if(Boolean(this.currentData.password) && Boolean(this.currentData.confirmPassword) &&  (this.currentData.password !== this.currentData.confirmPassword)) 
          errmsg += "* Password dan confirm password tidak sama \r\n";

        if(Boolean(errmsg)) {
          this.$emit('showMessage',errmsg, "info");                        
          return;
        }

        this.$emit('showLoading', true);
        var response = await this.$http('post', `/admin/change_pass`,this.currentData);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.currentData = {};
          this.$emit('showMessage',response.message, "info");                        
        }else {
          this.$emit('showMessage',response.message, "danger");                        
        }
      }
    }
  }
</script>
