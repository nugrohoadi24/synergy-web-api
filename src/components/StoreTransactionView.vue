<template>
  <b-container fluid>     
    <DataTable ref="dataTable" v-bind:title="title"  
                v-bind:tableData="tableData"  
                v-bind:fields="fields" 
                v-on:loadItems="loadItems" 
                v-on:onCreateNew="onCreate" 
                v-on:onView="onView"
                :search="search"
                :actionDelete=false
                :actionEdit=false
                :actionCreate=false
                style="margin-top:15px">  
                
      <template v-slot:headerbar>
        <div style="padding-left:20px">
          <b-form-radio-group
            v-model="selectedStatus"
            :options="statusOption"
            button-variant="outline-primary"
            size="sm"
            name="radio-btn-outline"
            @change="statusChange"
            buttons/>      

        </div>
      </template>       

      <template v-slot:actionButton1="data">
        <b-button title="View"  variant="info" @click="onView(data.item)" size="sm" 
        style="margin-left:3px;display:inline-block">
          <b-icon icon="eye" aria-hidden="true" ></b-icon>
        </b-button>
      </template>


    </DataTable>  
  
    <b-modal ref="formView" hide-header size="xl" scrollable  lazy ok-only centered> 
      <b-row class="editRow" >
        <b-col sm="6">
          <MyInputText label="TRANSACTION NO:" :value.sync="currentData.transaction_no" disabled/>  
          <MyInputText label="USER:" :value.sync="currentData.user.nama"  disabled/>  
          <MyInputText label="USER EMAIL:" :value.sync="currentData.user.email"  disabled/>  
          <MyInputText label="USER HP:" :value.sync="currentData.user.handphone"  disabled/>  
          <hr/>
          <MyInputDateTime label="EXPIRED AT" :value.sync="currentData.expired_at" disabled/>           
          <MyInputDateTime label="CREATED AT" :value.sync="currentData.created_at" disabled/>           
          <MyInputDateTime label="USER PAID AT" :value.sync="currentData.user_confirm_payment_date" disabled/>    
          <MyInputDateTime label="PAYMENT CONFIRM AT" :value.sync="currentData.confirm_payment_date" disabled/>           
          <MyInputText label="PAYMENT CONFIRM BY" :value.sync="currentData.payment_confirm_by_data.name" v-if="this.currentData.payment_type == 'TRANSFER MANUAL'" disabled/>           
          <hr/>
          <MyInputText label="STATUS:" :value.sync="currentData.status"  disabled/>  
        </b-col>

        <b-col sm="6">
          <b-row>
            <b-col  sm="6">
              <MyInputNumber label="SUBTOTAL" :value.sync="currentData.subtotal"  disabled/>
            </b-col>
            <b-col  sm="6">
              <MyInputNumber label="TRANSACTION FEE" :value.sync="currentData.transaction_fee"  disabled/>
            </b-col>
          </b-row>  
          <b-row>
            <b-col  sm="6">
              <MyInputNumber label="GRAND TOTAL" :value.sync="currentData.grant_total"  disabled/>
            </b-col>
            <b-col  sm="6">
            </b-col>
          </b-row>  
           
          <hr/>
          <b-row>
            <b-col  sm="10">
              <MyInputText label="PAYMENT" :value.sync="currentData.payment_type"  disabled/>  
            </b-col>
          </b-row>
          <b-row>
            <b-col  sm="10">
              <MyInputText label="TOTAL ITEM" :value.sync="currentData.total_item"  disabled/>  
            </b-col>
          </b-row>       

          <hr/>
          <label>ITEMS:</label>
          <b-row v-for="(item,idx) in currentData.items" :key="item.voucher"  >
            <b-col sm="9">
              <b-form-input :disabled="true" v-model="item.voucher_data.name"  ></b-form-input>
            </b-col>
            <b-col sm="3">
              <b-form-input :disabled="true" v-model="item.quantity" :formatter="formatThousandGroup" ></b-form-input>
            </b-col>
          </b-row>
          
          <label style="margin-top:20px">BUKTI BAYAR: </label>
          <b-row>
            <b-col sm="6" v-if="this.currentData.payment_type == 'TRANSFER MANUAL'">              
              <b-img v-if="!['WAITING_PAYMENT','CANCELED'].includes(currentData.status)" style="height:200px;width:300px" blank-color="#ddd" fluid :src="currentData.user_confirm_payment_image"></b-img>
            </b-col>

            <b-col sm="6">              
              <b-button :disabled="currentData.status != 'PAID'" style="width:300px" align-self="center"
                title="REJECT PAYMENT" variant="warning" size="lg" @click="onrejectPayment">
                <b-icon icon="file-earmark-excel" aria-hidden="true" ></b-icon>
                REJECT PAYMENT
              </b-button>

              <b-button :disabled="currentData.status != 'PAID'" style="width:300px;margin-top:10px" align-self="center"
                v-if="currentData.status !== 'PAYMENT_CONFIRMED'"
                title="CONFIRM PAYMENT" variant="success" size="lg" @click="onConfirmPayment">
                <b-icon icon="check" aria-hidden="true" ></b-icon>
                CONFIRM PAYMENT
              </b-button>

              <b-button style="width:300px;margin-top:10px" align-self="center"
                v-if="currentData.status == 'PAYMENT_CONFIRMED'"
                title="FINISH PAYMENT" variant="success" size="lg" @click="onFinishPayment">
                <b-icon icon="check" aria-hidden="true" ></b-icon>
                FINISH PAYMENT
              </b-button>

              <b-button :disabled="currentData.status == 'FINISHED' || currentData.status == 'CANCELED'" style="width:300px;margin-top:10px" align-self="center"
                title="CANCEL" variant="danger" size="lg" @click="onCancel">
                <b-icon icon="trash-fill" aria-hidden="true" ></b-icon>
                CANCEL
              </b-button>
            </b-col>
          </b-row>
  

        </b-col>        
      </b-row>
    </b-modal>
  </b-container>
