<template>
  <b-container fluid>
    <DataTable ref="dataTable" 
        v-bind:title="title"  
        :tableData="tableData"
        v-bind:fields="fields" 
        @loadItems="loadItems" 
        @onDelete="onDelete" 
        @onEdit="onEdit"
        @onCreateNew="onCreateNew"
        :search="search"
        :actionCreate="this.createEnable"
        :actionDelete=false
        :actionEdit=false
        style="margin-top:10px">  

      <template v-slot:actionButton1="data">
        <b-button :disabled="data.item.created_by != $auth.getTokenData().id" 
          title="Edit" variant="success" size="sm" style="margin-left:5px" @click="onEdit(data.item)">
          <b-icon icon="pencil-fill" aria-hidden="true" ></b-icon>
        </b-button>

        <b-button title="View" variant="primary" size="sm" style="margin-left:5px"  @click="onView(data.item)">
          <b-icon icon="eye" aria-hidden="true"></b-icon>
        </b-button>
      </template>                
    </DataTable>  
    
    <b-modal ref="formEdit" hide-header size="lg" scrollable  lazy  centered 
      :ok-disabled="!this.updateEnable" ok-title="Save" cancel-title="Cancel" @ok="saveData">            
      <b-row class="editRow" >
        <b-col sm="3">
          <label>ACTION</label>
        </b-col>
        <b-col sm="9">
          <b-form-select :disabled="Boolean(currentData._id)" v-if="this.$route.query.type!='F'" v-model="currentData.closure_action" :options="closure_action" value-field="key" text-field="name"></b-form-select>
          <b-form-select :disabled="Boolean(currentData._id)" v-if="this.$route.query.type=='F'" v-model="currentData.closure_action" :options="closure_finance_action" value-field="key" text-field="name"></b-form-select>
        </b-col>          
      </b-row>
      <MyInputTextArea label="Note" :value.sync="currentData.note" mx=500 mandatory/> 
    </b-modal>

    <b-modal ref="formView" hide-header size="lg" scrollable ok-only lazy  centered ok-title="Close" >            
      <b-row class="editRow" >
        <b-col sm="3">
          <label>ACTION</label>
        </b-col>
        <b-col sm="9">
          <label>{{currentData.closure_action_ref.name}}</label>
        </b-col>          
      </b-row>
      <b-row class="editRow" >
        <b-col sm="3">
          <label>NOTE</label>
        </b-col>
        <b-col sm="9">
          <label>{{currentData.note}}</label>
        </b-col>          
      </b-row>
    </b-modal>

  </b-container>
</template>

<script>
  export default {
    data () {
      return {
        title:"Claim Closure",
        loading: false,
        fields: [
          { key: 'closure_action_ref.name', label:"ACTION", sortable: true},
          { key: 'note', label:"NOTE", sortable: true},
          { key: 'created_at', label:"CREATED AT", date:true, sortable: true},
          { key: 'updated_at', label:"UPDATED AT", date:true, sortable: true},
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
        tableData : {},
        currentData:{
          closure_action_ref:{}
        },
        closure_action :[
          {key:"SPB_DITERIMA",name:"TAGIHAN DAN DOKUMEN PENDUKUNG DITERIMA (BELUM LENGKAP)"},
          {key:"SPB_DIKEMBALIIN_RS",name:"ISI DOKUMEN TIDAK SESUAI DENGAN PERAWATAN AKTUAL (TIDAK COCOK)"},
          {key:"TAGIHAN_DITERIMA",name:"HARD COPY TAGIHAN DAN DOKUMEN PENDUKUNG DITERIMA (LENGKAP)"},
          {key:"TAGIHAN_DIKEMBALIKAN_RS",name:"HARD COPY TAGIHAN DAN DOKUMEN PENDUKUNG DIKEMBALIKAN KE PROVIDER LAYANAN"},
          {key:"VERIFIKASI_SELESAI",name:"VERIFIKASI HARD COPY TAGIHAN DAN DOKUMEN PENDUKUNG TUNTAS"},
          {key:"FILLING",name:"HARD COPY LENGKAP DISERAHKAN KE DEPT. ADMIN UNTUK FILING"},
          {key:"TELAH_CLAIM_RS",name:"PERHITUNGAN FINAL DISAMPAIKAN KE PENANGGUNG"},
          {key:"LAINNYA",name:"LAINNYA, SEBUTKAN [kolom text]"},

        ],
        closure_finance_action :[
          {key:"DANA_CAIR",name:"DANA TERKONFIRMASI SIAP UNTUK PEMBAYARAN KE PROVIDER LAYANAN "},
          {key:"TELAH_DIBAYAR",name:"DIBAYARKAN KE PROVIDER LAYANAN/PESERTA"},
          {key:"LAINNYA_FINANCE",name:"LAINNYA, SEBUTKAN: [kolom text]"}
        ]
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

      /*if(this.$route.query.type='F'){
        this.closure_action = [];
        this.closure_finance_action.forEach(x=> 
          this.closure_action.push(x)
        );
      }*/

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
        var response = await this.$http('get', `/claim_closure/${this.$route.query.claimId}?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          for(var key in response.data.docs){
            var doc = response.data.docs[key];
            var tmp = this.closure_action.find(x => x.key == doc.closure_action);

            if(Boolean(tmp))
              doc.action_name = tmp.name;
            else{
              tmp = this.closure_finance_action.find(x => x.key == doc.closure_action);
              if(Boolean(tmp))
                doc.action_name = tmp.name;
            }
          }
          response.data.page = parseInt(response.data.page);
          response.data.limit = parseInt(response.data.limit);
          this.tableData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      onCreateNew(){
        this.currentData = {closure_action_ref:{}};
        this.$refs['formEdit'].show()
      },

      onGoBack () {
        this.$router.go(-1);
      },

      onEdit(data){
        this.currentData = data;        
        this.$refs['formEdit'].show()
      },

      onView(data){
        this.currentData = data;        
        this.$refs['formView'].show()
      },
      

      async onDelete(data){
        this.$emit('showLoading', true);
        var response = await this.$http('delete', `/claim_closure/${data._id}`);
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

        if(!Boolean(this.currentData.note))
          errmsg += "* Silahkan note  \r\n";

        if(!Boolean(this.currentData.closure_action))
          errmsg += "* Silahkan input action \r\n";

        if(Boolean(errmsg)) {
          this.$emit('showMessage',errmsg, "info");                        
          return;
        }

        this.currentData.user_claim = this.$route.query.claimId;

        this.$emit('showLoading', true);
        var response = await this.$http(Boolean(this.currentData._id)?"post":"put", `/claim_closure`,this.currentData);
        this.$emit('showLoading', false);

        if(response.is_ok){
        this.currentData = {closure_action_ref:{}};
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
