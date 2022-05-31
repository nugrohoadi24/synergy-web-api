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
    
    <b-modal ref="formEdit" hide-header size="xl" scrollable lazy centered 
      :ok-disabled="!this.updateEnable" ok-title="SAVE" cancel-title="CANCEL" @ok="saveData">
      <b-row> 
        <b-col sm="6">
          <MyInputText label="USER ID" :value.sync="currentData.userId" mx=50 mandatory/> 
          <MyInputText label="NAMA" :value.sync="currentData.nama" mx=150 mandatory/> 
          <MyInputText label="EMAIL" :value.sync="currentData.email" mx=50 /> 
          <MyInputText label="NIK" :value.sync="currentData.nik" mx=16 :inputNumber=true /> 
          <MyInputText label="PHONE " :value.sync="currentData.phone" mx=30 :inputNumber=true /> 
          <MyInputText label="HANDPHONE" :value.sync="currentData.handphone" mx=30 :inputNumber=true /> 
          <MyInputDate label="DOB" :value.sync="currentData.dob"/> 

          <b-row class="editRow" >
            <b-col sm="3">
              <label>JENIS KELAMIN</label>
            </b-col>
            <b-col sm="9">
              <b-form-radio-group
                v-model="currentData.gender"
                size="sm"
                :options="genderOption"
                name="radio-btn-outline"
                button-variant="outline-primary"
                buttons></b-form-radio-group>
            </b-col>          
          </b-row>

          <b-row class="editRow" >
            <b-col sm="3">
              <label>PASSWORD</label>
            </b-col>
            <b-col sm="9">
              <b-form-input v-model="currentData.password"></b-form-input>
            </b-col>          
          </b-row>

          <b-row class="editRow" >
            <b-col sm="3">
              <label>CONFIRM PASSWORD</label>
            </b-col>
            <b-col sm="9">
              <b-form-input v-model="currentData.confirmPassword"></b-form-input>
            </b-col>          
          </b-row>
        </b-col>

        <b-col sm="6">
          <MyInputText label="NAMA BANK" :value.sync="currentData.bank_name" mx=50 />  
          <MyInputText label="NO REKENING" :value.sync="currentData.bank_acc_no" mx=15 />  
          <MyInputText label="REKENING A/N" :value.sync="currentData.bank_account_name" mx=50 />  

          <MyInputSearchableSelect label="COMPANY" :value.sync="currentData.company" v-on:loadItems="loadCompany" 
            :items="companySelectData" value_field="code" text_field="name" /> 

          <MyInputTextArea label="ADDRESS" :value.sync="currentData.address" mx=500 mandatory/> 

          <MyInputSearchableSelect label="PROVINSI" :value.sync="currentData.province" v-on:loadItems="loadProvince" 
            :items="provinceData" value_field="code" text_field="name" /> 

          <MyInputSearchableSelect label="KOTA" :value.sync="currentData.city" v-on:loadItems="loadCity" 
            :items="cityData" value_field="code" text_field="name" /> 

          <MyInputSearchableSelect label="KECAMATAN" :value.sync="currentData.district" v-on:loadItems="loadDistrict" 
            :items="districtData" value_field="code" text_field="name" /> 

          <MyInputSearchableSelect label="KELURAHAN" :value.sync="currentData.subdistrict" v-on:loadItems="loadSubdistrict" 
            :items="subdistrictData" value_field="code" text_field="name" /> 

          <MyInputText label="KODE POS" :value.sync="currentData.zipcode" mx=5 :inputNumber=true />  
          

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
      <DataIdentity :data="currentData"/>

    </b-modal>
  </b-container>
</template>

