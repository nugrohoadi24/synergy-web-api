<template>
  <b-container fluid>
    <DataTable ref="dataTable" v-bind:title="title"  
                v-bind:tableData="tableData"  
                v-bind:fields="fields" 
                v-on:loadItems="loadItems" 
                v-on:onEdit="onEdit"
                v-on:onView="onView"
                :search="search"
                :actionCreate="false"
                :actionView=false
                :actionDelete=false
                :actionEdit=false
                style="margin-top:10px">  

      <!-- <template v-slot:headerbar>
        <div style="padding-left:20px">
          <b-form-radio-group
            v-model="selectedStatus"
            button-variant="outline-primary"
            size="sm"
            name="radio-btn-outline"
            @change="statusChange"
            buttons/>      
        </div>
      </template> -->

      <template v-slot:actionButton1="data">
        <b-button title="PROCESS" variant="danger" @click="onProcess(data.item)" size="sm" style="margin-left:3px;display:inline-block">
          <b-icon icon="gear" aria-hidden="true" ></b-icon>
        </b-button>
      </template>
    </DataTable>
  </b-container>
</template>

<script>
  import moment from 'moment';
  export default {
    data () {
      return {
        title:"PENDING CLAIM",
        loading: false,
        fields: [
          { key: 'form_participant_user_id', label:"PARTICIPANT SH ID", sortable: true},
          { key: 'policy_data.card_no', label:"CARD NO", sortable: true},
          { key: 'form_type', label:"METHOD", sortable: true},
          { key: 'policy_data.product_type', label:"PRODUCT TYPE", sortable: true},
          { key: 'form_participant_name', label:"PARTICIPANT NAME", sortable: true},
          { key: 'policy_data.certificate_no', label:"CERTIFICATE NO", sortable: true},          
          { key: 'form_claim_no', label:"CLAIM TICKET NO", sortable: true},
          { key: 'form_status', label:"CLAIM STATUS", sortable: true },
          { key: 'created_at', label:"CREATED AT", sortable: true, datetime:true},
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
        search:"",
        productType:"",
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
          .replace({ query: { ...this.$route.query,p: page,sb:sortBy,sd:sortDesc,l:limit,s:search} })
          .catch(() => {});

        this.$emit('showLoading', true);
        var response = await this.$http('get', `/digital_form?page=${page}&perpage=${limit}&searchquery=${search}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.tableData = response.data

          var getProductType = this.tableData.docs
          getProductType.forEach(item => {
            if(item.policy_data.product_type == "1") {
              item.policy_data.product_type = "SALVUSCARE"
            } else {
              item.policy_data.product_type = "INSURANCE CLAIM"
            }
          })
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      onEdit(data){
       
      },

      onView(data){
        
      },

      onProcess(data){
        this.$router.push({ path: 'claim_process_pending', query: { id: data._id, method:data.cashless }});
      },
      
      async statusChange(){
        this.$refs['dataTable'].reloadItems();
      }
    }
  }
</script>

<style>
 
   
  .editRow {
    margin-top:15px;
  }
</style>
