<template>
  <b-container fluid>
    <div class="d-flex justify-content-end align-middle" style="margin-top:10px;margin-right:15px">
      <label class="inputLabel">Filter status</label>
      <b-form-radio-group
        v-model="selectedStatus"
        :options="statusOption"
        button-variant="outline-primary"
        size="sm"
        name="radio-btn-outline"
        @change="statusChange"
        buttons/>      
    </div>

    <DataTable ref="dataTable" v-bind:title="title"  
                v-bind:tableData="tableData"  
                v-bind:fields="fields" 
                v-on:loadItems="loadItems" 
                v-on:onEdit="onEdit"
                v-on:onProcess="onProcess"
                :search="search"
                :actionEdit=false
                :actionView=true
                :actionDelete=false
                :actionCreate=false
                :actionProcess=true
                style="margin-top:10px">  
    </DataTable>      
  </b-container>
</template>

<script>
  import moment from 'moment';
  export default {
    data () {
      return {
        title:"Process data Claim",
        loading: false,
        fields: [
          { key: 'cashless', label:"Cashless", sortable: true},
          { key: 'user.nama', label:"Member", sortable: true},
          { key: 'policy.certificate_no', label:"Certificate No", sortable: true},          
          { key: 'claim_no', label:"Claim Code", sortable: true},
          { key: 'claim_total_amount', label:"Claim Amount", sortable: true},
          { key: 'claim_date', label:"Claim Date", sortable: true },
          { key: 'claim_status', label:"Status", sortable: true },
          { key: 'created_at', label:"Created At", sortable: true, 
              formatter: (value, key, item) => {
                if(Boolean(value))
                  return moment(value).format('DD MMM YYYY hh:mm:ss');
                else
                  return "";
              }          
          },
          { key: 'updated_at', label:"Updated At", sortable: true , 
              formatter: (value, key, item) => {
                if(Boolean(value))
                  return moment(value).format('DD MMM YYYY hh:mm:ss');
                else
                  return "";
              }          
          },
          { key: 'action',label:"Action",tdClass:"columnActionStyle",thClass:"columnActionStyle" }
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
        statusOption: [
          { text: 'All', value: '' },
          { text: 'New Claim', value: 'CREATED' },
          { text: 'Processed', value: 'PROCESSED' },
          { text: 'Rejected', value: 'REJECTED' }
        ],
      }
    },
    async created () {
      var page = this.$route.query.p;
      var sortBy = this.$route.query.sb;
      var sortDesc = this.$route.query.sd;
      var limit = this.$route.query.l;      
      var search = this.$route.query.s;
    
      this.loadItems(page?page:1,sortBy?sortBy:"",sortDesc=="true",limit?limit:10,search?search:"");
    },

    methods: {
      async loadItems(page,sortBy,sortDesc,limit,search){   
        this.search = search;
        this.$router
          .push({ query: { ...this.$route.query, p: page, sb:sortBy ,sd:sortDesc,l:limit,s:search } })
          .catch(() => {});

        this.$emit('showLoading', true);
        var response = await this.$http('get', `/claim/processed/list?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        console.log(response);
        if(response.is_ok){
          this.tableData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      onProcess(data){
        this.$router.push({ path: 'claim_process'})
      },

      onEdit(data){
        this.$router.push({ path: 'claim_process', query: { id: data._id } })
      },

      onView(data){
        this.$router.push({ path: 'claim_process', query: { id: data._id } })
      },

    }
  }
</script>

<style>
 
   
  .editRow {
    margin-top:15px;
  }
</style>
