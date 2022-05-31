<template>
  <b-container fluid>
    <div align-v="center" class="d-flex justify-content-start align-middle" style="padding:10px;background-color:#f0f0f0;margin-right:15px;margin-left:15px">
      <label class="inputLabel">File</label>

      <b-form-file accept=".csv" size="sm" id="file" ref="file" style="width:300px;margin-right:10px"></b-form-file>

      <b-button title="View" size="sm" variant="success" :ok-disabled="!this.updateEnable" @click="onUpload()" style="width:120px;height:35px;margin-right:10px">
        <b-icon icon="cloud-upload" aria-hidden="true" style="margin-right:5px"></b-icon>
        UPLOAD
      </b-button>
      <b-button title="View" size="sm" variant="info" @click="onTemplate()" style="width:120px;height:35px;margin-right:10px">
        <b-icon icon="cloud-download" aria-hidden="true" style="margin-right:5px"></b-icon>
        TEMPLATE
      </b-button>
      <b-button title="View" size="sm" variant="warning" @click="onDownloadFailed()" style="width:180px;height:35px;margin-right:10px">
        <b-icon icon="cloud-download" aria-hidden="true" style="margin-right:5px"></b-icon>
        DOWNLOAD FAILED
      </b-button>
    </div>

     
    <DataTable ref="dataTable" v-bind:title="title"  
                v-bind:tableData="tableData"  
                v-bind:fields="fields" 
                v-on:loadItems="loadItems" 
                v-on:onCreateNew="onRefresh" 
                v-on:onView="onView"
                createTitle="Refresh"
                :search="search"
                :actionDelete=false
                :actionEdit=false
                style="margin-top:15px">  
      <template v-slot:headerbar>
        <div>
          <label style="margin-left:100px">FILTER STATUS</label>
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
        <b-button title="View" variant="info" @click="onView(data.item)" size="sm" 
        style="margin-left:3px;display:inline-block">
          <b-icon icon="eye" aria-hidden="true" ></b-icon>
        </b-button>
      </template>
    </DataTable>  
    
    <b-modal ref="formView" hide-header size="xl" scrollable  lazy   ok-only centered>
      <b-row class="editRow" >
        <b-col sm="2"><label>COMPANY POLICY</label></b-col>
        <b-col sm="9"><label>{{currentData.company_policy}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>USER ID</label></b-col>
        <b-col sm="9"><label>{{currentData.user_id}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>CERTIFICATE NO</label></b-col>
        <b-col sm="9"><label>{{currentData.certificate_no}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>NAMA TERTANGGUNG</label></b-col>
        <b-col sm="9"><label>{{currentData.nama_tertanggung}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>NIK TERTANGGUNG</label></b-col>
        <b-col sm="9"><label>{{currentData.nik_tertanggung}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>GENDER TERTANGGUNG</label></b-col>
        <b-col sm="9"><label>{{currentData.gender_tertanggung}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>PARTICIPANT STATUS</label></b-col>
        <b-col sm="9"><label>{{currentData.relation}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>POLICY DATE</label></b-col>
        <b-col sm="9"><label>{{currentData.policy_date | formatDate}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>PRODUCT TYPE</label></b-col>
        <b-col sm="9"><label>{{currentData.product_type}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>PRODUCT CODE</label></b-col>
        <b-col sm="9"><label>{{currentData.product_code}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>PLAN NAME</label></b-col>
        <b-col sm="9"><label>{{currentData.plan_name}}</label></b-col>          
      </b-row>
      
      <b-row class="editRow" >
        <b-col sm="2"><label>STATUS</label></b-col>
        <b-col sm="9"><label>{{currentData.status}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>STATUS MESSAGE</label></b-col>
        <b-col sm="9"><label>{{currentData.status_message}}</label></b-col>          
      </b-row>
    </b-modal>
  </b-container>
</template>

<script>
  import moment from 'moment';
  export default {
    data () {
      return {
        title:"PERCITICIPANT UPLOAD",
        loading: false,
        fields: [
          { key: 'user_id', label:"USER ID", sortable: true,  },
          { key: 'nama_tertanggung', label:"TERTANGGUNG", sortable: true,  },
          { key: 'certificate_no', label:"CERTIFICATE", sortable: true,},
          { key: 'policy_date', label:"POLICY DATE", sortable: true,
            formatter: (value, key, item) => {
              if(Boolean(value))
                return moment(value).format('DD MMM YYYY');
              else
                return "";
            }
          },
          { key: 'product_type', label:"PRODUCT TYPE", sortable: true },
          { key: 'product_code', label:"PRODUCT", sortable: true },
          { key: 'plan_name', label:"PLAN", sortable: true },
          { key: 'status', label:"STATUS", sortable: true },
          { key: 'status_message', label:"STATUS MESSAGE", sortable: true },
          { key: 'created_at', label:"CREATED AT", sortable: true, datetime:true},
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
        statusOption: [
          { text: 'ALL', value: '' },
          { text: 'WAITING', value: 'WAITING' },
          { text: 'SUCCESS', value: 'SUCCESS' },
          { text: 'FAILED', value: 'FAILED' }
        ],
        selectedStatus:"",
        currentData:{},
        product_type:"",
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
        var response = await this.$http('get', `/import_user_policy?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}&&status=${this.selectedStatus} `);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.tableData = response.data;

          this.product_type = this.tableData.docs

          this.product_type.forEach(item => {
            if(item.product_type == "1") {
              item.product_type = "SALVUS CARE"
            } else {
              item.product_type = "INSURANCE CLAIM"
            }
          })

        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },
      async loadUploadStatus(){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/import_user_policy/upload/status`);
        this.$emit('showLoading', false);

        console.log(response);

        if(response.is_ok){
          this.statusOption[0].text = "All (" + response.data.uploaded + ")";
          this.statusOption[1].text = "Waiting (" + response.data.waiting + ")";
          this.statusOption[2].text = "Success (" + response.data.success + ")";
          this.statusOption[3].text = "Failed (" + response.data.failed + ")";
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      
      async loadUser(page,sortBy,sortDesc,limit,search){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/user/selection?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        console.log(response);
        if(response.is_ok){
          this.selectData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async onUpload(){
        if(Boolean(this.$refs.file.files[0])){
          let formData = new FormData();
          formData.append('file', this.$refs.file.files[0]);
          this.$emit('showLoading', true);
          var response = await this.$httpUpload('post', `/import_user_policy/upload`,formData);
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
          window.open(process.env.API_BASE_URL + "/import_user_policy/template?token=" + accessToken , "_blank");          
      },

       async onDownloadFailed(){
          let accessToken = this.$auth.getToken();
          window.open(process.env.API_BASE_URL + "/import_user_policy/download/failed?token=" + accessToken, "_blank");          
      },

      async onView(data){
        this.currentData = data;
        this.$refs['formView'].show();
      },

      async onRefresh(data){
        this.$refs['dataTable'].reloadItems();
        this.loadUploadStatus();
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
  .editRow {
    margin-top:15px;
  }
</style>
