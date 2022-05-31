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
     :ok-disabled="!this.updateEnable" ok-title="SAVE" cancel-title="CANCEL" @ok="checkBeforeSave">
      <b-row class="editRow" >
        <b-col sm="3">
          <label>TYPE <font style="color:red;margin-left:2px">*</font></label>
        </b-col>
        <b-col sm="9">
          <b-form-select v-model="currentData.type" :options="announcementType" value-field="value" text-field="text"></b-form-select>
        </b-col>          
      </b-row>        
      <MyInputText label="TITLE" :value.sync="currentData.title" mx=50 mandatory/> 
      <MyInputTextArea label="SHORT DESC" :value.sync="currentData.short_description" mx=200 mandatory/> 
      <MyInputTextArea label="DESCRIPTION" :value.sync="currentData.description" mx=1000 mandatory/> 
      <MyInputDate label="SHOW_AT" :value.sync="currentData.show_at" /> 


      <b-row class="editRow" >
        <b-col sm="3">
          <label>ACTIVE</label>
        </b-col>
        <b-col sm="9">
          <b-form-checkbox size="sm" v-model="currentData.is_active"></b-form-checkbox>
        </b-col>          
      </b-row>

    </b-modal>
    <b-modal id="attention" ref="attention" title="PERHATIAN"
      ok-title="Save" cancel-title="Cancel" @ok="saveData" >
      <p class="my-4">
        Apakah Anda yakin publikasi announcement? Akan lansung diterima user setelah Anda klik save
      </p>
    </b-modal>
  </b-container>
</template>

<script>
  import moment from 'moment';
  export default {
    data () {
      return {
        title:"ANNOUNCEMENT",
        loading: false,
        fields: [
          { key: 'title', label:"TITLE", sortable: true},
          { key: 'short_description', label:"SHORT DESC", sortable: true},
          { key: 'description', label:"DESC", sortable: true},
          { key: 'show_at', label:"SHOW AT", sortable: true, datetime:true},
          { key: 'type', label:"TYPE", sortable: true},
          { key: 'is_active', label:"ACTIVE", sortable: true },
          { key: 'created_at', label:"CREATED AT", sortable: true, datetime:true},
          { key: 'updated_at', label:"UPDATED AT", sortable: true, datetime:true},
          { key: 'action',label:"ACTION",tdClass:"columnActionStyle",thClass:"columnActionStyle" }
        ],
        announcementType: [
          { text: 'PROMO', value: 'PROMO' },
          { text: 'COMMUNITY', value: 'COMMUNITY' },
          { text: 'LAINNYA', value: 'OTHER' }
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
        today:''
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
    // mounted(){
    //   this.today = new Date();
    //   var dd = String(this.today.getDate()).padStart(2, '0');
    //   var mm = String(this.today.getMonth() + 1).padStart(2, '0');
    //   var yyyy = this.today.getFullYear();

    //   this.today = yyyy + '-' + mm + '-' + dd;
    // },
    methods: {
      async loadItems(page,sortBy,sortDesc,limit,search){   
        this.search = search;
        this.$router
          .replace({ query: { ...this.$route.query, p: page, sb:sortBy ,sd:sortDesc,l:limit,s:search } })
          .catch(() => {});

        this.$emit('showLoading', true);
        var response = await this.$http('get', `/announcement?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
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


      onEdit(data){
        this.currentData = data;        
        this.$refs['formEdit'].show()
      },

      async onDelete(data){
        this.$emit('showLoading', true);
        var response = await this.$http('delete', `/announcement/${data._id}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.$refs.dataTable.reloadItems();
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }

      },

      checkBeforeSave(){
        this.$refs['attention'].show()
      },

      async saveData(bvModalEvt){
        bvModalEvt.preventDefault();
        this.$emit('showLoading', true);
        var response = await this.$http(Boolean(this.currentData._id)?"post":"put", `/announcement`,this.currentData);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.currentData = {};
          this.$refs['formEdit'].hide();
          this.$refs['attention'].hide();
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