<script>
  import moment from 'moment';
  export default {
    data () {
      return {
        title:"INDIVIDUAL MEMBER",
        loading: false,
        fields: [
          { key: 'userId', label:"USER ID", sortable: true,  },
          { key: 'nama', label:"NAMA", sortable: true,},
          { key: 'email', label:"EMAIL", sortable: true,  },
          { key: 'handphone', label:"HANDPHONE", sortable: true,  },
          { key: 'company.name', label:"COMPANY", sortable: true,},
          { key: 'is_active', label:"ACTIVE", sortable: true },
          { key: 'created_at', label:"CREATED AT", sortable: true, datetime:true},
          { key: 'updated_at', label:"UPDATED AT", sortable: true, datetime:true},
          { key: 'action',label:"ACTION",tdClass:"columnActionStyle",thClass:"columnActionStyle" }
        ],
        genderOption: [
          { text: 'PRIA', value: 'M' },
          { text: 'WANITA', value: 'F' },
          { text: 'KOSONG', value: '' }
        ],
        tableData : { 
          page:1,
          pages:1,
          total:0,
          limit:10,
          docs: [
          ]
        },
        currentData:{
          is_active: true
        },
        companySelectData:{page:1, pages:1, total:0, limit:10, docs: []},
        provinceData:{page:1, pages:1, total:0, limit:10, docs: []},
        cityData:{page:1, pages:1, total:0, limit:10, docs: []},
        districtData:{page:1, pages:1, total:0, limit:10, docs: []},
        subdistrictData:{page:1, pages:1, total:0, limit:10, docs: []},
        confirmPassword:""
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

      await this.loadItems(page?page:1,sortBy?sortBy:"created_at",sortDesc=="true",limit?limit:10,search?search:"")
      this.loadCity(1,"","",10,"");
      this.loadProvince(1,"","",10,"");
      this.loadDistrict(1,"","",10,"");
      this.loadSubdistrict(1,"","",10,"");

      this.loadCompany(1,"","",10,"");
    },

    methods: {
      async loadItems(page,sortBy,sortDesc,limit,search){   
        this.search = search;
        this.$router
          .replace({ query: { ...this.$route.query, p: page, sb:sortBy ,sd:sortDesc,l:limit,s:search } })
          .catch(() => {});

        this.$emit('showLoading', true);
        var response = await this.$http('get', `/user?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.tableData = response.data;
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

        async loadProvince(page,sortBy,sortDesc,limit,search){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/province?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.provinceData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadCity(page,sortBy,sortDesc,limit,search){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/city?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.cityData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadDistrict(page,sortBy,sortDesc,limit,search){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/district?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.districtData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadSubdistrict(page,sortBy,sortDesc,limit,search){
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/subdistrict?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.subdistrictData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },


      onCreateNew(){
        this.currentData = {};
        this.$refs['formEdit'].show()
      },

      async onEdit(data){
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/user/detail/${data._id}`);
        this.$emit('showLoading', false);        
        if(response.is_ok){
          console.log('res', response)
          this.currentData = response.data;
          this.currentData.confirmPassword = null;
          this.currentData.password = null;
          
          //this.currentData.dob = moment(this.currentData.dob).toDate();
          this.$refs['formEdit'].show()
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async onDelete(data){
        this.$emit('showLoading', true);
        var response = await this.$http('delete', `/user/${data._id}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.$refs.dataTable.reloadItems();
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }

      },

      async saveData(bvModalEvt){   
        bvModalEvt.preventDefault();
    
        var errmsg = "";
        if(!Boolean(this.currentData.nama))
          errmsg += "* Silahkan input nama  \r\n";

        if(!Boolean(this.currentData.userId))
          errmsg += "* Silahkan input userid \r\n";

        if(!Boolean(this.currentData._id) && !Boolean(this.currentData.password ))
          errmsg += "* Silahkan input password \r\n";

        if(Boolean(this.currentData.password) && Boolean(this.currentData.confirmPassword) &&  (this.currentData.password !== this.currentData.confirmPassword)) 
          errmsg += "* Password dan confirm password tidak sama \r\n";


        if(Boolean(errmsg)) {
          this.$emit('showMessage',errmsg, "info");                        
          return;
        }

        if(this.currentData.province !== null){
          this.currentData.province = String(this.currentData.province['code'])
        }
        if(this.currentData.city !== null){
          this.currentData.city = String(this.currentData.city['code'])
        }
        if(this.currentData.district !== null){
          this.currentData.district = String(this.currentData.district['code'])
        }
        if(this.currentData.subdistrict !== null){
          this.currentData.subdistrict = String(this.currentData.subdistrict['code'])
        }
        console.log('before save',this.currentData)
        
        this.$emit('showLoading', true);
        var response = await this.$http(Boolean(this.currentData._id)?"post":"put", `/user`,this.currentData);
        this.$emit('showLoading', false);
        console.log('after save',this.currentData)

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
