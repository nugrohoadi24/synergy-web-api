<template>
  <DataTable v-bind:title="title"  
              v-bind:tableData="tableData"  
              v-bind:fields="fields" 
              v-on:loadItems="loadItems" 
              v-on:onDelete="onDelete" 
              v-on:onEdit="onEdit" 
              style="margin-top:10px">
              
    <template #editForm="data" >
      <b-container fluid>
        <b-row class="my-1" >
          <b-col sm="3">
            <label>userId</label>
          </b-col>
          <b-col sm="9">
            <b-form-input v-model="data.currentData.userid"></b-form-input>
          </b-col>          
        </b-row>
        <b-row class="my-1" style="margin-top:10px">
          <b-col sm="3">
            <label>name</label>
          </b-col>
          <b-col sm="9">
            <b-form-input v-model="data.currentData.name"></b-form-input>
          </b-col>          
        </b-row>
      </b-container>
    </template>
  </DataTable>  
</template>

<script>
  export default {
    data () {
      return {
        title:"Master User",
        loading: false,
        fields: [
          { key: 'userid', label:"user id", sortable: true },
          { key: 'name', label:"name", sortable: true },
          { key: 'action',label:"Action",tdClass:"columnActionStyle",thClass:"columnActionStyle" }
        ],
        tableData : {
          page:1,
          pages:1,
          total:0,
          limit:10,
          docs: [
          ]
        }
      }
    },
    async created () {
      this.loadItems(1,"","",10,"");
    },

    methods: {
      async loadItems(page,sortBy,sortDesc,limit,search){   
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
      onEdit(data){
        console.log(data);

      },
      onDelete(data){
        console.log(data);
      }

    }
  }
</script>

<style>
  .columnActionStyle {
    max-width: 90px;
    width: 90px;
    padding-right: 10px;
    padding-left: 10px;
  }
</style>
