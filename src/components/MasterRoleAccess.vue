<template>
  <b-container fluid>
    <DataTable ref="dataTable" v-bind:title="title"  
                v-bind:tableData="tableData"  
                v-bind:fields="fields" 
                v-on:loadItems="loadItems" 
                v-on:onDelete="onDelete" 
                v-on:onEdit="onEdit"
                v-on:onCreateNew="onCreateNew"
                :actionCreate="this.createEnable"
                :actionDelete="this.deleteEnable"
                :search="search"
                style="margin-top:10px">  </DataTable>  
    
    <b-modal ref="formEdit" hide-header size="xl" scrollable lazy no-close-on-esc no-close-on-backdrop centered  
      :ok-disabled="!this.updateEnable" ok-title="SAVE" cancel-title="CANCEL" @ok="saveData">

      <b-row class="editRow" >
        <b-col sm="1">
          <label>CODE</label>
        </b-col>
        <b-col sm="3">
          <b-form-input v-model="currentData.code" :formatter="upperFormatter"></b-form-input>
        </b-col>          
        <b-col sm="1" offset="1">
          <label>NAME</label>
        </b-col>
        <b-col sm="3">
          <b-form-input v-model="currentData.name" :formatter="upperFormatter"></b-form-input>
        </b-col>          
      </b-row>


      <b-row class="editRow " style="background-color:#d0d0d0">
        <b-col sm="2">
        </b-col>        
        <b-col sm="1" v-for="(dataAction,idx) in currentData.actionList" :key="dataAction.code">
          <label style="font-weight:bold;padding-top:5px">{{dataAction.name}}</label>
        </b-col>
      </b-row>

      <b-row class="editRow" v-for="(data,idx) in currentData.accessList" :key="data.code">
        <b-col sm="2">
          <label>{{data.name}}</label>
        </b-col>        
        <b-col sm="1" v-for="(dataAction,idx) in currentData.actionList" :key="dataAction.code">
          <b-form-checkbox v-model="data[dataAction.name]"></b-form-checkbox>
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
        title:"ROLE ACCESS",
        loading: false,
        fields: [
          { key: 'code', label:"CODE", sortable: true,  },
          { key: 'name', label:"NAME", sortable: true,  },
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
        roleData : {
          docs: [
          ]
        },
        currentData:{},
        confirmPassword:"",
        currentDataRole:""
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

      if(!Boolean(sortDesc))
        sortDesc = 'true';

      this.loadItems(page?page:1,sortBy?sortBy:"created_at",sortDesc=="true",limit?limit:10,search?search:"");
    },

    methods: {
      async loadItems(page,sortBy,sortDesc,limit,search){   
        this.search = search;
        this.$router
          .replace({ query: { ...this.$route.query, p: page, sb:sortBy ,sd:sortDesc,l:limit,s:search } })
          .catch(() => {});
          
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/role?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        console.log(response);
        if(response.is_ok){
          this.tableData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async onCreateNew(){
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/role/accessList`);
        this.$emit('showLoading', false);

        console.log(JSON.stringify(response));
        this.currentData = {
          accessList: response.data.accessList,
          actionList:response.data.actionList
        };
        this.$refs['formEdit'].show()
      },


      async onEdit(data){        
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/role/detail/${data._id}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.currentData = response.data;
          this.$refs['formEdit'].show()
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },


      async onDelete(data){
        this.$emit('showLoading', true);
        var response = await this.$http('delete', `/role/${data._id}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.$refs.dataTable.reloadItems();
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }

      },
      
      async saveData(bvModalEvt){
        bvModalEvt.preventDefault();

        var errmsg =""

        if(!Boolean(this.currentData.code))
          errmsg += "* Silahkan input kode dari role  \r\n";

        if(!Boolean(this.currentData.name))
          errmsg += "* Silahkan input nama dari role  \r\n";

        if(Boolean(errmsg)) {
          this.$emit('showMessage',errmsg, "info");                        
          return;
        }

        console.log(JSON.stringify(this.currentData));

        this.$emit('showLoading', true);
        var response = await this.$http(Boolean(this.currentData._id)?"post":"put", `/role`,this.currentData);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.currentData = {};
          this.$refs['formEdit'].hide()
          this.$refs.dataTable.reloadItems();
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
</style>
