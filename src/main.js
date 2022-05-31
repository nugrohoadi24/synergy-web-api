// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import DataTable from '@/components/basic/DataTable'
import DataTableClaim from '@/components/basic/DataTableClaim'
import ImportDataTable from '@/components/basic/ImportDataTable'
import MyInputText from '@/components/basic/MyInputText'
import MyInputDate from '@/components/basic/MyInputDate'
import MyInputTextArea from '@/components/basic/MyInputTextArea'
import MyInputSearchableSelect from '@/components/basic/MyInputSearchableSelect'
import DataIdentity from '@/components/basic/DataIdentity'
import MyInputComboBox from '@/components/basic/MyInputComboBox'
import MyInputDateTime from '@/components/basic/MyInputDateTime'
import MyInputNumber from '@/components/basic/MyInputNumber'

import SearchableSelect from '@/components/basic/SearchableSelect'
import * as VueGoogleMaps from 'vue2-google-maps'
import money from 'v-money'
import draggable from "vuedraggable";

import router from './router'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import VueQRCodeComponent from 'vue-qr-generator'

import vue2Dropzone from 'vue2-dropzone'
import 'vue2-dropzone/dist/vue2Dropzone.min.css'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import axios from 'axios'
import moment from 'moment'
import { VueEditor } from "vue2-editor";
import {Multiselect} from 'vue-multiselect'										   

Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.config.productionTip = false

const client = axios.create({
  baseURL: process.env.API_BASE_URL,
  json: true
})

Vue.prototype.$showLoading = false;


Vue.prototype.$auth = {
  getToken(){
    let token = localStorage.getItem('token');
    return token;
  },

  getTokenData(){
    let token = localStorage.getItem('token');

    if (token) 
      return JSON.parse(atob(token.split('.')[1]));
    
    return null;
  },

  setToken(token){
    localStorage.setItem( 'token', token);
  },

  setAccess(accessObj){
    localStorage.setItem( 'access', JSON.stringify(accessObj));
  },

  getAccess(key){
    let access = localStorage.getItem('access');

    if (access) {
      var obj =  JSON.parse(access);
      return obj[key];
    }
  },

  removeToken(){
    localStorage.removeItem("token");
  }
}



Vue.filter('formatDate', function(value) {
  if (value) {
    return moment(String(value)).format('DD/MM/YYYY')
  }
})

Vue.filter('formatDateTime', function(value) {
  if (value) {
    return moment(String(value)).format('DD/MM/YYYY HH:mm:ss')
  }
})


Vue.filter('upper', function(value) {
  if (Boolean(value)) {
    return value.toUpperCase();
  }else
    return value;
})

const MyPlugin = {
  install(Vue, options) {
    Vue.prototype.formatThousandGroup = (value) => {
      let val = (value/1).toFixed(0).replace('.', ',')
      return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    },

    Vue.prototype.upperFormatter = (value) => {
      return value.toUpperCase();
    };

    Vue.prototype.onKeyPressKeepPosition = (evt) => {
      const el = evt.target;
        var sel = el.selectionStart;
        sel++;
        setTimeout(() => {
          el.setSelectionRange(sel, sel);
        })       
    };

    Vue.prototype.formatUnitName = (value,period,unitName="") => {
      if(Boolean(value)){
        var periodName = "";
        if(period.toUpperCase() == 'YEAR')
            periodName = "TAHUN";
        else if(period.toUpperCase() == 'SEMESTER')
            periodName = "SEMESTER";
        else if(period.toUpperCase() == 'QUARTER')
            periodName = "3 BULAN"
        else if(period.toUpperCase() == 'MONTH')
            periodName = "BULAN";
        else if(period.toUpperCase() == 'DAY')
            periodName = "HARI";
        else if(period.toUpperCase() == 'CLAIM')
            periodName = "KLAIM";


        if(value == 'Unit')
          return unitName + "/" + periodName;
        else if (value == 'AsClaim')
          return " RUPIAH/PERTAHUN"
        else if (value == 'Rupiah')
          return " RUPIAH/" + periodName;
        else if (value == 'Claim')
          return " KLAIM/" + periodName;
      }
      return "-";
    };

    Vue.prototype.formatUnitNameUsage = (value,unitName="") => {
      if(Boolean(value)){
        if(value == 'Unit')
          return unitName;
        else if (value == 'AsClaim')
          return " RUPIAH (TAHUNAN)" 
        else if (value == 'Rupiah')
          return " RUPIAH" 
        else if (value == 'Claim')
          return " KLAIM" 
      }
      return "-";
    };


  },
}
Vue.use(MyPlugin)

Vue.prototype.$http = async (method, resource, data)  => {
  // inject the accessToken for each request
  let accessToken = Vue.prototype.$auth.getToken();
  return client({
    method,
    url: resource,
    data,
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }).then(req => {
    return req.data
  }).catch(e => {
    console.log(e);
    if (e.response) {
      var msg = "";
      
      if (e.response.status === 401) {
        setTimeout(() => {
          Vue.prototype.$auth.removeToken();
          router.push('login');  
        },1000);
      }

      if(Boolean(e.response) && Boolean(e.response.data) && Boolean(e.response.data.message)) 
        msg = e.response.data.message;
      else 
        msg = e.toString();

      return {
        "is_ok":false,"message":msg,"data":null
      }
    } else if (e.request) {
      return {
        "is_ok":false,"message":"Network error " + e.toString(),"data":null
      }
    } else {

    }
  });
};

Vue.prototype.$httpUpload = async (method, resource, data)  => {
  let accessToken = Vue.prototype.$auth.getToken();
  return client({
    method,
    url: resource,
    data,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": 'multipart/form-data'
    }
  }).then(req => {
    return req.data
  }).catch(e => {
    var msg = "";
    if (e.response.status === 401) {
      setTimeout(() => {
        Vue.prototype.$auth.removeToken();
        router.push('login');  
      },1000);
    }

    if(Boolean(e.response) && Boolean(e.response.data) && Boolean(e.response.data.message)) 
      msg = e.response.data.message;
    else 
      msg = e.toString();
    return {
      "is_ok":false,"message":msg,"data":null
    }
  });
};

Vue.component("ImportDataTable",ImportDataTable);
Vue.component("DataTable",DataTable);
Vue.component("DataTableClaim",DataTableClaim);
Vue.component("SearchableSelect",SearchableSelect);
Vue.component('qr-code', VueQRCodeComponent)
Vue.component('draggable', draggable)
Vue.component('vueDropzone', vue2Dropzone)
Vue.component('MyInputText', MyInputText)
Vue.component('MyInputNumber', MyInputNumber)											 
Vue.component('MyInputDate', MyInputDate)
Vue.component('MyInputTextArea', MyInputTextArea)
Vue.component('MyInputSearchableSelect', MyInputSearchableSelect)
Vue.component('DataIdentity', DataIdentity)
Vue.component('MyInputComboBox', MyInputComboBox)
Vue.component('MyInputDateTime', MyInputDateTime)
Vue.component('VueEditor', VueEditor)
Vue.component('multiselect', Multiselect)


Vue.use(VueGoogleMaps, {
  load: {
    key: 'AIzaSyCZ7idTwrXObyIeujxXVHWmCnRj4q45hTE',
    libraries: 'places',
  }
});


Vue.use(money, {
  precision: 0,
  decimal: '.',
  thousands: ','
})


/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App },
  methods:{

  }
})

