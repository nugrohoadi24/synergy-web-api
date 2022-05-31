<template>
  <b-container fluid>
    <DataTableClaim ref="dataTable" v-bind:title="titlePage"  
                v-bind:tableData="tableData"  
                v-bind:fields="fields" 
                v-on:loadItems="loadItems" 
                v-on:onEdit="onEdit"
                v-on:onCreateNew="onCreateNew"
                v-on:onView="onView"
                :productType="productType"
                :search="search"
                :actionCreate="this.createEnable"
                :actionView=false
                :actionDelete=false
                :actionEdit=false
                style="margin-top:10px">  

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
        <b-button title="PROCESS" variant="danger" @click="onProcess(data.item)" size="sm" style="margin-left:3px;display:inline-block">
          <b-icon icon="gear" aria-hidden="true" ></b-icon>
        </b-button>

        <b-button title="CLOSURE" variant="success" @click="onViewClosure(data.item)"
          v-if="['SPB_SENT','CLOSURE', 'PENDING_REIMBURSE'].includes(data.item.claim_status)"
          size="sm" style="margin-left:3px;display:inline-block">
          <b-icon icon="diagram3-fill" aria-hidden="true" ></b-icon>
        </b-button>

        <b-button title="CLOSURE FINANCE" variant="dark" @click="onViewClosureFinance(data.item)"
          v-if="['SPB_SENT','CLOSURE', 'PENDING_REIMBURSE'].includes(data.item.claim_status)"
          size="sm" style="margin-left:3px;display:inline-block">
          <b-icon icon="calculator" aria-hidden="true" ></b-icon>
        </b-button>
      </template>

    </DataTableClaim>      
    <div class="d-flex justify-content-end align-middle" style="margin-top:10px;margin-left:15px">      
      <label style="color:#606060"><b>SJM</b>=Surat Jaminan Masuk, <b>SPB</b>=Surat Perkiraan Biaya, <b>SJP</b>=Surat Jaminan Pulang</label>
    </div>
  </b-container>
</template>

