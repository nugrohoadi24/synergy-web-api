<template>
  <b-row class="vh-100 text-center" align-v="center" align-h="center">   

    <b-col>
    <b-row>
      <b-col>
        <center>
          <b-card 
            style="padding-right:30px;padding-left:30px;padding-bottom:30px;width:400px;margin-top:-60px;background-color: rgba(250, 250, 250, 0.9);"> 
              <div>
              <label>SILAHKAN MASUKKAN PASSWORD BARU ANDA</label>
              </div>
              <div style="margin-top:30px">
                <label>PASSWORD</label>
                <b-form-input type="password" rows="4" v-model="model.password"></b-form-input>

                <label style="margin-top:20px">KETIK ULANG PASSWORD</label>
                <b-form-input type="password" rows="4" v-model="model.password1"></b-form-input>
              </div>

              <div style="margin-top:30px">
                <b-btn type="submit" style="height:50px;width:140px" @click="doChangePass" variant="success">RUBAH</b-btn>
              </div>
          </b-card>
        </center>
      </b-col>
    </b-row>
    </b-col>
  </b-row>
</template>



<script>

  export default {
    data () {
      return {
        loading: false,
        model: {
          password:"",
          password1:""
        }
      }
    },
    
    async created () {
    },

    methods: {
      async doChangePass () {
        if(!Boolean(this.model.password) ||  !Boolean(this.model.password1)){
            this.$emit('showMessage',"Silahkan cek kembali inputan password anda", "danger");                        
            return;
        }

        if(this.model.password != this.model.password1){
            this.$emit('showMessage',"Silahkan cek kembali password anda, password dan ketik ulang tidak sama", "danger");                        
            return;
        }

        this.$emit('showLoading', true);

        var response = await this.$http('post', '/mb/confirm_reset_pass',{
          "token":this.$route.query.token,
          "password":this.model.password
        });    

        this.$emit('showLoading', false);

        if(response.is_ok){
          this.model.password = "";
          this.model.password1 = "";
          this.$emit('showMessage',response.message, "info");                        
        }else {
          this.$emit('showMessage',response.message, "danger");                        
        } 
      }
    }
  }
</script>

<style>
  .hero {
    height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  .hero .lead {
    font-weight: 200;
    font-size: 1.5rem;
  }
</style>