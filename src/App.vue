<template>
  <div id="app" style="height:100%; ">
    <b-navbar style="height:60px;background-color:#170f4f !important ;font-size:12px !important"
      toggleable="lg" type="dark" variant="success" v-if=this.showNavBar()>

      <b-navbar-brand href="#" to="/home">
        <img style="width:130px;height:50px" src="@/assets/synergy_transparant.png"/>
      </b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
       <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item-dropdown text="MASTER SETTING" style="menudropdown" 
            v-if="this.isMenuGroupVisible(['MADMIN','MHOSPITAL','MPROVINCE','MCITY','MDISTRICT','MVILLAGE'])">
            <b-dropdown-item href="#" v-if="this.isMenuVisible('MROLE')" to="/role">ROLE</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('MADMIN')" to="/master_admin">USER MANAGEMENT</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('MHOSPITAL')" to="/hospital">SERVICE PROVIDER</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('MIMPORTPROVIDER')" to="/import_provider">IMPORT PROVIDER</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('MPROVINCE')" to="/province">PROVINCE</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('MCITY')" to="/city">CITY</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('MDISTRICT')" to="/district">DISTRICT</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('MVILLAGE')" to="/subdistrict">VILLAGE</b-dropdown-item>
          </b-nav-item-dropdown>

          <b-nav-item-dropdown text="MEMBERSHIP" class="menudropdown"
            v-if="this.isMenuGroupVisible(['MCOMPANY','MUSER','MUSERUPLOAD'])">

            <b-dropdown-item href="#" v-if="this.isMenuVisible('MCOMPANY')" to="/company">CORPORATE CLIENT</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('MUSER')" to="/master_user">INDIVIDUAL MEMBER</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('MUSERUPLOAD')" to="/import_user">MEMBER UPLOAD</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('MUSER')" to="/dashboard-hr">DASHBOARD HR</b-dropdown-item>

          </b-nav-item-dropdown>

          <b-nav-item-dropdown text="PROGRAM" class="menudropdown"
            v-if="this.isMenuGroupVisible(['MINSPRODUCT','MCOMPPOLICY','MPARTICIPANT','MPARTICIPANTUPLOAD','MDEPOSIT'])">

            <b-dropdown-item href="#" v-if="this.isMenuVisible('MINSPRODUCT')" to="/insurance_product" >PRODUCT SETUP</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('MCOMPPOLICY')" to="/company_policy">COMPANY COVERAGE</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('MPARTICIPANT')" to="/user_policy">PARTICIPANT REGISTRATION</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('MPARTICIPANTUPLOAD')" to="/import_user_policy">PARTICIPANT UPLOAD</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('MDEPOSIT')" to="/deposit">DEPOSIT</b-dropdown-item>
          </b-nav-item-dropdown>

          <b-nav-item-dropdown text="TRANSACTION" class="menudropdown"
            v-if="this.isMenuGroupVisible(['CLAIM'])">

            <b-dropdown-item href="#" v-if="this.isMenuVisible('CLAIM')" to="/claim?type=insurance" @click="reloadPage">INSURANCE CLAIM</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('CLAIM')" to="/claim?type=salvus_care" @click="reloadPage">SALVUSCARE CLAIM</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('CLAIM')" to="/claim?type=" @click="reloadPage">ALL CLAIMS</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('CLAIM')" to="/claim_pending" @click="reloadPage">PENDING CLAIMS</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('CASEMONITORING')" >CASE MONITORING</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('BILLINGPAYMENT')" >BILLING &#38; PAYMENT</b-dropdown-item>
          </b-nav-item-dropdown>

          <b-nav-item-dropdown text="CRM" class="menudropdown"
            v-if="this.isMenuGroupVisible([''])">
            <b-dropdown-item href="#" v-if="this.isMenuVisible('INBOUND')" to="/inbound">INBOUND</b-dropdown-item>
          </b-nav-item-dropdown>

          <b-nav-item-dropdown text="SHOP" class="menudropdown" 
            v-if="this.isMenuGroupVisible(['VOUCHER','IMPORTVOUCHERWALLET','IMPORTVOUCHERWALLETAPPROVE','ORDERTRANSACTION'])">
            <b-dropdown-item href="#" v-if="this.isMenuVisible('VOUCHER')" to="/voucher">VOUCHER</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('IMPORTVOUCHERWALLET')" to="/import_voucher">VOUCHER WALLET IMPORT</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('IMPORTVOUCHERWALLETAPPROVE')" to="/approve_import_voucher">APPROVE VOUCHER WALLET IMPORT</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('')">ITEMS</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('')">IMPORT ITEMS</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('')">SHOP</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('ORDERTRANSACTION')" to="/store_transaction">TRANSACTION</b-dropdown-item>
          </b-nav-item-dropdown>


          <b-nav-item-dropdown text="ANNOUNCEMENT" class="menudropdown"
            v-if="this.isMenuGroupVisible(['ANNOUNCEMENT'])">

            <b-dropdown-item href="#" v-if="this.isMenuVisible('ANNOUNCEMENT')" to="/announcement">CREATE</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('ANNOUNCEMENT')" to="/announcement">ANNOUNCEMENT</b-dropdown-item>
          </b-nav-item-dropdown>

          <b-nav-item-dropdown text="REPORT" class="menudropdown"
            v-if="this.isMenuGroupVisible(['RCLAIMRATIO','RCLAIMDETAIL','RTOPTEN'])">
            <b-dropdown-item href="#" v-if="this.isMenuVisible('RCLAIMRATIO')" to="/report/claim_ratio">CLAIM FUND</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('RCLAIMDETAIL')" to="/report/claim_detail">CLAIM DETAIL</b-dropdown-item>
            <b-dropdown-item href="#" v-if="this.isMenuVisible('RTOPTEN')" to="/report/topten">TOP TEN</b-dropdown-item>
            
          </b-nav-item-dropdown>

        </b-navbar-nav>
      </b-collapse>

      <b-navbar-nav class="sm-auto">
        <b-nav-item-dropdown :text=this.getUserName() right>
          <!-- Using 'button-content' slot -->
          <b-dropdown-item href="#" to="/change_password">RUBAH PASSWORD</b-dropdown-item>
          <b-dropdown-item href="#" @click="doLogout">SIGN OUT</b-dropdown-item>
        </b-nav-item-dropdown>
      </b-navbar-nav>
    </b-navbar>

    <div id="appDiv1" style="height:84%-60px">      
      <b-alert
        style="margin:10px"
        :show="alertDismissCountDown"
        dismissible
        :variant="this.alertType"
        @dismissed="alertDismissCountDown=0"
        @dismiss-count-down="alertCountDownChanged">
          {{ this.alertMessage }}
        <b-progress
          variant="warning"
          :max="5"
          :value="alertDismissCountDown"
          height="3px"
          style="margin-top:4px"
        ></b-progress>
      </b-alert>
      <!-- routes will be rendered here -->
      <b-overlay :show="this.loading" rounded="sm" style="height:100%">
        <router-view style="height:100%" v-on:showLoading="showLoading" v-on:showMessage="showMessage" v-on:showAlert="showAlert" />
      </b-overlay>

      <b-modal hide-header size="md" scrollable  lazy  centered ref="showMessageDlg" ok-only>
          <div style="white-space: pre-wrap">
{{this.messageContent}}
          </div>
      </b-modal>  
    </div>
  </div>
