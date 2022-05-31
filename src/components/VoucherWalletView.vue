<template>
  <b-container fluid>

    <DataTable ref="dataTable" v-bind:title="title"  
                v-bind:tableData="tableData"  
                v-bind:fields="fields" 
                v-on:loadItems="loadItems" 
                v-on:onEdit="onEdit"
                :actionCreate="false"
                :actionDelete="false"
                :search="search"
                style="margin-top:10px">      
    </DataTable>  
    
    <b-modal ref="formEdit" hide-header size="xl" scrollable lazy centered ok-only OK-title="OK">
      <b-row class="editRow" >
        <b-col sm="6">
          <MyInputText label="VOUCHER CODE:" :value.sync="currentData.voucher_code"  disabled />  
          <MyInputText label="VOUCHER NAME:" :value.sync="currentData.voucher_data.name"  disabled />  
          <MyInputText label="PROVIDER:" :value.sync="currentData.provider_data.name"  disabled />  
          <MyInputText label="SOURCE:" :value.sync="currentData.source"  disabled />  
          <MyInputText label="UPLOAD FROM:" :value.sync="currentData.upload_from_id"  disabled />  
          <hr/>
          <MyInputDateTime label="EXPIRED AT" :value.sync="currentData.expired_date" disabled /> 
          <MyInputDateTime label="USED AT" :value.sync="currentData.used_date" disabled /> 
          <hr/>
          <MyInputText label="CREATED BY:" :value.sync="currentData.created_by_user.name"  disabled />  
          <MyInputDateTime label="CREATED AT" :value.sync="currentData.created_at" disabled /> 
        </b-col>

        <b-col sm="6">
          <MyInputText label="USER:" :value.sync="currentData.user_data.nama"  disabled />  
          <MyInputText label="USER EMAIL:" :value.sync="currentData.user_data.email"  disabled />  
          <MyInputText label="USER HP:" :value.sync="currentData.user_data.handphone"  disabled />  
          <hr/>
          <MyInputDateTime label="REVOKE AT" :value.sync="currentData.revoke_date" disabled /> 
          <MyInputText label="REVOKE BY:" :value.sync="currentData.revoke_by_user.name"  disabled />  
          <MyInputText label="REVOKE REASON:" :value.sync="currentData.revoke_reason"  disabled />  
          <hr/>
          <MyInputDateTime label="PURCHASE AT" :value.sync="currentData.purchase_date" disabled /> 
          <MyInputText label="PURCHASE NOTE:" :value.sync="currentData.purchase_note"  disabled />
          <MyInputText label="TRANSACTION NO:" :value.sync="currentData.transaction_data.transaction_no"  disabled />

          <hr/>
          <b-button :disabled="Boolean(currentData.used_date) || Boolean(currentData.revoke_date)"  title="REVOKE" variant="danger" size="sm" style="margin-left:5px" @click="onRevoke">
            <b-icon icon="pencil-fill" aria-hidden="true" ></b-icon>
            REVOKE
          </b-button>
        
        </b-col>        
      </b-row>
            
    </b-modal>
  </b-container>
</template>

<script>
  import moment from 'moment';
  export default {
    data () {
      return {
        title:"VOUCHER WALLET",
        loading: false,
        fields: [
          { key: 'voucher_code', label:"VOUCHER CODE", sortable: true,  },
          { key: 'user_data.nama', label:"USER", sortable: true,},
          { key: 'provider_data.name', label:"PROVIDER", sortable: true },
          { key: 'created_by_user.name', label:"CREATED BY", sortable: true },
          { key: 'purchase_note', label:"PURCHASE NOTE", sortable: true },
          { key: 'purchase_date', label:"PURCHASE AT", sortable: true, datetime:true},
          { key: 'expired_date', label:"EXPIRED AT", sortable: true, datetime:true },
          { key: 'used_date', label:"USED_AT", sortable: true, datetime:true },
          { key: 'created_at', label:"CREATED AT", sortable: true, datetime:true},
          { key: 'action',label:"ACTION",tdClass:"columnActionStyle",thClass:"columnActionStyle" }
        ],
        voucherId:"",
        status:"",
        tableData : {
          page:1,
          pages:1,
          total:0,
          limit:10,
          docs: [
          ]
        },
        roleData : {
          docs: [
          ]
        },
        currentData:{
          created_by_user:{},
          provider_data:{},
          user_data:{},
          voucher_data:{},
          revoke_by_user:{},
          transaction_data:{}
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
      this.voucherId = this.$route.query.voucherId;
      this.status = this.$route.query.status;
      var page = this.$route.query.p;
      var sortBy = this.$route.query.sb;
      var sortDesc = this.$route.query.sd;
      var limit = this.$route.query.l;      
      var search = this.$route.query.s;

      if(!Boolean(sortDesc))
        sortDesc = 'true';

      this.loadItems(page?page:1,sortBy?sortBy:"created_at",sortDesc=="true",limit?limit:10,search?search:"");      
    },

    methods: {
      async loadItems(page,sortBy,sortDesc,limit,search){   
        this.search = search;
        this.$router
          .replace({ query: { ...this.$route.query, p: page, sb:sortBy ,sd:sortDesc, l:limit, s:search, status:this.status, voucherId:this.voucherId } })
          .catch(() => {});
          
        console.log(`/voucher/wallet/${this.voucherId}?status=${this.status}&page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);

        this.$emit('showLoading', true);
        var response = await this.$http('get', `/voucher/wallet/${this.voucherId}?status=${this.status}&page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.tableData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async onEdit(data){
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/voucher/wallet/detail/${data._id}`);
        this.$emit('showLoading', false);

        console.log(JSON.stringify(response));

        if(response.is_ok){
          this.currentData = response.data;   
          if(!Boolean(this.currentData.revoke_by_user))
            this.currentData.revoke_by_user = {};

          if(!Boolean(this.currentData.transaction_data))
            this.currentData.transaction_data = {};

         this.$refs['formEdit'].show()
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }                    
      },

      
      async onRevoke(bvModalEvt){
        bvModalEvt.preventDefault();

        this.$emit('showLoading', true);
        var response = await this.$http("post",`/voucher/wallet/revoke/${this.currentData._id}`, {
          reason:""
        });


        this.$emit('showLoading', false);

        if(response.is_ok){
          this.onEdit(this.currentData);
        }else {
          this.$emit('showMessage',response.message, "danger");                        
        }
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
