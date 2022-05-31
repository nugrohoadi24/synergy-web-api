<template>
  <b-container fluid>
    <DataTable ref="dataTable" v-bind:title="title"  
                v-bind:tableData="tableData"  
                v-bind:fields="fields" 
                v-on:loadItems="loadItems" 
                v-on:onDelete="onDelete" 
                v-on:onEdit="onEdit"
                v-on:onCreateNew="onCreateNew"
                :actionCreate="this.createEnable"
                :actionDelete="this.deleteEnable"
                :search="search"
                style="margin-top:10px">  
    </DataTable>  
    
    <b-modal ref="formEdit" hide-header size="xl" scrollable  lazy  centered 
      :ok-disabled="!this.updateEnable" ok-title="SAVE" cancel-title="CANCEL" @ok="saveData">     
      <b-container fluid>
        <b-row class="editRow" >
          <b-col sm="6">
            <b-row class="editRow" >
              <b-col sm="3">
                <label>TYPE <font style="color:red;margin-left:2px">*</font></label>
              </b-col>
              <b-col sm="9">
                <b-form-select v-model="currentData.type" :options="providerCategory" value-field="value" text-field="text"></b-form-select>
              </b-col>          
            </b-row>

            <MyInputText label="KODE" :value.sync="currentData.code" mx=10 mandatory/> 
            <MyInputText label="NAMA" :value.sync="currentData.name" mx=150 mandatory/> 
            <MyInputTextArea label="ALAMAT" :value.sync="currentData.address" mx=500 mandatory/> 

            <MyInputSearchableSelect label="PROVINSI" :value.sync="currentData.province" mandatory
              v-on:loadItems="loadProvince" 
              :items="provinceData" value_field="_id" text_field="name" /> 
            <MyInputSearchableSelect label="KOTA" :value.sync="currentData.city" mandatory
              v-on:loadItems="loadCity" 
              :items="cityData" value_field="_id" text_field="name" /> 

            <MyInputSearchableSelect label="KECAMATAN" :value.sync="currentData.district"  mandatory
              v-on:loadItems="loadDistrict" 
              :items="districtData" value_field="_id" text_field="name" /> 

            <MyInputSearchableSelect label="KELURAHAN" :value.sync="currentData.subdistrict" mandatory
              v-on:loadItems="loadSubdistrict" 
              :items="subdistrictData" value_field="_id" text_field="name" /> 

            <MyInputText label="KODE POS" :value.sync="currentData.zipcode" mx=5 :inputNumber=true />  

            <MyInputText label="EMAIL" :value.sync="currentData.admin_email" mx=50 mandatory/> 

            <MyInputText label="PHONE 1" :value.sync="currentData.phone1" mx=30 :inputNumber=true mandatory/> 

            <MyInputText label="PHONE 2" :value.sync="currentData.phone2" mx=30 :inputNumber=true /> 

            <b-row class="editRow" >
              <b-col sm="3">
                <label>ACTIVE</label>
              </b-col>
              <b-col sm="6">
                <b-form-checkbox size="sm" v-model="currentData.is_active"></b-form-checkbox>
              </b-col>          

              <b-col sm="3">
                <b-button size="sm" class="mb-2" right @click="showQRCode">
                  <b-icon icon="upc-scan" aria-hidden="true"></b-icon> SHOW QR
                </b-button>
              </b-col>
            </b-row>
          </b-col>
            

          <b-col sm="6">
            <MyInputText label="VOUCHER PIN" :value.sync="currentData.voucher_pin" mx=6 :inputNumber=true />  


            <b-row class="editRow" >
              <b-col sm="3">
                <label>LONGITUDE</label>
              </b-col>
              <b-col sm="9">
                <b-form-input size="sm" debounce="500" v-on:keyup="this.onLongLatChange"  v-model="this.currentData.longitude"></b-form-input>
              </b-col>     
            </b-row>    

            <b-row class="editRow" >
              <b-col sm="3">
                <label>LATITUDE</label>
              </b-col>
              <b-col sm="9">
                <b-form-input size="sm" debounce="500" v-on:keyup="this.onLongLatChange"  v-model="this.currentData.latitude"></b-form-input>
              </b-col>     
            </b-row>    
            

            <b-row class="editRow" >
              <GmapMap
                    ref="mapRef"
                    :options="{
                      zoomControl: true,
                      mapTypeControl: false,
                      scaleControl: true,
                      streetViewControl: false,
                      rotateControl: true,
                      fullscreenControl: false,
                      disableDefaultUi: false
                    }"
                    @center_changed="updateCenter"
                    :center='center'
                    :zoom='18'
                    style='width:100%;  height: 400px;'>
                    <GmapMarker :position="center"/>    
              </GmapMap>
              <b-icon icon="record-fill" class="center   "></b-icon>

            </b-row>    

          </b-col>
        </b-row>
      </b-container>
    </b-modal>

    <b-modal ref="showQR" hide-header hide-footer size="lg"  lazy  centered >     
      <div align="center">
        <qr-code 
            :text="currentData.qrcode"
            size="500"
            color="#00468B"
            bg-color="#ffffff" 
            error-level="L">
        </qr-code>          
      </div>
    </b-modal>

  </b-container>
