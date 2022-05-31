<template>
  <div class="container-fluid">

    <b-row style="margin-bottom:5px">
      <b-col md="8">
        <table>
          <tr>
            <td>
              <h5 class="h4" style="font-weight:bold" >{{this.title}}</h5>
            </td>
          </tr>
          <tr>
            <td>
              <slot name="headerbar"></slot>
            </td>
          </tr>
        </table>          
      </b-col>      


      <b-col md="4" class="d-flex justify-content-end align-middle">
        <table border="0px" >
          <tr>
            <td style="padding-right:10px">
              <b-button variant="danger" size="sm" style="width:100px"
              @click="onCreateNew" v-if="actionCreate">{{this.createTitle}}</b-button>
            </td>
            <td>
              <b-input-group size="sm" style="width:250px">
                <b-input-group-prepend is-text @click="loadItems(1)">
                  <b-icon icon="search"></b-icon>
                </b-input-group-prepend>          
                <b-form-input type="search" placeholder="Search terms" v-on:keyup.enter="loadItems(1)" v-model="search"></b-form-input>
              </b-input-group>
            </td>
          </tr>
        </table>
      </b-col>
    </b-row>

    <div class="overflow-auto">
      <b-table
        :sticky-header=false
        id="my-table" 
        :items="localTableData.docs" 
        head-variant="light" 
        :striped=true
        :bordered=true
        :fields="fields"
        @sort-changed="sortChanged"
        small
        style="font-size:0.9em"
        responsive="sm">

        <template  #cell(action)="row" style="white-space:nowrap" >
          <div style="border:0px;white-space:nowrap;" class="d-flex justify-content-start align-middle">
            <b-button title="Edit" size="sm" variant="success" style="margin-left:3px;" 
              @click="onEdit(row.item)" v-if="actionEdit" >
              <b-icon icon="pencil-fill" aria-hidden="true"></b-icon>
            </b-button>
            <b-button title="Delete" variant="danger" size="sm" style="margin-left:3px;" 
              @click="onDelete(row.item)" v-if="actionDelete" >
              <b-icon icon="trash-fill" aria-hidden="true"></b-icon>
            </b-button>
            <b-button title="View" variant="info" size="sm" style="margin-left:3px;" 
              @click="onView(row.item)" v-if="actionView" >
              <b-icon icon="eye" aria-hidden="true"></b-icon>
            </b-button>
            <slot name="actionButton1"  v-bind:item="row.item"></slot>
          </div>
        </template>
      </b-table>
     
      <b-pagination
        pills align="right"
        v-model="localTableData.page"
        :total-rows="total"
        :per-page="limit"
        limit=10
        @change="loadItems"/>
    </div>  

  </div>
</template>

<script>
  var extend = require('util')._extend;
  import moment from 'moment';
  export default {
    props: {
      actionCreate: {
        default: true,
        type: Boolean
      },
      actionView: {
        default: false,
        type: Boolean
      },
      actionDelete: {
        default: true,
        type: Boolean
      },
      actionEdit: {
        default: true,
        type: Boolean
      },
      fields : {
        type: Array
      },
      tableData : {
        type: Object
      },
      title : {
        type: String
      },
      search :{
        type: String
      },
      createTitle :{
        type: String,
        default:"CREATE"
      }
      
    },
    slots: ['formEdit'],
    computed: {
      localTableData:{
        get: function () {
          return this.tableData;
        }
      },
      limit:{
        get: function () {
          if(Boolean(this.tableData.limit))
            return this.tableData.limit;
          else
            return 10;
        }
      },

      total:{
        get: function () {
          if(Boolean(this.tableData.total))
            return this.tableData.total;
          else
            return 10000000;
        }
      },
      

    },
    data () {
      return {
        loading: false,
        sortBy: null,
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

        if(field.date){
          field.formatter= (value, key, item) => {
            if(Boolean(value))
              return moment(value).format('DD/MM/YYYY');
            else
              return "";
          }
        } else if (field.number){
          field.formatter= (value, key, item) => {
            if(Boolean(value)){
              let val = (value/1).toFixed(0).replace('.', ',')
              return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
            }
            else
              return "";
          }
        } else if (field.datetime){
          field.formatter= (value, key, item) => {
            if(Boolean(value))
              return moment(value).format('DD/MM/YYYY hh:mm:ss');
            else
              return "";
          }
        }

      }
    },

    methods: {
      async loadItems(page){   
        if(!Boolean(this.sortBy))
          this.sortBy = 'created_at'          
        this.$emit('loadItems', page, this.sortBy, this.sortDesc, this.tableData.limit, this.search);
      },

      async reloadItems(){   
          if(!Boolean(this.sortBy))
            this.sortBy = 'created_at'          
          this.$emit('loadItems', this.tableData.page, this.sortBy, this.sortDesc, this.tableData.limit, this.search);
      },

      async sortChanged(ctx){   
        this.sortBy = ctx.sortBy;
        this.sortDesc = ctx.sortDesc;
        this.$emit('loadItems', this.tableData.page, this.sortBy, this.sortDesc, this.tableData.limit, this.search);
      },  

      onCreateNew(){
        this.$emit('onCreateNew');
      },

      onEdit(data){
        this.currentData = extend({}, data);
        this.$emit('onEdit',this.currentData);
      },
      onView(data){
        this.currentData = extend({}, data);
        this.$emit('onView',this.currentData);
      },

      onDelete(data){
        this.currentData =extend({}, data) ;        
        this.$bvModal.msgBoxConfirm('Apakah anda yakin untuk mendelete data?') 
        .then(value => {
          if(value)
            this.$emit('onDelete',this.currentData);
        })
        .catch(err => {
          // An error occurred
        })
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