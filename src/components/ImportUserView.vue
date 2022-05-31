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
        <b-col sm="2"><label>USER ID</label></b-col>
        <b-col sm="9"><label>{{currentData.userId}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>NAMA</label></b-col>
        <b-col sm="9"><label>{{currentData.nama}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>EMAIL</label></b-col>
        <b-col sm="9"><label>{{currentData.email}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>NIK</label></b-col>
        <b-col sm="9"><label>{{currentData.nik}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>DOB</label></b-col>
        <b-col sm="9"><label>{{currentData.dob | formatDate}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>PASSWORD</label></b-col>
        <b-col sm="9"><label>{{currentData.password}}</label></b-col>          
      </b-row>

      <b-row class="editRow" >
        <b-col sm="2"><label>COMPANY</label></b-col>
        <b-col sm="9"><label>{{currentData.company}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>PHONE</label></b-col>
        <b-col sm="9"><label>{{currentData.phone}}</label></b-col>          
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
        title:"INDIVIDUAL MEMBER UPLOAD",
        loading: false,
        fields: [
          { key: 'userId', label:"USER ID", sortable: true,  },
          { key: 'nik', label:"NIK", sortable: true,  },
          { key: 'nama', label:"NAMA", sortable: true,  },
          { key: 'email', label:"EMAIL", sortable: true,},
          { key: 'company', label:"COMPANY", sortable: true },
          { key: 'phone', label:"PHONE", sortable: true },
          { key: 'status', label:"STATUS", sortable: true },
          { key: 'status_message', label:"STATUS MESSAGE", sortable: true },
          { key: 'created_at', label:"CREATED AT", sortable: true,datetime:true},
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
        var response = await this.$http('get', `/import_user?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}&&status=${this.selectedStatus} `);
        this.$emit('showLoading', false);

        console.log(response);
        if(response.is_ok){
          this.tableData = response.data;
           moment().format("DD-MM-YYYY")
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },
      async loadUploadStatus(){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/import_user/upload/status`);
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
      async onUpload(){
        if(Boolean(this.$refs.file.files[0])){
          let formData = new FormData();
          formData.append('file', this.$refs.file.files[0]);
          this.$emit('showLoading', true);
          var response = await this.$httpUpload('post', `/import_user/upload`,formData);
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
          window.open(process.env.API_BASE_URL + "/import_user/template?token=" + accessToken , "_blank");          
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

      async onDownloadFailed(){
          let accessToken = this.$auth.getToken();
          window.open(process.env.API_BASE_URL + "/import_user/download/failed?token=" + accessToken, "_blank");          
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
