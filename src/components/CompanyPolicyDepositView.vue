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
    
    <b-modal ref="formEdit" hide-header size="lg" scrollable  lazy  centered 
      :ok-disabled="!(this.updateEnable || this.createEnable)" ok-title="SAVE" cancel-title="CANCEL" @ok="saveData">
      
        <MyInputSearchableSelect label="COMPANY COVERAGE" :value.sync="currentData.company_policy" v-on:loadItems="loadCompanyPolicy" 
          :items="companyPolicySelectData" value_field="_id" text_field="desc" v-if="!Boolean(currentData._id)" />

        <MyInputText label="COMPANY COVERAGE" :value.sync="currentData.company_policy.desc" disabled v-if="Boolean(currentData._id)"/> 

        <MyInputDate label="DEPOSIT DATE" :value.sync="currentData.transaction_date" mandatory :disabled="!this.updateEnable && Boolean(currentData._id)" /> 

        <b-row class="editRow" >
          <b-col sm="3">
            <label>AMOUNT</label>
          </b-col>
          <b-col sm="9">
            <money size="sm" class="form-control form-control-sm" v-bind="money"  v-model="currentData.amount" :disabled="!this.updateEnable && Boolean(currentData._id)"></money>
          </b-col>          
        </b-row>
        
        <MyInputTextArea label="NOTE" :value.sync="currentData.note" mx=200 /> 
      
        <DataIdentity :data="currentData"/>
    </b-modal>
  </b-container>
</template>

<script>
  import moment from 'moment';
  export default {
    data () {
      return {
        title:"DEPOSIT",
        loading: false,
        fields: [
          { key: 'company.name', label:"COMPANY", sortable: false},
          { key: 'company_policy.policy_no', label:"COVERAGE NUMBER", sortable: true},
          { key: 'transaction_date', label:"TRANS DATE", sortable: true, date:true},
          { key: 'amount', label:"DEPOSIT", sortable: true, number:true},          
          { key: 'created_at', label:"CREATED AT", sortable: true, datetime:true},
          { key: 'updated_at', label:"UPDATED AT", sortable: true, datetime:true},
          { key: 'action',label:"ACTION",tdClass:"columnActionStyle",thClass:"columnActionStyle" }
        ],
        companyPolicySelectData:{page:1, pages:1, total:0, limit:10, docs: []},
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
          user:{},
          company_policy : {}
        },
        money: {
          decimal: '.',
          thousands: ',',
          precision: 0
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

      if(!Boolean(sortDesc))
        sortDesc = 'true';

      this.loadItems(page?page:1,sortBy?sortBy:"created_at",sortDesc=="true",limit?limit:10,search?search:"");
      this.loadCompanyPolicy(1,"","",10,"");
    },

    methods: {
      async loadItems(page,sortBy,sortDesc,limit,search){   
        this.search = search;
        this.$router
          .replace({ query: { ...this.$route.query, p: page, sb:sortBy ,sd:sortDesc,l:limit,s:search } })
          .catch(() => {});

        this.$emit('showLoading', true);
        var response = await this.$http('get', `/deposit?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.tableData = response.data;
          this.search = search;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadCompanyPolicy(page,sortBy,sortDesc,limit,search){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/company_policy/selection/all?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.companyPolicySelectData = response.data;
          console.log(JSON.stringify(this.companyPolicySelectData));
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
        var response = await this.$http('get', `/deposit/detail/${data._id}`);
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
        var response = await this.$http('delete', `/deposit/${data._id}`);
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
        var response = await this.$http(Boolean(this.currentData._id)?"post":"put", `/deposit`,this.currentData);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.currentData = {};
          this.$refs['formEdit'].hide()
          if(response.message)
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
