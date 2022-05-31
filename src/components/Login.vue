<template>
  <b-row class="vh-100 text-center" align-v="center" align-h="center">   
    <div class="container-fluid mt-4 center"  style="position:absolute;opacity: .1">
      <center>
        <div>
        <img style="width:30%" src="@/assets/synergy_putih.png"/>
        </div>
        <img style="width:50%" src="@/assets/salvus_logo_big.png"/>
      </center>
    </div>

    <b-col>
    <b-row>
      <b-col>
        <center>
          <b-card 
            style="padding-right:30px;padding-left:30px;padding-bottom:30px;width:400px;margin-top:-60px;background-color: rgba(250, 250, 250, 0.9);"> 
              <div>
                <img style="width:80%" src="@/assets/synergy_putih.png"/>
              </div>
              <div>
              <label style="font-weight:bold;font-size:15px;margin-top:30px">LOGIN</label>
              </div>
              <div>
              <label>SILAHKAN MASUKKAN USERNAME DAN PASSWORD ANDA</label>
              </div>
              <div style="margin-top:30px">
                <label>USER NAME</label>
                <b-form-input type="text" v-model="model.username"></b-form-input>

                <label style="margin-top:20px">PASSWORD</label>
                <b-form-input type="password" rows="4" v-model="model.password"></b-form-input>
              </div>

              <div style="margin-top:30px">
                <b-btn type="submit" style="height:50px;width:140px" @click="doLogin" variant="success">LOGIN</b-btn>
              </div>
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
        model: {
          password:"",
          username:""
        }
      }
    },
    
    async created () {
    },

    methods: {
      async doLogin () {

        if (this.model.password.length > 0) {
          this.$emit('showLoading', true);
          var response = await this.$http('post', '/admin/auth',{
            "userid":this.model.username,
            "password":this.model.password
          });
          this.$emit('showLoading', false);

          if(response.is_ok){
            this.$auth.setToken(response.data.token);
            this.$auth.setAccess(response.data.access);
            if (this.$auth.getToken() != null){
                this.$emit('loggedIn')
                if(this.$route.params.nextUrl != null){
                    this.$router.push(this.$route.params.nextUrl)
                } else {
                  this.$router.push('Home')
                }
            }
          }else {
            this.$emit('showMessage',response.message, "danger");                        
          }
          console.log(response);

          //let is_admin = response.data.user.is_admin
          //localStorage.setItem('user',JSON.stringify(response.data.user))
          //localStorage.setItem('jwt',response.data.token)     
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