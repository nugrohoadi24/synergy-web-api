<template>
  <b-container fluid>     
    <DataTable ref="dataTable" v-bind:title="title"  
                v-bind:tableData="tableData"  
                v-bind:fields="fields" 
                v-on:loadItems="loadItems" 
                v-on:onCreateNew="onCreate" 
                v-on:onView="onView"
                createTitle="CREATE"
                :search="search"
                :actionDelete=false
                :actionEdit=false
                :actionCreate=false
                style="margin-top:15px">  
                

      <template v-slot:actionButton1="data">
        <b-button title="View"  variant="info" @click="onView(data.item)" size="sm" 
        style="margin-left:3px;display:inline-block">
          <b-icon icon="eye" aria-hidden="true" ></b-icon>
        </b-button>

        <b-button title="View"  variant="outline-info" @click="onApprove(data.item,'APPROVED')" size="sm"  style="margin-left:3px;display:inline-block">
          <b-icon icon="check-circle"></b-icon>
          Approve
        </b-button>
        
        <b-button title="View" variant="outline-danger" @click="onApprove(data.item,'REJECTED')" size="sm"  style="margin-left:3px;display:inline-block">
          <b-icon icon="x-circle" ></b-icon>
          Reject
        </b-button>
      </template>


    </DataTable>  
    
    <b-modal ref="formView" hide-header size="xl" scrollable  lazy ok-only centered>
      <DataTable ref="detailDataTable" v-bind:title="detailTitle"  
                      v-bind:tableData="detailtableData"  
                      v-bind:fields="detailFields" 
                      v-on:loadItems="loadDetailItems" 
                      :search="search"
                      :actionDelete=false
                      :actionEdit=false
                      :actionCreate=false>  
      </DataTable>  
    </b-modal>
  </b-container>
</template>

<script>
  import moment from 'moment';
  export default {
    data () {
      return {
        title:"VOUCHER WALLET APPROVE",
        detailTitle:"UPLOADED DETAIL",
        
        loading: false,
        fields: [
          { key: 'voucher_data.name', label:"VOUCHER", sortable: false,  },
          { key: 'status', label:"STATUS", sortable: false,  },
          { key: 'data_count', label:"DATA COUNT", sortable: false,},
          { key: 'success_count', label:"SUCCESS COUNT", sortable: false,},
          { key: 'failed_count', label:"FAILED COUNT", sortable: false,},
          { key: 'status', label:"STATUS", sortable: false },
          { key: 'note', label:"NOTE", sortable: true },
          { key: 'created_by_user.name', label:"CREATED BY", sortable: true},
          { key: 'created_at', label:"CREATED AT", sortable: false, datetime:true},
          { key: 'approved_by_user.name', label:"APPPROVED BY", sortable: false},
          { key: 'approved_at', label:"APPPROVED AT", sortable: false, datetime:true},
          { key: 'action',label:"ACTION",tdClass:"columnActionStyle",thClass:"columnActionStyle" }
        ],
        detailFields: [
          { key: 'data.user_id', label:"USER", sortable: true,  },
          { key: 'data.user.nama', label:"USER NAME", sortable: true,  },
          { key: 'data.user.email', label:"USER EMAIL", sortable: true,  },
          { key: 'data.user.handphone', label:"USER HP", sortable: true,  },
          { key: 'data.voucher_code', label:"VOUCHER CODE", sortable: true},
          { key: 'data.expired_date', label:"EXPIRED DATE", sortable: true, datetime:true},
          { key: 'data.status', label:"STATUS", sortable: true },
          { key: 'data.errormsg', label:"NOTE", sortable: true }
        ],
        detailtableData : {
          page:1,
          pages:1,
          total:0,
          limit:10,
          docs: [
          ]
        },
        tableData : {
          page:1,
          pages:1,
          total:0,
          limit:10,
          docs: [
          ]
        },
       
        selectedStatus:"",
        selectedVoucher:null,
        voucherSelectData:{page:1,pages:1,total:0,limit:10,docs: []},
        currentData:{}
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
      this.loadItems(page?page:1,sortBy?sortBy:"",sortDesc=="true",limit?limit:10,search?search:"");
    },

    methods: {
      async loadItems(page,sortBy,sortDesc,limit,search){   
        this.search = search;
        this.$router
          .replace({ query: { ...this.$route.query, p: page, sb:sortBy ,sd:sortDesc,l:limit,s:search } })
          .catch(() => {});

        this.$emit('showLoading', true);
        var response = await this.$http('get', `/import_voucher?wait_approve=true&page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}&&status=${this.selectedStatus} `);
        this.$emit('showLoading', false);

        console.log(response);
        if(response.is_ok){
          this.tableData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadDetailItems(page,sortBy,sortDesc,limit,search){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/import_voucher/datadetail/${this.currentData._id}?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}&&status=${this.selectedStatus} `);
        this.$emit('showLoading', false);

        console.log(response);
        if(response.is_ok){
          this.detailtableData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async onView(data){
        this.currentData = data;
        this.loadDetailItems(1,"",true,10,"");
        this.$refs['formView'].show();
      },

      
      async onApprove(data,status){
        this.$bvModal.msgBoxConfirm('Apakah anda yakin untuk Approve/Reject data ini?') 
        .then(async(value) => {
          if(value) {
            this.$emit('showLoading', true);
            var response = await this.$http("post",`/import_voucher/approve/${data._id}/${status}`, {
              reason:""
            });

            this.$emit('showLoading', false);
            if(response.is_ok){
              this.$refs['dataTable'].reloadItems();
            }else {
              this.$emit('showMessage',response.message, "danger");                        
            }
          }
        })
        .catch(err => {
          // An error occurred
        })
      },

      async onCreate(){
        this.$refs['formCreate'].show();
      },

      async onDelete(data){
      
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
