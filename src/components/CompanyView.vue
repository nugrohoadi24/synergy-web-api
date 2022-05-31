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
    
    <b-modal ref="formEdit" hide-header size="xl" scrollable  lazy  centered 
      :ok-disabled="!this.updateEnable" ok-title="SAVE" cancel-title="CANCEL" @ok="saveData">

      <MyInputText label="KODE" :value.sync="currentData.code" mx=10 mandatory/> 
      <MyInputText label="NAMA" :value.sync="currentData.name" mx=150 mandatory/> 

      <MyInputText label="COMPANY NPWP" :value.sync="currentData.company_npwp" mx=150 mandatory/> 
      <MyInputText label="COMPANY AKTA" :value.sync="currentData.company_akta" mx=150 mandatory/> 
      <MyInputText label="COMPANY SOP/NIB" :value.sync="currentData.company_sop_nib" mx=150 mandatory/> 
      <MyInputText label="COMPANY KTP" :value.sync="currentData.company_ktp" mx=150 mandatory/> 
      <MyInputText label="COMPANY BANK ACC" :value.sync="currentData.company_bank_acc_no" mx=150 mandatory/> 

      <b-row class="editRow mb-3" >
        <b-col sm="3">
          <label>ACTIVE</label>
        </b-col>
        <b-col sm="9">
          <b-form-checkbox v-model="currentData.is_active"></b-form-checkbox>
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
        title:"CORPORATE CLIENT",
        loading: false,
        fields: [
          { key: 'code', label:"CODE", sortable: true,  },
          { key: 'name', label:"NAME", sortable: true,},
          { key: 'is_active', label:"ACTIVE", sortable: true },
          { key: 'created_at', label:"CREATED AT", sortable: true, datetime:true},
          { key: 'updated_at', label:"UPDATED AT", sortable: true, datetime:true},
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
        currentData:{},
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
        var response = await this.$http('get', `/company?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        console.log(response);
        if(response.is_ok){
          this.tableData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      onCreateNew(){
        this.currentData = {is_active:true};
        this.confirmPassword = "";
        this.$refs['formEdit'].show()
      },

      async onEdit(data){
        this.$router.push({ path: 'company_detail', query: { id: data._id } })
      },

      async onDelete(data){
        this.$emit('showLoading', true);
        var response = await this.$http('delete', `/company/${data._id}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.$refs.dataTable.reloadItems();
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },
      
      async saveData(bvModalEvt){
        bvModalEvt.preventDefault();

        this.$emit('showLoading', true);
        var response = await this.$http(Boolean(this.currentData._id)?"post":"put", `/company`,this.currentData);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.currentData = {};
          this.$refs['formEdit'].hide()
          this.$refs.dataTable.reloadItems();
        }else {
          this.$emit('showMessage',response.message, "danger");                        
        }
      },
    }
  }
</script>

<style>
 
   
  .editRow {
    margin-top:15px;
  }
</style>
