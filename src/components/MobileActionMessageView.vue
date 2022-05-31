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
          <b-card style="width:400px;background-color: rgba(250, 250, 250, 0.9);padding:40px;font-size:20px"> 
              <div v-if="type==1">
                <label>Selamat, akun Anda berhasil diaktivasi. Sekarang Anda dapa menggunakan email dan sandi Anda untuk Masuk (Login) di aplikasi Salute.</label>
              </div>
              <div v-if="type==2">
                <label>Invalid Token</label>
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
        type: 0
      }
    },
    
    async created () {
       this.type = this.$route.query.t;
    },

    methods: {
      
    }
  }
</script>

<style>
</style>