<script>
  import moment from 'moment';
  export default {
    data () {
      return {
        title:"INSURANCE CLAIM",
        loading: false,
        fields: [
          { key: 'user_id', label:"PARTICIPANT SH ID", sortable: true},
          { key: 'card_no', label:"CARD NO", sortable: true},
          { key: 'cashless', label:"METHOD", sortable: true},
          { key: 'requester_product_type', label:"PRODUCT TYPE", sortable: true},
          { key: 'policy.nama_tertanggung', label:"PARTICIPANT NAME", sortable: true},
          { key: 'policy.certificate_no', label:"CERTIFICATE NO", sortable: true},          
          { key: 'claim_no', label:"CLAIM TICKET NO", sortable: true},
          { key: 'claim_total_amount', label:"CLAIMED AMOUNT", sortable: true, number:true},
          { key: 'covered_total_amount', label:"APPROVED AMOUNT", sortable: true,number:true},
          { key: 'request_claim_date', label:"REQUEST CLAIM DATE", sortable: true, date:true},
          { key: 'claim_status', label:"CLAIM STATUS", sortable: true },
          { key: 'policy.dob_tertanggung', label:"PARTICIPANT DOB", sortable: true , date:true},
          { key: 'created_at', label:"CREATED AT", sortable: true, datetime:true},
          { key: 'action',label:"ACTION",tdClass:"columnActionStyle",thClass:"columnActionStyle" }
        ],
        selectData:{
          page:1,
          pages:1,
          total:0,
          limit:10,
          docs: [
          ],
        },
        tableData : {
          page:1,
          pages:1,
          total:0,
          limit:10,
          docs: [
          ]
        },
        currentData:{},
        search:"",
        productType:"",
        statusOption: [
          { text: 'All', value: '' },
          { text: 'New Claim', value: 'CREATED' },
          { text: 'SJM Created', value: 'SJM_CREATED' },
          { text: 'SJM Sent', value: 'SJM_SENT' },
          { text: 'Claim Detail (Reimburse)', value: 'CLAIM_DETAIL' },
          { text: 'Process', value: 'PROCESSED' },
          { text: 'SPB+SJK Created', value: 'SPB_CREATED' },
          { text: 'SPB+SJK Sent', value: 'SPB_SENT' },
          { text: 'Pending (Reimburse)', value: 'PENDING_REIMBURSE'},
          { text: 'Pending Docs', value: 'CLOSURE' },
          { text: 'Paid', value: 'PAID'},
          { text: 'Reject', value: 'REJECTED' }
        ],
        selectedStatus:this.$route.query.ss,
        titlePage:""
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
      var productType = this.$route.query.type;
      var page = this.$route.query.p;
      var sortBy = this.$route.query.sb;
      var sortDesc = this.$route.query.sd;
      var limit = this.$route.query.l;      
      var search = this.$route.query.s;
      this.selectedStatus= Boolean(this.$route.query.ss)?this.$route.query.ss:"";

      if(!Boolean(sortDesc))
        sortDesc = 'true';
      this.loadItems(productType?productType:"",page?page:1,sortBy?sortBy:"created_at",sortDesc=="true",limit?limit:10,search?search:"");

      if(productType == "insurance") {
        this.titlePage = "INSURANCE CLAIM"
      } else if(productType == "salvus_care") {
        this.titlePage = "SALVUSCARE CLAIM"
      } else {
        this.titlePage = "ALL CLAIMS"
      }
    },

    methods: {
      async loadItems(productType,page,sortBy,sortDesc,limit,search){   
        this.search = search;
        this.productType = productType;
        this.$router
          .replace({ query: { ...this.$route.query, type:productType ,p: page, sb:sortBy ,sd:sortDesc,l:limit,s:search,ss:this.selectedStatus} })
          .catch(() => {});

        this.$emit('showLoading', true);
        var response = await this.$http('get', `/claim?type=${productType}&page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}&status=${this.selectedStatus}`);

        this.$emit('showLoading', false);
        if(response.is_ok){
          this.tableData = response.data

          var findCashless = this.tableData.docs
          findCashless.forEach(item => {
            if(item.cashless == false) {
              item.cashless = "REIMBURSE"
            } else {
              item.cashless = "CASHLESS"
            }
          })

          var getProductType = this.tableData.docs
          getProductType.forEach(item => {
            if(item.requester_product_type == "1") {
              item.requester_product_type = "SALVUSCARE"
            } else {
              item.requester_product_type = "INSURANCE CLAIM"
            }
          })   
          
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      onCreateNew(){
        this.$router.push({ path: 'claim_create'})
      },

      onEdit(data){
        if(data.claim_status == "CREATED" || 
           data.claim_status == "SJM_CREATED" ||
           data.claim_status == "SJM_SENT"
           ){
          this.$router.push({ path: 'claim_create', query: { id: data._id } });
        } else if(data.claim_status == "PROCESSED"){
          this.$router.push({ path: 'claim_process', query: { id: data._id }});
        }
      },

      onView(data){
        
      },

      onViewClosure(data){
        this.$router.push({ path: 'claim_closure', query: { claimId: data._id } });
      },

      onViewClosureFinance(data){
        this.$router.push({ path: 'claim_closure', query: { claimId: data._id,type:"F" } });
      },

      onProcess(data){
        if(data.claim_status == "CREATED" || 
           data.claim_status == "SJM_CREATED" ||
           data.claim_status == "REJECTED"  
        ){
          this.$router.push({ path: 'claim_create', query: { id: data._id, method:data.cashless } });
        } else {
          this.$router.push({ path: 'claim_process', query: { id: data._id, method:data.cashless }});
        }
      },
      
      async statusChange(){
        this.$refs['dataTable'].reloadItems();
      }
    }
  }
</script>

<style>
 
   
  .editRow {
    margin-top:15px;
  }
</style>
