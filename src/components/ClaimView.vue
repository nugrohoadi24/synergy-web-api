<template>
  <b-container fluid>
    <DataTable ref="dataTable" v-bind:title="title"  
                v-bind:tableData="tableData"  
                v-bind:fields="fields" 
                v-on:loadItems="loadItems" 
                v-on:onEdit="onEdit"
                v-on:onCreateNew="onCreateNew"
                :search="search"
                :actionDelete=false
                style="margin-top:10px">  
    </DataTable>      
  </b-container>
</template>

<script>
  import moment from 'moment';
  export default {
    data () {
      return {
        title:"Data Claim",
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
                return moment(value).format('DD MMM YYYY hh:mm:ss');
              }
          },
          { key: 'updated_at', label:"Updated At", sortable: true , 
              formatter: (value, key, item) => {
                return moment(value).format('DD MMM YYYY hh:mm:ss');
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
        search:""
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
        var response = await this.$http('get', `/claim?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.tableData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      onCreateNew(){
        this.$router.push({ path: 'claim_create'})
      },

      onEdit(data){
        this.$router.push({ path: 'claim_create', query: { id: data._id } })
      },

      onView(data){
        this.$router.push({ path: 'claim_input?action=VIEW', query: { id: data._id } })
      },

    }
  }
</script>

<style>
 
   
  .editRow {
    margin-top:15px;
  }
</style>
