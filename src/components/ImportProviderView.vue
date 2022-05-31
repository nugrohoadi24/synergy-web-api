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
        <b-col sm="2"><label>TYPE</label></b-col>
        <b-col sm="9"><label>{{currentData.type}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>CODE</label></b-col>
        <b-col sm="9"><label>{{currentData.code}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>NAME</label></b-col>
        <b-col sm="9"><label>{{currentData.name}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>ADDRESS</label></b-col>
        <b-col sm="9"><label>{{currentData.address}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>PROVINCE</label></b-col>
        <b-col sm="9"><label>{{currentData.province_data.name}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>CITY</label></b-col>
        <b-col sm="9"><label>{{currentData.city_data.name}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>DISTRICT</label></b-col>
        <b-col sm="9"><label>{{currentData.district_data.name}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>VILAGE</label></b-col>
        <b-col sm="9"><label>{{currentData.subdistrict_data.name}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>ZIPCODE</label></b-col>
        <b-col sm="9"><label>{{currentData.zipcode}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>PHONE1</label></b-col>
        <b-col sm="9"><label>{{currentData.phone1}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>PHONE2</label></b-col>
        <b-col sm="9"><label>{{currentData.phone2}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>LONGITUDE</label></b-col>
        <b-col sm="9"><label>{{currentData.longitude}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>LATITUDE</label></b-col>
        <b-col sm="9"><label>{{currentData.latitude}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>ADMIN EMAIL</label></b-col>
        <b-col sm="9"><label>{{currentData.admin_email}}</label></b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="2"><label>VOUCHER PIN</label></b-col>
        <b-col sm="9"><label>{{currentData.voucher_pin}}</label></b-col>          
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
        title:"PROVIDER UPLOAD",
        loading: false,
        fields: [
          { key: 'type', label:"TYPE", sortable: true,  },
          { key: 'code', label:"CODE", sortable: true,  },
          { key: 'name', label:"NAME", sortable: true },
          { key: 'address', label:"ADDRESS", sortable: true },
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
        currentData:{
          province_data:{},
          city_data:{},
          subdistrict_data:{},
          district_data:{}
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
        var response = await this.$http('get', `/import_provider?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}&&status=${this.selectedStatus} `);
        this.$emit('showLoading', false);

        console.log(response);
        if(response.is_ok){
          this.tableData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },
      async loadUploadStatus(){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/import_provider/upload/status`);
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
          var response = await this.$httpUpload('post', `/import_provider/upload`,formData);
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
          window.open(process.env.API_BASE_URL + "/import_provider/template?token=" + accessToken , "_blank");          
      },

       async onDownloadFailed(){
          let accessToken = this.$auth.getToken();
          window.open(process.env.API_BASE_URL + "/import_provider/download/failed?token=" + accessToken, "_blank");          
      },

      async onView(data){
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/import_provider/detail/${data._id}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.currentData = response.data;
          this.$refs['formView'].show();
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }

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