</template>

<script>
  import moment from 'moment';
import MyInputText from './basic/MyInputText.vue';
  export default {
  components: { MyInputText },
    data () {
      return {
        title:"TRANSACTION",
        
        loading: false,
        fields: [
          { key: '_id', label:"ID", sortable: false,  },
          { key: 'user.nama', label:"USER", sortable: true,  },
          { key: 'user.email', label:"USER EMAIL", sortable: true,  },
          { key: 'grant_total', label:"TOTAL", sortable: true,},
          { key: 'transaction_no', label:"TRANS NO", sortable: true,},
          { key: 'payment_type', label:"PAYMENT TYPE", sortable: true,},
          { key: 'total_item', label:"TOTAL ITEM", sortable: false,},
          { key: 'status', label:"STATUS", sortable: true,  },
          { key: 'created_at', label:"CREATED AT", sortable: false },
          { key: 'action',label:"ACTION",tdClass:"columnActionStyle",thClass:"columnActionStyle" }
        ],
        
        tableData : {
          page:1,
          pages:1,
          total:0,
          limit:10,
          docs: [
          ]
        },
        imageProps: {
          center: true,
          fluidGrow: true,
          blank: true,
          blankColor: '#bbb',
          width: 400,
          height: 300,
          class: 'my-5'
        },

        statusOption: [
          { text: 'ALL', value: '' },
          { text: 'WAITING PAYMENT', value: 'WAITING_PAYMENT' },
          { text: 'PAYMENT_CONFIRMED', value: 'PAYMENT_CONFIRMED' },
          { text: 'PAID', value: 'PAID' },
          { text: 'CANCELED', value: 'CANCELED' },
          { text: 'FINISHED', value: 'FINISHED' }
        ],
        selectedStatus:this.$route.query.ss,
        selectedVoucher:null,
        voucherSelectData:{page:1,pages:1,total:0,limit:10,docs: []},
        currentData:{
          user:{},
          items:[],
          payment_confirm_by_data:{},
          payment_method_data:{}
        }
      }
    },

    computed: {

      createEnable:{
        get: function () {
          var acc = this.$auth.getAccess(this.$route.meta.code);
          if((acc & 2) == 2){
            return true;
          }
          return false;
        }
      },
      deleteEnable:{
        get: function () {
          var acc = this.$auth.getAccess(this.$route.meta.code);
          if((acc & 8) == 8){
            return true;
          }
          return false;
        }
      },
      updateEnable:{
        get: function () {
          var acc = this.$auth.getAccess(this.$route.meta.code);
          if((acc & 4) == 4){
            return true;
          }
          return false;
        }
      }
    },

    async created () {
      var page = this.$route.query.p;
      var sortBy = this.$route.query.sb;
      var sortDesc = this.$route.query.sd;
      var limit = this.$route.query.l;      
      var search = this.$route.query.s;
      this.selectedStatus= Boolean(this.$route.query.ss)?this.$route.query.ss:"";

      this.loadItems(page?page:1,sortBy?sortBy:"",sortDesc=="true",limit?limit:10,search?search:"");
    },

    methods: {
      async loadItems(page,sortBy,sortDesc,limit,search){   
        this.search = search;
        this.$router
          .replace({ query: { ...this.$route.query, p: page, sb:sortBy ,sd:sortDesc,l:limit,s:search,ss:this.selectedStatus } })
          .catch(() => {});

        this.$emit('showLoading', true);
        var response = await this.$http('get', `/store?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}&status=${this.selectedStatus} `);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.tableData = response.data;

          this.tableData.docs.forEach(item => {
            if(item.payment_type == "1"){
              item.payment_type = "TRANSFER MANUAL"
            }
          })

          console.log('load', this.tableData)
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadDetail(dataId){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/store/detail/${dataId}?`);
        this.$emit('showLoading', false);

        var token = this.$auth.getToken()
        if(response.is_ok){
          this.currentData = response.data;

          if(this.currentData.payment_type == "1"){
            this.currentData.payment_type = "TRANSFER MANUAL"
          }

          if(Boolean(this.currentData.user_confirm_payment_image !== undefined)) {
            this.currentData.user_confirm_payment_image = process.env.API_BASE_URL + "/document" + this.currentData.user_confirm_payment_image + "?token=" + token;
          } else {
            this.currentData.user_confirm_payment_image = ''
          }

          if(!Boolean(this.currentData.payment_confirm_by_data !== undefined)){
            this.currentData.payment_confirm_by_data  = {};
          } else {
            this.currentData.payment_confirm_by_data  = {};
          }
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },


      async onView(data){
        this.loadDetail(data._id);
        this.$refs['formView'].show();
      },

      

      async onCreate(){
        this.$refs['formCreate'].show();
      },

      async onConfirmPayment(){
        this.$emit('showLoading', true);
        var response = await this.$http("post",`/store/confirmpayment/${this.currentData._id}`, {
        });


        this.$emit('showLoading', false);

        if(response.is_ok){
          if(Boolean(response.message)){
            this.$emit('showMessage',response.message, "info");                        
          }

          this.onView(this.currentData);
        }else {
          this.$emit('showMessage',response.message, "danger");                        
        }
        console.log(JSON.stringify(this.currentData));
      },

      async onFinishPayment(){
        this.$emit('showLoading', true);
        console.log('id', this.currentData._id)
        var response = await this.$http("post",`/store/complete_order/${this.currentData._id}`, {
        });


        this.$emit('showLoading', false);

        if(response.is_ok){
          if(Boolean(response.message)){
            this.$emit('showMessage',response.message, "info");                        
          }

          this.onView(this.currentData);
        }else {
          this.$emit('showMessage',response.message, "danger");                        
        }
        console.log(JSON.stringify(this.currentData));
      },

      async onrejectPayment(){
        this.$emit('showLoading', true);
        var response = await this.$http("post",`/store/rejectpayment/${this.currentData._id}`, {
        });


        this.$emit('showLoading', false);

        if(response.is_ok){
          if(Boolean(response.message)){
            this.$emit('showMessage',response.message, "info");                        
          }

          this.onView(this.currentData);
        }else {
          this.$emit('showMessage',response.message, "danger");                        
        }
        console.log(JSON.stringify(this.currentData));
      },

      async onCancel(){
        this.$emit('showLoading', true);
        var response = await this.$http("post",`/store/cancel/${this.currentData._id}`, {
        });


        this.$emit('showLoading', false);

        if(response.is_ok){
          if(Boolean(response.message)){
            this.$emit('showMessage',response.message, "info");                        
          }

          this.onView(this.currentData);
        }else {
          this.$emit('showMessage',response.message, "danger");                        
        }
        console.log(JSON.stringify(this.currentData));
      },

      async statusChange(){
        this.$refs['dataTable'].reloadItems();
      }

    }
  }
</script>


<style>
  @media (min-width: 992px) {
    .modal-xl {
       max-width: 95% !important; width: 95% !important
    }
  }
  .editRow {
    margin-top:15px;
  }

  .link {
    color:blue
  }
</style>