</template>

<script>
  import moment from 'moment';
  var timer;
  export default {
    data () {
      return {
        title:"SERVICE PROVIDER",
        loading: false,
        center: { lat: 45.508, lng: -73.587 },
        newCenter: {  },     
        currentPlace:null,   
        fields: [
          { key: 'code', label:"CODE", sortable: true},
          { key: 'name', label:"HOSPITAL NAME", sortable: true},
          { key: 'address', label:"ADDRESS", sortable: true},
          { key: 'phone1', label:"PHONE", sortable: true},
          { key: 'is_active', label:"ACTIVE", sortable: true },
          { key: 'created_at', label:"CREATED AT", sortable: true, datetime:true},
          { key: 'updated_at', label:"UPDATED AT", sortable: true, datetime:true},
          { key: 'action',label:"ACTION",tdClass:"columnActionStyle",thClass:"columnActionStyle" }
        ],
        providerCategory: [
          { text: 'RUMAH SAKIT', value: 'RS' },
          { text: 'KLINIK', value: 'KLINIK' },
          { text: 'LAB', value: 'LAB' },
          { text: 'APOTEK', value: 'APOTEK' },
          { text: 'OPTIK', value: 'OPTIK' },
          { text: 'INSURANCE', value: 'INSURANCE' }
        ],
        provinceData:{page:1, pages:1, total:0, limit:10, docs: []},
        cityData:{page:1, pages:1, total:0, limit:10, docs: []},
        districtData:{page:1, pages:1, total:0, limit:10, docs: []},
        subdistrictData:{page:1, pages:1, total:0, limit:10, docs: []},

        tableData : {
          page:1,
          pages:1,
          total:0,
          limit:10,
          docs: [
          ]
        },
        currentData:{
          is_active:true
        },
        search:""
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


      this.loadCity(1,"","",10,"");
      this.loadProvince(1,"","",10,"");
      this.loadDistrict(1,"","",10,"");
      this.loadSubdistrict(1,"","",10,"");

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
        var response = await this.$http('get', `/hospital?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.tableData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadProvince(page,sortBy,sortDesc,limit,search){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/province/selection/?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.provinceData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadCity(page,sortBy,sortDesc,limit,search){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/city/selection/?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.cityData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadDistrict(page,sortBy,sortDesc,limit,search){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/district/selection?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.districtData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadSubdistrict(page,sortBy,sortDesc,limit,search){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/subdistrict/selection?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.subdistrictData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async updateCenter(newCenter) {
        this.newCenter = {
          lat:newCenter.lat(),
          lng:newCenter.lng()
        };
        window.clearTimeout(timer);
        timer = window.setTimeout(this.updateCenter1, 200);
      },

      async updateCenter1() {
        this.center = {
          lat:this.newCenter.lat,
          lng:this.newCenter.lng
        };
        this.currentData.longitude = String(this.newCenter.lng);
        this.currentData.latitude = String(this.newCenter.lat);
      },

      onLongLatChange(value) {
         this.center = {
          lat: parseFloat(this.currentData.latitude),
          lng: parseFloat(this.currentData.longitude)
        };
      },
    
      geolocate: function() {
        navigator.geolocation.getCurrentPosition(position => {
          this.center = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        });
      },

      async showQRCode(){
        this.$refs['showQR'].show()
      },
      onCreateNew(){
        this.geolocate();        
        this.currentData = {is_active:true};
        this.confirmPassword = "";
        this.$refs['formEdit'].show()
      },


      async onEdit(data){      
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/hospital/detail/${data._id}`);
        this.$emit('showLoading', false);        
        if(response.is_ok){
          this.currentData = response.data;
          if(!Boolean(this.currentData.longitude) || !Boolean(this.currentData.latitude)){
            this.geolocate();
          }else{
            this.center = {
              lat:this.currentData.latitude,
              lng:this.currentData.longitude
            };
          }
          this.$refs['formEdit'].show()
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async onDelete(data){
        this.$emit('showLoading', true);
        var response = await this.$http('delete', `/hospital/${data._id}`);
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

        if(!Boolean(this.currentData.code))
          errmsg += "* Silahkan input kode kelurahan  \r\n";

        if(!Boolean(this.currentData.name))
          errmsg += "* Silahkan input nama kelurahan \r\n";

        if(!Boolean(this.currentData.district))
          errmsg += "* Silahkan Pilih Kecamatan\Kota \r\n";

        if(Boolean(errmsg)) {
          this.$emit('showMessage',errmsg, "info");                        
          return;
        }

        this.$emit('showLoading', true);
        var response = await this.$http(Boolean(this.currentData._id)?"post":"put", `/hospital`,this.currentData);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.currentData = {};
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
    margin-top:10px;
  }
  .centerPin {
    width: 14px;
    height: 14px;
    color:darkred;
    /* Center vertically and horizontally */
    position: absolute;
    top: 50%;
    left: 50%;
    margin: 38px 0 0 -7px; /* apply negative top and left margins to truly center the element */
}
</style>