</template>

<script>
  export default {
    name: 'app',
    data () {
      return {
        username:"User",
        loading:false,
        alertDismissCountDown: 0,
        alertMessage: "",
        alertType :"info",
        messageContent:""
      }
    },
    async created () {
    },
    watch: {
      // everytime a route is changed refresh the activeUser
      '$route': 'refreshActiveUser'
    },
    methods: {
      getUserName() {
        if(this.$auth.getTokenData() != null){
          return this.$auth.getTokenData().name;
        }else{
          return "User";
        }
      },

      isMenuVisible(menu) {
        var acc = this.$auth.getAccess(menu);
        if(acc > 0 )
          return true;
        else
          return false;
      },

      isMenuGroupVisible(menus) {
        for(var tmp in menus){
          var acc = this.$auth.getAccess(menus[tmp]);
          if(acc > 0 )
            return true;
        }
        return false;
     },

      isAuthenticated () {
        if(this.$auth.getToken() == null)
          return false;
        else
          return true;
      },

      showNavBar () {
        if(this.$route.name == "Login" || this.$route.name == 'ResetPassUser' || this.$route.name == 'msg'){
          return false;
        }else {
          return this.isAuthenticated();
        }
      },

      doLogout(){
        this.$auth.removeToken();
        this.$router.push('login')
      },

      alertCountDownChanged(alertDismissCountDown) {
          this.alertDismissCountDown = alertDismissCountDown
      },
      showLoading (show){
        this.loading = show;
      },
      showAlert(message,type){
//        this.alertMessage = message;
//        this.alertType = type;
//        this.alertDismissCountDown = 5
        this.messageContent = message;
        this.$refs['showMessageDlg'].show();
      },
      showMessage(message){
        this.messageContent = message;
        this.$refs['showMessageDlg'].show();
      },

      reloadPage(){
        window.location.reload();
      }
    }
  }
</script>


<style>
  * {
      font-family: Calibri light,Arial, Helvetica, sans-serif;
  }

  html, body {
      height: 100%;
      color:#505050;
      font-size: 1em;
  }

  .menudropdown {
    margin-left:5px; 
    margin-right:5px;
  }

  .importActionBar {
    margin-right:5px;
    margin-left:5px;
    padding-bottom:10px;
    padding-top:10px;
    background:#F7FFCE
  }
  .inputLabel {
    margin-right:10px;
    margin-bottom:0px
  }

  .idStyle {
    font-size:10px;
    color: #505050;
  }

  .idStyleLabel {
    font-size:10px;
    color: #505050;
    margin-right:5px;
  }

  .navbar-dark .navbar-nav .nav-link {
    font-size:1.1em;
    letter-spacing:1px;
    color:#f0f0f0e0;
  }
  .btn{
    font-size:1em;
    font-weight: bold;
    letter-spacing: 1px;
    font-family: Calibri,Arial, Helvetica, sans-serif;

  }
</style>