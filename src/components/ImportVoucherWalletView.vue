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
  
    <b-modal ref="formCreate" hide-header size="xl" scrollable  lazy ok-only ok-title="UPLOAD"  @ok="onUpload" centered>
      <b-card style="margin-top:10px;margin-left:15px;margin-right:15px">
        <table>
          <tr>
            <td width="130px"><label class="inputLabel">File</label></td>
            <td><b-form-file accept=".csv" size="sm" id="file" ref="file" style="width:350px;margin-right:10px"></b-form-file></td>

            <td style="padding-left:30px">
              <b-button title="View" size="sm" variant="info" @click="onTemplate()" style="width:120px;height:35px;margin-right:10px">
                <b-icon icon="cloud-download" aria-hidden="true" style="margin-right:5px"></b-icon>
                TEMPLATE
              </b-button>
            </td>
          </tr>
          <tr>
            <td colspan="2" width="350px"> <MyInputSearchableSelect label="Voucher" style="margin-top:0px;" :value.sync="selectedVoucher" v-on:loadItems="loadVoucher" :items="voucherSelectData" value_field="_id" text_field="name" /> </td>
          </tr>
        </table>    
      </b-card>
    </b-modal>
    
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
        title:"VOUCHER WALLET UPLOAD",
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
          { key: 'approved_status', label:"APPPROVED STATUS", sortable: false},
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
        statusOption: [
          { text: 'ALL', value: '' },
          { text: 'NEW', value: 'NEW' },
          { text: 'APPROVED', value: 'APPROVED' },
          { text: 'PROCESSED', value: 'PROCESSED' },
          { text: 'FAILED', value: 'FAILED' }
        ],
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
      this.loadUploadStatus();
    },

    methods: {
      async loadItems(page,sortBy,sortDesc,limit,search){   
        this.search = search;
        this.$router
          .replace({ query: { ...this.$route.query, p: page, sb:sortBy ,sd:sortDesc,l:limit,s:search } })
          .catch(() => {});

        this.$emit('showLoading', true);
        var response = await this.$http('get', `/import_voucher?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}&&status=${this.selectedStatus} `);
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

      async loadUploadStatus(){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/import_voucher/upload/status`);
        this.$emit('showLoading', false);

        console.log(response);

        if(response.is_ok){
          this.statusOption[0].text = "All (" + response.data.uploaded + ")";
          this.statusOption[1].text = "New (" + response.data.new + ")";
          this.statusOption[2].text = "Approved (" + response.data.approved + ")";
          this.statusOption[3].text = "Processed (" + response.data.processed + ")";
          this.statusOption[4].text = "Failed (" + response.data.failed + ")";
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadVoucher(page,sortBy,sortDesc,limit,search){  
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/voucher/selection?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          this.voucherSelectData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async onUpload(){
        if(!(Boolean(this.selectedVoucher) &&  Boolean(this.selectedVoucher.name))){
          this.$emit('showMessage',"Silahkan pilih voucher yg akan di upload wallet nya", "info");           
          return;             
        }
        
        if(Boolean(this.$refs.file.files[0])){
          let formData = new FormData();
          formData.append('file', this.$refs.file.files[0]);
          formData.append('voucher', this.selectedVoucher._id);
          this.$emit('showLoading', true);
          var response = await this.$httpUpload('post', `/import_voucher/upload`,formData);
          this.$emit('showLoading', false);
          
          if(response.is_ok){
            this.currentData = {};
            this.$refs['dataTable'].reloadItems();
            this.$emit('showMessage',"File terupload, silahkan tunggu proses", "info");                        
          }else {
            this.$emit('showMessage',response.message, "danger");                        
          }
        }else{
          this.$emit('showMessage',"Silahkan pilih file terlebih dahulu", "info");                        
        }
      },

      async onTemplate(){
          let accessToken = this.$auth.getToken();
          window.open(process.env.API_BASE_URL + "/import_voucher/template?token=" + accessToken , "_blank");          
      },

       async onDownloadFailed(){
          let accessToken = this.$auth.getToken();
          window.open(process.env.API_BASE_URL + "/import_voucher/download/failed?token=" + accessToken, "_blank");          
      },

      async onView(data){
        this.currentData = data;
        this.loadDetailItems(1,"",true,10,"");
        this.$refs['formView'].show();
      },

      
      async onApprove(data,status){
        bvModalEvt.preventDefault();

        this.$emit('showLoading', true);
        var response = await this.$http("post",`/import_voucher/approve/${this.currentData._id}/${status}`, {
          reason:""
        });

        this.$emit('showLoading', false);
        if(response.is_ok){
          this.onEdit(this.currentData);
          this.$refs['dataTable'].reloadItems();
        }else {
          this.$emit('showMessage',response.message, "danger");                        
        }

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
