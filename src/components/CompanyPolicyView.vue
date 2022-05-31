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
                style="margin-top:10px">  
    </DataTable>  
    
    <b-modal ref="formEdit" hide-header size="xl" scrollable  lazy  centered 
      :ok-disabled="!this.updateEnable" ok-title="SAVE" cancel-title="CANCEL" @ok="saveData">
      <b-row> 
        <b-col sm="6">
          <MyInputSearchableSelect label="COMPANY" :value.sync="currentData.company" v-on:loadItems="loadCompany" 
            :items="companySelectData" value_field="_id" text_field="name" /> 

          <MyInputText label="POLICY NO" :value.sync="currentData.policy_no" mx=20 mandatory/> 
          <MyInputDate label="POLICY DATE" :value.sync="currentData.policy_date" mandatory /> 
          <MyInputDate label="POLICY END DATE" :value.sync="currentData.policy_end_date" mandatory /> 
        </b-col>

        <b-col sm="6">     
          <MyInputTextArea label="NOTE" :value.sync="currentData.note" mx=200 /> 

          <b-row class="editRow" >
            <b-col sm="3">
              <label>ACTIVE</label>
            </b-col>
            <b-col sm="9">
              <b-form-checkbox size="sm" v-model="currentData.is_active"></b-form-checkbox>
            </b-col>          
          </b-row>
        </b-col>
      </b-row>
      <DataIdentity :data="currentData"/>
    </b-modal>
  </b-container>
</template>

<script>
  import moment from 'moment';
  export default {
    data () {
      return {
        title:"COMPANY COVERAGE",
        loading: false,
        fields: [
          { key: 'company.name', label:"COMPANY", sortable: false},
          { key: 'policy_no', label:"COVERAGE NUMBER", sortable: true},
          { key: 'policy_date', label:"START DATE", sortable: true, date:true},
          { key: 'policy_end_date', label:"END DATE", sortable: true, date:true},
          { key: 'is_active', label:"ACTIVE", sortable: true },
          { key: 'created_at', label:"CREATED AT", sortable: true, datetime:true},
          { key: 'updated_at', label:"UPDATED AT", sortable: true, datetime:true},
          { key: 'action',label:"ACTION",tdClass:"columnActionStyle",thClass:"columnActionStyle" }
        ],
        companySelectData:{page:1, pages:1, total:0, limit:10, docs: []},
        tableData : {
          page:1,
          pages:1,
          total:0,
          limit:10,
          docs: [
          ],
        },
        search:"",
        currentData:{
          insurance_product:{},
          user:{}
        },
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
      this.loadCompany(1,"","",10,"");
    },

    methods: {
      async loadItems(page,sortBy,sortDesc,limit,search){   
        this.search = search;
        this.$router
          .replace({ query: { ...this.$route.query, p: page, sb:sortBy ,sd:sortDesc,l:limit,s:search } })
          .catch(() => {});

        this.$emit('showLoading', true);
        var response = await this.$http('get', `/company_policy?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.tableData = response.data;
          this.search = search;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadCompany(page,sortBy,sortDesc,limit,search){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/company/selection?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.companySelectData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      onCreateNew(){
        this.currentData = {};
        this.confirmPassword = "";
        this.$refs['formEdit'].show()
      },

      async onEdit(data){
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/company_policy/detail/${data._id}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.currentData = response.data;
          this.currentData.policy_date = moment(this.currentData.policy_date).toDate();
          this.currentData.policy_date_end = moment(this.currentData.policy_date_end).toDate();          
          this.$refs['formEdit'].show()
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async onDelete(data){
        this.$emit('showLoading', true);
        var response = await this.$http('delete', `/company_policy/${data._id}`);
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
        var response = await this.$http(Boolean(this.currentData._id)?"post":"put", `/company_policy`,this.currentData);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.currentData = {};
          this.$refs['formEdit'].hide()
          this.$emit('showAlert',response.message, "info");                        
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
