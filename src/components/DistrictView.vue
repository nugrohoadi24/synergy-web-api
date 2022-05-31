<template>
  <b-container fluid>
    <DataTable ref="dataTable" v-bind:title="title"  
                v-bind:tableData="tableData"  
                v-bind:fields="fields" 
                v-on:loadItems="loadItems" 
                v-on:onDelete="onDelete" 
                v-on:onEdit="onEdit"
                v-on:onCreateNew="onCreateNew"
                :search="search"
                :actionCreate="this.createEnable"
                :actionDelete="this.deleteEnable"
                style="margin-top:10px">  
    </DataTable>  
    
    <b-modal ref="formEdit" hide-header size="lg" scrollable  lazy  centered ok-title="SAVE" button-size="sm" 
    :ok-disabled="!this.updateEnable" cancel-title="CANCEL" @ok="saveData">
      <MyInputSearchableSelect label="KOTA" :value.sync="currentData.city" mandatory
        v-on:loadItems="loadCity" 
        :items="selectData" value_field="_id" text_field="name" /> 
        
      <MyInputText label="KODE KECAMATAN" :value.sync="currentData.code" mx=10 mandatory/> 
      <MyInputText label="NAMA KECAMATAN" :value.sync="currentData.name" mx=150 mandatory/> 


      <b-row class="editRow" >
        <b-col sm="3">
          <label>ACTIVE</label>
        </b-col>
        <b-col sm="9">
          <b-form-checkbox size="sm" v-model="currentData.is_active"></b-form-checkbox>
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
        title:"DISTRICT",
        loading: false,
        fields: [
          { key: 'code', label:"DISTRICT CODE", sortable: true},
          { key: 'name', label:"NAME", sortable: true},
          { key: 'is_active', label:"ACTIVE", sortable: true },
          { key: 'created_at', label:"CREATED AT", sortable: true, datetime:true},
          { key: 'updated_at', label:"UPDATED AT", sortable: true, datetime:true},
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
        acc:0
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

      await this.loadCity(1,"","",10,"");

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
        var response = await this.$http('get', `/district?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        console.log(response);
        if(response.is_ok){
          this.tableData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadCity(page,sortBy,sortDesc,limit,search){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/city/selection?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        console.log(response);
        if(response.is_ok){
          this.selectData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      onCreateNew(){
        this.currentData = {is_active:true};
        this.confirmPassword = "";
        this.$refs['formEdit'].show()
      },


      onEdit(data){
        this.currentData = data;        
        this.$refs['formEdit'].show()
      },

      async onDelete(data){
        this.$emit('showLoading', true);
        var response = await this.$http('delete', `/district/${data._id}`);
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
          errmsg += "* Silahkan input code kecamatan  \r\n";

        if(!Boolean(this.currentData.name))
          errmsg += "* Silahkan input nama kecamatan \r\n";

        if(!Boolean(this.currentData.city))
          errmsg += "* Silahkan Pilih Kota \r\n";

        if(Boolean(errmsg)) {
          this.$emit('showMessage',errmsg, "info");                        
          return;
        }

        this.$emit('showLoading', true);
        var response = await this.$http(Boolean(this.currentData._id)?"post":"put", `/district`,this.currentData);
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
 
   
  .editRow {
    margin-top:15px;
  }
</style>
