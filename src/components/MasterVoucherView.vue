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
        <b-row class="editRow" >
          <b-col sm="6">
            <MyInputText label="NAMA :" :value.sync="currentData.name" mx=100 mandatory />  

            <MyInputTextArea label="DESKRIPSI SINGKAT :" :value.sync="currentData.short_description" mx=500 mandatory />  

            <MyInputText label="MASA PAKET :" :value.sync="currentData.packet_days" mx=5 :inputNumber=true /> 

            <MyInputText label="MASA BERLAKU :" :value.sync="currentData.limit_days" mx=5 :inputNumber=true /> 

            <MyInputText label="HARGA :" :value.sync="currentData.price" mx=20 :inputNumber=true /> 

            <MyInputDate label="TGL BERAKHIR" :value.sync="currentData.end_date" mandatory /> 

            <b-row class="editRow">
              <b-col sm="3">
                <label>KATEGORI <font style="color:red;margin-left:2px">*</font></label>
              </b-col>
              <b-col sm="9">
              <multiselect  
                :preselect-first="true"
                label="name"
                :multiple=true
                :close-on-select=false
                :clear-on-select=false
                placeholder="Pick some" 
                v-model="currentData.category"
                track-by="_id"
                 :options="categorySelectData"></multiselect>
              </b-col>          
            </b-row>

            <MyInputSearchableSelect label="PROVIDER" :value.sync="currentData.provider" v-on:loadItems="loadHospital" 
                :items="hospitalSelectData" value_field="_id" text_field="name" /> 
          </b-col>

          <b-col sm="6">

            <b-row class="editRow" >
              <b-col sm="12">
                <label>DESKRIPSI <font style="color:red;margin-left:2px">*</font></label>
              </b-col>
            </b-row>

            <b-row class="editRow">
              <b-col sm="12">
                <VueEditor id="editor"  :editorToolbar="customToolbar" v-model="currentData.description"/>
              </b-col>          
            </b-row>



            <b-row class="editRow">
              <b-col sm="3">
                <label  @click="onViewWallet('WALLET')" class="link" >Wallet Count <b>{{currentData.wallet_count}}</b></label>
              </b-col>          
              <b-col sm="3">
                <label  @click="onViewWallet('PURCHASED')" class="link">Purchase Count <b>{{currentData.purchase_count}}</b></label>
              </b-col>          
              <b-col sm="3">
                <label class="link" @click="onViewWallet('INTRANSACTION')">Intransaction  Count <b>{{currentData.intransction_count}}</b></label>
              </b-col>                        
            </b-row>


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

    </b-modal>
  </b-container>
</template>

<script>
  import moment from 'moment';
  export default {
    data () {
      return {
        title:"VOUCHER MANAGEMENT",
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
          { key: 'limit_days', label:"DAYS", sortable: true,},
          { key: 'end_date', label:"END DATE", sortable: true },
          { key: 'provider.name', label:"PROVIDER", sortable: true },
          { key: 'price', label:"PRICE", sortable: true },
          { key: 'wallet_count', label:"WALLET", sortable: true },
          { key: 'purchase_count', label:"PURCHASE", sortable: true },
          { key: 'redeem_count', label:"REDEEM", sortable: true },
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
        hospitalSelectData:{page:1,pages:1,total:0,limit:10,docs: []},
        categorySelectData:[],
        currentData:{}
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

      this.loadCategory(1,null,null,1000,"");
      this.loadItems(page?page:1,sortBy?sortBy:"created_at",sortDesc=="true",limit?limit:10,search?search:"");      
    },

    methods: {
      async loadItems(page,sortBy,sortDesc,limit,search){   
        this.search = search;
        this.$router
          .replace({ query: { ...this.$route.query, p: page, sb:sortBy ,sd:sortDesc,l:limit,s:search } })
          .catch(() => {});
          
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/voucher?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        console.log(JSON.stringify(response));
        if(response.is_ok){
          this.tableData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadHospital(page,sortBy,sortDesc,limit,search){  
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/hospital/selection_all?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          this.hospitalSelectData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadCategory(page,sortBy,sortDesc,limit,search){  
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/category/selection?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);
        
          console.log(JSON.stringify(response));
        if(response.is_ok){
          this.categorySelectData = response.data.docs;

        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },


      onCreateNew(){
        this.currentData = {};
        this.$refs['formEdit'].show()
      },

      async onViewWallet(status){
        this.$router.push({ path: 'voucher_wallet/', query: { voucherId: this.currentData._id,status:status } })
      },

      async onEdit(data){
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/voucher/detail/${data._id}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.currentData = response.data; 

          if(this.currentData){
              var cattemp = []
              for(var key in this.currentData.category) {
                  var cat = this.categorySelectData.find( e => e._id == this.currentData.category[key]);
                  cattemp.push({
                      _id:this.currentData.category[key],
                      name:cat.name
                  });
              }
              this.currentData.category = cattemp;
          }
          console.log(JSON.stringify(this.currentData));

          this.$refs['formEdit'].show()
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }                    
      },

      async onDelete(data){
        this.$emit('showLoading', true);
        var response = await this.$http('delete', `/voucher/${data._id}`);
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

        if(!Boolean(this.currentData.description))
          errmsg += "* Silahkan input deskripsi \r\n";


        if(!Boolean(this.currentData.category)) 
          errmsg += "* Silahkan input category  \r\n";

        if(!Boolean(this.currentData.provider)) 
          errmsg += "* Silahkan input provider  \r\n";

        if(!Boolean(this.currentData.limit_days)) 
          errmsg += "* Silahkan input masa berlaku dr tanggal beli  \r\n";

        if(!Boolean(this.currentData.price)) 
          errmsg += "* Silahkan input harga  \r\n";

        if(!Boolean(this.currentData.end_date)) 
          errmsg += "* Silahkan input harga  \r\n";


        if(Boolean(errmsg)) {
          this.$emit('showMessage',errmsg, "info");                        
          return;
        }

        this.$emit('showLoading', true);
        var response = await this.$http(Boolean(this.currentData._id)?"post":"put", `/voucher`,this.currentData);
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
