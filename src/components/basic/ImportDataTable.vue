<template>
  <div class="container-fluid">
    <b-row style="margin-bottom:10px">
      <b-col align-self="start"><h5 class="h5" >{{this.title}}</h5></b-col>      

      <b-col md="1" align="end">
        <b-button pill variant="info" size="sm" @click="onRefresh">Refresh</b-button>
      </b-col>

      <b-col align-self="end"  md="3">
        <b-input-group size="sm"  >
          <b-input-group-prepend is-text @click="loadItems(1)">
            <b-icon icon="search"></b-icon>
          </b-input-group-prepend>          
          <b-form-input type="search" placeholder="Search terms" v-on:keyup.enter="loadItems(1)" v-model="search"></b-form-input>
        </b-input-group>
      </b-col>
    </b-row>

    <div class="overflow-auto">
      <b-table
        :sticky-header=false
        id="my-table" 
        :items="tableData.docs" 
        head-variant="light" 
        :striped=true
        :bordered=true
        :fields="fields"
        @sort-changed="sortChanged"
        no-local-sorting
        small
        responsive="sm">

        <template  #cell(action)="row" >
          <b-button-toolbar style="widthL:80px">
            <b-button-group class="mr-1">
              <b-button title="View" size="sm" variant="success" @click="onView(row.item)">
                <b-icon icon="eye" aria-hidden="true"></b-icon>
              </b-button>
            </b-button-group>
          </b-button-toolbar>
        </template>
      </b-table>
      
      <b-pagination
        size="sm"
        pills align="right"
        v-model="tableData.page"
        :total-rows="tableData.total"
        :per-page="tableData.limit"
        @change="loadItems"
        limit=10
        aria-controls="my-table"></b-pagination>
    </div>  
  </div>
</template>

<script>
  var extend = require('util')._extend;
  export default {
    props: ['title','tableData','fields'],
    slots: ['formEdit'],
    data () {
      return {
        loading: false,
        search:"",
        sortBy: '',
        sortDesc: false,
        currentData:{}
      }
    },
    async created () {
      for(var field of this.fields) {        
        if(field.key == 'action'){
          field.tdClass = 'text-center';
          field.thClass = 'text-center columnActionStyle';
        }
        else
          field.thClass = 'text-center';
      }
    },

    methods: {
      async loadItems(page){   
          this.$emit('loadItems', page, this.sortBy, this.sortDesc, this.tableData.limit, this.search);
      },

      async reloadItems(){   
          this.$emit('loadItems', this.tableData.page, this.sortBy, this.sortDesc, this.tableData.limit, this.search);
      },

      async sortChanged(ctx){   
        this.sortBy = ctx.sortBy;
        this.sortDesc = ctx.sortDesc;
        this.$emit('loadItems', this.tableData.page, this.sortBy, this.sortDesc, this.tableData.limit, this.search);
      },
      
      onRefresh(){
        this.$emit('onRefresh',1);
        this.$emit('loadItems', this.tableData.page, this.sortBy, this.sortDesc, this.tableData.limit, this.search);
      },

      onView(data){
        this.currentData = extend({}, data);
        this.$emit('onView',this.currentData);
      }
    }
  }
</script>

<style>
  .columnActionStyle {
    max-width: 100px;
    width: 100px;
  }
</style>