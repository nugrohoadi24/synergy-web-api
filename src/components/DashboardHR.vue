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
    
    <b-modal ref="formCreate" hide-header size="lg" scrollable lazy centered 
      :ok-disabled="!this.updateEnable" ok-title="SAVE" cancel-title="CANCEL" @ok="createData">
        <b-row class="editRow" >
          <b-col sm="12">
            <MyInputText label="NAMA :" :value.sync="currentData.name" mx=100 mandatory />
            
            <MyInputText label="EMAIL :" :value.sync="currentData.email" mx=100 mandatory />

            <MyInputSearchableSelect label="COMPANY" :value.sync="currentData.company" v-on:loadItems="loadCompany" 
            :items="companySelectData" value_field="code" text_field="name" mandatory/>

            <MyInputText label="PASSWORD :" :value.sync="currentData.password" mx=100 mandatory />

            <MyInputText label="CONFIRM PASSWORD :" :value.sync="currentData.confirm_password" mx=100 mandatory />
          
            <b-row class="editRow" >
                <b-col sm="3">
                <label>ACTIVE</label>
                </b-col>
                <b-col sm="9">
                <b-form-checkbox v-model="currentData.is_active"></b-form-checkbox>
                </b-col>          
            </b-row>
          </b-col>
        </b-row>
    </b-modal>

    <b-modal ref="formEdit" hide-header size="lg" scrollable lazy centered 
      :ok-disabled="!this.updateEnable" ok-title="SAVE" cancel-title="CANCEL" @ok="saveData">
        <b-row class="editRow" >
          <b-col sm="12">
            <MyInputText label="NAMA :" :value.sync="currentData.name" mx=100 mandatory />
            
            <MyInputText label="EMAIL :" :value.sync="currentData.email" mx=100 mandatory />

            <MyInputSearchableSelect label="COMPANY" :value.sync="currentData.company" v-on:loadItems="loadCompany" 
            :items="companySelectData" value_field="code" text_field="name" mandatory/>

            <MyInputText label="PASSWORD :" :value.sync="currentData.password" mx=100 mandatory />

            <MyInputText label="CONFIRM PASSWORD :" :value.sync="currentData.confirm_password" mx=100 mandatory />
          
            <b-row class="editRow" >
                <b-col sm="3">
                <label>ACTIVE</label>
                </b-col>
                <b-col sm="9">
                <b-form-checkbox v-model="currentData.is_active"></b-form-checkbox>
                </b-col>          
            </b-row>
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
        title:"DASHBOARD HR",
        loading: false,
        customToolbar: [
          ["bold", "italic", "underline","link"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [
              { align: "" },
              { align: "center" },
              { align: "right" },
              { align: "justify" }
          ],          
        ],
        fields: [
          { key: 'name', label:"NAME", sortable: true,  },
          { key: 'email', label:"EMAIL", sortable: true,},
          { key: 'company.name', label:"COMPANY", sortable: true },
          { key: 'is_active', label:"ACTIVE", sortable: true },
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
        companySelectData:{page:1, pages:1, total:0, limit:10, docs: []},
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
        var response = await this.$http('get', `/human_resource/list_hr?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.tableData = response.data;

          this.tableData.docs.forEach( item => {
              if(item.is_active == true){
                  item.is_active = 'ACTIVE'
              } else {
                  item.is_active = 'EXPIRED'
              }
          })
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadCompany(page,sortBy,sortDesc,limit,search){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/company?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.companySelectData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      onCreateNew(){
        this.currentData = {};
        this.$refs['formCreate'].show()
      },

      async onEdit(data){
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/human_resource/detail/${data._id}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.currentData = response.data; 
          this.currentData.confirmPassword = null;
          this.currentData.password = null;

          this.$refs['formEdit'].show()
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }                    
      },

      async onDelete(data){
        this.$emit('showLoading', true);
        var response = await this.$http('delete', `/human_resource/delete/${data._id}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.$refs.dataTable.reloadItems();
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }

      },
      
      async createData(bvModalEvt){
        bvModalEvt.preventDefault();

        var errmsg =""
        if(Boolean(errmsg)) {
          this.$emit('showMessage',errmsg, "info");                        
          return;
        }

        this.$emit('showLoading', true);
        var response = await this.$http("post", `/human_resource/register_hr`,this.currentData);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.currentData = {};
          this.$refs['formCreate'].hide()
          this.$refs.dataTable.reloadItems();
        }else {
          this.$emit('showMessage',response.message, "danger");                        
        }
      },

      async saveData(bvModalEvt){
        bvModalEvt.preventDefault();

        var errmsg =""

        if(Boolean(errmsg)) {
          this.$emit('showMessage',errmsg, "info");                        
          return;
        }
        console.log('save', this.currentData)
        this.$emit('showLoading', true);
        var response = await this.$http("put", `/human_resource/update_hr/${this.currentData._id}`,this.currentData);
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

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

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