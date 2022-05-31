<template>
  <div>
    <b-input-group size="sm" >
      <b-form-input readonly  type="search" placeholder=" - select - " v-model="selectedItemLocal[this.text_field]" @click="showPicker"></b-form-input>      
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

        <b-list-group style="margin-bottom:5px">
          <b-list-group-item style="padding-top:5px;padding-bottom:5px"  @click="onItemSelect(null)"> - Select - </b-list-group-item>
          <b-list-group-item style="padding-top:5px;padding-bottom:5px;height:30px" v-for="item in items.docs" :key="item[value_field]" @click="onItemSelect(item)" >{{item[text_field]}}</b-list-group-item>
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
</template>

<script>
  var extend = require('util')._extend;
  export default {
    props: ['items','value_field','text_field','selectedItem'],  
    slots: ['formEdit'],
    computed: {
      selectedItemLocal: function () {
        if(Boolean(this.selectedItem))
          return this.selectedItem;
        else 
          return {}
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
        this.$emit('update:selectedItem', data);
        this.$emit('onItemselect', data);
        this.$refs['pickerDlg'].hide();
      }
    }
  }
</script>

<style>
 
</style>