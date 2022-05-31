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
    
    <b-modal ref="formEdit" hide-header size="lg" scrollable lazy centered 
      :ok-disabled="!this.updateEnable" ok-title="SAVE" cancel-title="CANCEL" @ok="saveData">
      <b-row class="editRow" >
        <b-col sm="3">
          <label>USER ID</label>
        </b-col>
        <b-col sm="9">
          <b-form-input v-model="currentData.userid" :formatter="upperFormatter"></b-form-input>
        </b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="3">
          <label>NAME</label>
        </b-col>
        <b-col sm="9">
          <b-form-input v-model="currentData.name" :formatter="upperFormatter"></b-form-input>
        </b-col>          
      </b-row>

      
      <b-row class="editRow" >
        <b-col sm="3">
          <label>ROLE</label>
        </b-col>
        <b-col sm="9">
          <b-form-select v-model="currentDataRole" :options="roleData.docs" value-field="_id" text-field="name"></b-form-select>
        </b-col>          
      </b-row>

      <b-row class="editRow" >
        <b-col sm="3">
          <label>ACTIVE</label>
        </b-col>
        <b-col sm="9">
          <b-form-checkbox v-model="currentData.is_active"></b-form-checkbox>
        </b-col>          
      </b-row>

      <label style="font-size:12px;color:red">jika ingin mengubah password maka input password yg baru</label>
      <b-row class="editRow" >
        <b-col sm="3">
          <label>PASSWORD</label>
        </b-col>
        <b-col sm="9">
          <b-form-input type="password" v-model="currentData.password"></b-form-input>
        </b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="3">
          <label>CONFIRM PASSWORD</label>
        </b-col>
        <b-col sm="9">
          <b-form-input type="password" v-model="confirmPassword"></b-form-input>
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
        title:"USER MANAGEMENT",
        loading: false,
        fields: [
          { key: 'userid', label:"ADMIN ID", sortable: true,  },
          { key: 'name', label:"NAME", sortable: true,},
          { key: 'role.name', label:"ROLE", sortable: true },
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
      this.loadRole();
    },

    methods: {
      async loadItems(page,sortBy,sortDesc,limit,search){   
        this.search = search;
        this.$router
          .replace({ query: { ...this.$route.query, p: page, sb:sortBy ,sd:sortDesc,l:limit,s:search } })
          .catch(() => {});
          
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/admin?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        console.log(response);
        if(response.is_ok){
          this.tableData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadRole(search){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/role/selection?searchquery=${search}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.roleData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      onCreateNew(){
        this.currentData = {};
        this.confirmPassword = "";
        this.$refs['formEdit'].show()
      },


      onEdit(data){
        this.currentData = data;        
        this.confirmPassword = "";
        if(Boolean(data.role))
          this.currentDataRole = data.role._id;

        this.currentData.password = "";

        this.$refs['formEdit'].show()
      },

      async onDelete(data){
        this.$emit('showLoading', true);
        var response = await this.$http('delete', `/admin/${data._id}`);
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

        if(!Boolean(this.currentData.name))
          errmsg += "* Silahkan input nama  \r\n";

        if(!Boolean(this.currentData.userid))
          errmsg += "* Silahkan input userid \r\n";

        if(!Boolean(this.currentData._id) && !Boolean(this.currentData.password ))
          errmsg += "* Silahkan input password \r\n";

        if(this.currentData.password !== this.confirmPassword) 
          errmsg += "* Password dan confirm password tidak sama \r\n";

        if(!Boolean(this.currentDataRole)) 
          errmsg += "* Role harus di isi  \r\n";


        if(Boolean(errmsg)) {
          this.$emit('showMessage',errmsg, "info");                        
          return;
        }

        this.$emit('showLoading', true);
        this.currentData.role = this.currentDataRole;        
        var response = await this.$http(Boolean(this.currentData._id)?"post":"put", `/admin`,this.currentData);
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
