<template>
  <b-row class="editRow">
    <b-col sm="3">
      <label>{{label}} <font v-if="this.mandatory" style="color:red;margin-left:2px">*</font></label>
    </b-col>
    <b-col sm="9">
      <div>
        <b-input-group size="sm" >
          <b-form-input readonly  type="search" placeholder=" - select - " 
              v-model="valueLocal[this.text_field]" @click="showPicker"></b-form-input>      
          <b-input-group-prepend is-text @click="showPicker" size="sm" >
            <b-icon icon="caret-down-fill" size="sm" ></b-icon>
          </b-input-group-prepend>          
        </b-input-group>

        <b-modal ref="pickerDlg" hide-header hide-backdrop style="padding:5px" size="md" scrollable  lazy  centered hide-footer>      
          <div class="overflow-auto">
            <b-input-group size="sm" style="margin-bottom:10px">
              <b-input-group-prepend is-text @click="loadItems(1)">
                <b-icon icon="search"></b-icon>
              </b-input-group-prepend>          
              <b-form-input type="search" placeholder="Search terms" v-on:keyup.enter="loadItems(1)" v-model="search"></b-form-input>
            </b-input-group>

            <b-list-group style="margin-bottom:10px">
              <b-list-group-item style="padding-top:8px;padding-bottom:8px;background:#EFFFEA;font-weight:bold"  @click="onItemSelect(null)"> - Select - </b-list-group-item>
              <b-list-group-item 
                v-for="(item,index) in items.docs" :key="item[value_field]" 
                 v-bind:style="{background: ( index%2==0 ? '#FFFFFF' : '#F9F9F9'),height:'40px' ,'padding-top':'8px','padding-bottom':'8px'}"
                @click="onItemSelect(item)" >{{item[text_field]}}</b-list-group-item>
            </b-list-group>
          
            <b-pagination
              size="sm"
              pills align="right"
              v-model="items.page"
              :total-rows="items.total"
              :per-page="items.limit"
              @change="loadItems"
              aria-controls="my-table"></b-pagination>
          </div>
        </b-modal>
      </div>
    </b-col>          
  </b-row>
</template>

<script>
  var extend = require('util')._extend;

  export default {
    props: {
      label: {
        type: String
      },
      value_field: {
        type: String,
        default:"_id"
      },
      text_field: {
        type: String,
        default:"name"
      },
      mandatory: {
        default: false,
        type: Boolean
      },
      items: {
        type: Object
      },
      value: {
        type: Object
      }
    },

    computed: {
      valueLocal: {
        get: function () {
          if(Boolean(this.value))
            return this.value;
          else 
            return {}
        },
        set: function(value){
          this.$emit('update:value', value);

        }
      }
    },

    data () {
      return {
        currentData:{},
        loading: false,
        search:"",
        sortBy: '',
        sortDesc: false
      }
    },
    async created () {
      this.loadItems(1);      
    },

    methods: {
      async loadItems(page){   
          this.$emit('loadItems', page, "", "", this.items.limit, this.search);
      },

    async showPicker(){   
        this.$refs['pickerDlg'].show()
      },
      

      async reloadItems(){ 
          this.$emit('loadItems', this.items.page, this.items.sortBy, this.items.sortDesc, this.items.limit, this.search);
      },

      onItemSelect(data){
        this.$emit('update:value', data);
        this.$emit('onItemselect', data);
        this.$refs['pickerDlg'].hide();
      }
    }
  }
</script>

<style>
 
</style>