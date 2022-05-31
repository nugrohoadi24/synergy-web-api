<template>
  <div style="height:100%">
        
    <b-tabs card style="height:100%">
      <b-tab title="Data Polis" active>
       <div class="d-flex justify-content-end align-middle" style="padding-bottom:10px" >
          <label class="idStyleLabel">ID </label>
          <label class="idStyle">{{this.currentData._id}}</label>

          <b-button size="md" class="ml-auto p-2" style="width:120px;margin-right:20px" @click="onSave" variant="primary"  >
            <b-icon icon="cloud-upload" aria-hidden="true" style="margin-right:5px"></b-icon>Save 
          </b-button>
          <b-button size="md" style="width:120px" @click="onCancel" variant="danger" >
            <b-icon icon="exclamation-circle-fill" aria-hidden="true" style="margin-right:5px"></b-icon>Cancel 
          </b-button>
        </div>

        <b-card header="General Information"  
          border-variant="primary"
          header-bg-variant="primary"
          header-text-variant="white"> 
          
          <b-row>
            <b-col sm="6">
              <b-row class="editRow">      
                <b-col sm="4">
                    <label class="inputLabel">Certificate No : </label>
                </b-col> 
                <b-col sm="8">
                  <SearchableSelect  style="width:300px" v-on:loadItems="loadUserPolicy" 
                                        v-bind:items="userPolicySelectData"                            
                                        :selectedItem.sync="currentData.policy"                           
                                        @onItemselect="onPolicySelected"
                                        value_field="_id" 
                                        text_field="desc"/>
                </b-col>               
              </b-row>

              <b-row class="editRow">      
                <b-col sm="4">
                  <label class="inputLabel">Hospital: </label>
                </b-col>
                <b-col sm="8">
                  <SearchableSelect  style="width:300px" v-on:loadItems="loadHospital" 
                                    v-bind:items="hospitalSelectData"                            
                                    :selectedItem.sync="currentData.hospital"                           
                                    value_field="_id" 
                                    text_field="name"/>
                </b-col> 
              </b-row>
              <b-row class="editRow">      
                <b-col sm="4">
                    <label class="inputLabel">Nama Pengaju</label>
                </b-col>
                <b-col sm="8">
                  <b-input v-model="currentData.requester_name"></b-input>
                </b-col>
              </b-row>

              <b-row class="editRow">      
                <b-col sm="4">
                    <label class="inputLabel">No Telp Pengaju</label>
                </b-col>
                <b-col sm="8">
                  <b-input v-model="currentData.requester_phone"></b-input>
                </b-col>
              </b-row>

              <b-row class="editRow">      
                <b-col sm="4">
                    <label class="inputLabel">Email Pengaju</label>
                </b-col>
                <b-col sm="8">
                  <b-input v-model="currentData.requester_email"></b-input>
                </b-col>
              </b-row>

              <b-row class="editRow">      
                <b-col sm="4">
                    <label class="inputLabel">Relasi dengan tertanggung</label>
                </b-col>
                <b-col sm="8">
                  <b-input v-model="currentData.requester_relation"></b-input>
                </b-col>
              </b-row>


              <b-row class="editRow">      
                <b-col sm="4">
                    <label class="inputLabel">NIK Pengaju</label>
                </b-col>
                <b-col sm="8">
                  <b-input v-model="currentData.requester_nik"></b-input>
                </b-col>
              </b-row>

              <b-row class="editRow">      
                <b-col sm="4">
                    <label class="inputLabel">Cashless </label>
                </b-col> 
                <b-col sm="8">
                    <b-form-checkbox v-model="currentData.cashless"/>
                </b-col> 
              </b-row>


            </b-col>

            <b-col sm="6">

              <b-row class="editRow">      
                <b-col sm="3">
                    <label class="inputLabel">Nama Tertanggung</label>
                </b-col>
                <b-col sm="8">
                  <b-input disabled v-model="currentData.policy.nama_tertanggung"></b-input>
                </b-col>
              </b-row>

              <b-row class="editRow">      
                <b-col sm="3">
                    <label class="inputLabel">NIK Tertanggung</label>
                </b-col>
                <b-col sm="8">
                  <b-input disabled v-model="currentData.policy.nik_tertanggung"></b-input>
                </b-col>
              </b-row>

              <b-row class="editRow">      
                <b-col sm="3">
                    <label class="inputLabel">DOB Tertanggung</label>
                </b-col>

                <b-col sm="8">
                  <b-input disabled v-model="currentData.policy.dob_tertanggung"></b-input>
                </b-col>
              </b-row>

              <b-row class="editRow">      
                <b-col sm="3">
                    <label class="inputLabel">Alasan Claim : </label>
                </b-col>
                <b-col sm="9">        
                  <b-form-textarea v-model="currentData.claim_reason" rows=4 max-rows="4" />
                </b-col>                
              </b-row>

              <b-row class="editRow">      
                <b-col sm="3">
                  <label class="inputLabel">Kronologi Kejadian : </label>
                </b-col>
                <b-col sm="9">        
                  <b-form-textarea v-model="currentData.accident_description"  rows=4 max-rows="4" />
                </b-col>
              </b-row>
            </b-col>
          </b-row>
        </b-card>

        <b-card header="After Claim Information" style="margin-top:15px" v-if="viewAction=='CLAIM'"
          border-variant="primary" header-bg-variant="primary" header-text-variant="white"> 
 
          <b-row class="editRow" style="margin-top:10px;margin-bottom:10px"  >      
            <b-col sm="1">        
                <label class="inputLabel">Nama Dokter: </label>
            </b-col>     
            <b-col sm="4">        
              <b-form-input size="sm" v-model="currentData.doctor_name" ></b-form-input>
            </b-col>     

            <b-col sm="1" offset-md="1">
              <label class="inputLabel">Diagnosa : </label>
            </b-col>     
            <b-col sm="5">
              <SearchableSelect  style="width:300px" v-on:loadItems="loadDiagnose" 
                                  v-bind:items="diagnoseSelectData"                            
                                  :selectedItem.sync="currentData.diagnose"                           
                                  value_field="_id" 
                                  text_field="name"/>
            </b-col>  

          </b-row>

          <b-row class="editRow" style="margin-top:10px;margin-bottom:10px">      
            <b-col sm="1">        
                <label class="inputLabel">Diagnosa Note : </label>
            </b-col>     
            <b-col sm="11">        
              <b-form-textarea size="sm" v-model="currentData.diagnose_note" rows="4" max-rows="6"></b-form-textarea>
            </b-col>     
          </b-row>

         
        </b-card>

        <b-card header="Claim Document" style="margin-top:15px" v-if="viewAction=='CLAIM'"
          border-variant="primary" header-bg-variant="primary" header-text-variant="white"> 

           <b-row style="margin-bottom:10px">
            <b-col sm="2">   
              <div class="d-flex justify-content-end align-middle">
                <label class="inputLabel">Resume Medis </label>
              </div>     
            </b-col>     
            <b-col sm="4">
              <vue-dropzone :useCustomSlot=true style="min-height:150px" 
                ref="dropzoneResumeMedis" id="dropzoneResumeMedis" :options="dropzoneOptions">
                <div class="dropzone-custom-content">
                  <h3 class="dropzone-custom-title">Upload</h3>
                  <div class="subtitle">Upload</div>
                </div>
              </vue-dropzone>      
            </b-col>

            <b-col sm="2" >        
              <div class="d-flex justify-content-end align-middle">
                <label class="inputLabel">Copy Resep </label>
              </div>     
            </b-col>     
            <b-col sm="4" >
              <vue-dropzone :useCustomSlot=true style="min-height:150px" 
                ref="dropzoneCopyResep" id="dropzoneCopyResep" :options="dropzoneOptions">
                <div class="dropzone-custom-content">
                  <h3 class="dropzone-custom-title">Upload</h3>
                  <div class="subtitle">Upload</div>
                </div>
              </vue-dropzone>      
            </b-col>
          </b-row>

          <b-row style="margin-bottom:10px">
            <b-col sm="2">        
              <div class="d-flex justify-content-end align-middle">
                <label class="inputLabel">Kwitansi Biaya Perawatan Terakhir </label>
              </div>     
            </b-col>     
            <b-col sm="4">
              <vue-dropzone :useCustomSlot=true style="min-height:150px" 
                ref="dropzoneLastReceipt" id="dropzoneLastReceipt" :options="dropzoneOptions">
                <div class="dropzone-custom-content">
                  <h3 class="dropzone-custom-title">Upload</h3>
                  <div class="subtitle">Upload</div>
                </div>
              </vue-dropzone>      
            </b-col>

            <b-col sm="2">
              <div class="d-flex justify-content-end align-middle">
                <label class="inputLabel">Kwitansi Perawatan </label>
              </div>     
            </b-col>     
            <b-col sm="4">
              <vue-dropzone :useCustomSlot=true style="min-height:150px" 
                ref="dropzoneReceipt" id="dropzoneReceipt" :options="dropzoneOptions">
                <div class="dropzone-custom-content">
                  <h3 class="dropzone-custom-title">Upload</h3>
                  <div class="subtitle">Upload</div>
                </div>
              </vue-dropzone>      
            </b-col>
          </b-row>
        </b-card>        
      </b-tab>

      <b-tab title="Benefit" style="height:100%" >                          
       <div class="d-flex" style="padding-bottom:5px" >
          <b-button class="ml-auto p-2" size="md" @click="onCalculate" variant="success" >
            <b-icon icon="calculator" aria-hidden="true" style="margin-right:10px"></b-icon>Kalkulasi Claim 
          </b-button>
        </div>
        
        <b-row class="headerRow" align-v="center">
          <b-col class="headerCol" sm="3">
            <label>Benefit</label>
          </b-col>
          <b-col class="headerCol" sm="2">
            <label>Current Limit</label>
          </b-col>
          <b-col class="headerCol" sm="3">
            <label>Claimed Amount</label>
          </b-col>
          <b-col class="headerCol" sm="4">
            <label>Claim</label>
          </b-col>
        </b-row>      

        <div style="overflow-y:scroll;height:80%;width:100%;" >
          <b-row align-v="center" v-for="(benefit,idx) in this.currentData.policy.insurance_product.benefit" :key="benefit._id" 
            v-bind:style='{"padding-top":"5px","padding-bottom":"10px","font-weight":(benefit.is_group?"bold":"normal"), "color":(benefit.is_group?"#ffffff":"#404040"), "background-color":(idx%2==0?(benefit.is_group?"#2789E1":"#f6f6f6"):(benefit.is_group?"#2789E1":"#ffffff")) }'>                
            
            <b-col class="col1" sm="3">
              <label>{{(benefit.is_group?"# ":"") + benefit.name}}<b-icon v-if="!benefit.is_group" icon="info-square" aria-hidden="true" style="margin-left:10px"  v-b-popover.hover.top="benefit.note" title="note"></b-icon></label>
            </b-col>

            <b-col class="col1" sm="2" v-if="!benefit.is_group">
              <div v-for="limittxt in benefit.limit" :key="limittxt" >
                <label> {{limittxt}}</label>
              </div>
            </b-col>

            <b-col class="col1" sm="3"  v-if="!benefit.is_group">
              <table style="padding-top:3px;padding-bottom:3px">
                <tr v-if="Boolean(benefit.usage1.value)">
                  <td>{{formatThousandGroup(benefit.usage1.value) + " " + benefit.usage1.valueType}}</td>
                </tr>
                <tr v-if="Boolean(benefit.usage2.value)">
                  <td>{{formatThousandGroup(benefit.usage2.value) + " " + benefit.usage2.valueType}}</td>
                </tr>
              </table>
            </b-col>

            <b-col class="col1" sm="4"  v-if="!benefit.is_group && viewAction=='CLAIM'">
              <div style="padding-top:3px;padding-bottom:3px" v-if="benefit.unit==1" >
                <money size="sm" style="width:50%;display:inline" class="form-control form-control-sm"  v-model="benefit.claim_amount"></money>
              </div>
              <div style="padding-top:3px;padding-bottom:3px" v-if="benefit.unit==2" >
                <money size="sm" class="form-control form-control-sm" style="width:10%;display:inline" v-model="benefit.claim_jumlah"></money>
                <money size="sm" class="form-control form-control-sm" style="width:40%;display:inline" v-model="benefit.claim_amount"></money>
              </div>    

              <div style="margin-top:5px">
                <b-form-input style="display:inline;margin-right:10px" placeholder="Claim Note"  />       
              </div>
            </b-col>
          </b-row>  

          <b-row>  
            <b-col class="col1"  sm="12" v-if="!Boolean(this.currentData.policy.insurance_product.benefit)">
              <label align-self="middle" style="margin-top:5px">No data</label>
            </b-col>
          </b-row>  
        </div>

        <b-row class="footerRow" align-v="center">
          <b-col  sm="3">
            <label>Limit Tahunan</label>
          </b-col>
          <b-col  sm="2">
              <label>{{formatThousandGroup(this.currentData.policy.insurance_product.benefit_year_limit.limit)}}</label>
          </b-col>
          <b-col  sm="2">
              <label>{{formatThousandGroup(this.currentData.policy.usage_yearly)}}</label>
          </b-col>
        </b-row> 
      </b-tab>


    </b-tabs>
  </div>
</template>

<script>
  import moment from 'moment';
  export default {
    props: {
      queryid : { 
        type: String
      }
    },
    data () {
      return {
        loading: false,  
        viewAction:this.$route.query.action,     
        dropzoneOptions: {
          url: 'https://httpbin.org/post',
          maxFilesize: 2,
          paramName: "file",
          thumbnailWidth: 105,
          thumbnailHeight: 130,
          maxFilesize: 0.5,
          addRemoveLinks:true,
          useCustomSlot:true,
          dictRemoveFile:"Delete",
          dictCancelUpload:"Cancel"
        },
        currentData:{
          policy:{
            insurance_product:{
              benefit:[],
              benefit_year_limit:{}
            },
          },
          diagnose:{},
          hospital:{},
          cashless:false,
          user:{}
        },
        productData:{
          benefit_year_limit:[{limit:0}]
        },
        diagnoseSelectData:{page:1,pages:1,total:0,limit:10,docs: []},
        hospitalSelectData:{page:1,pages:1,total:0,limit:10,docs: []},
        userPolicySelectData:{page:1,pages:1,total:0,limit:10,docs: []},
      }
    },

    async created () {
      if(this.viewAction =='CREATED')
        await this.loadUserPolicy(1,"",false,10,"");

      if(this.viewAction =='CREATED' || this.viewAction =='CLAIM')
        await this.loadHospital(1,"",false,10,"");

      if(this.viewAction =='CLAIM'){
        await this.loadDiagnose(1,"",false,10,"");
        await this.loadData(this.$route.query.id);
      }
    },

    methods: {
      async onPolicySelected(){        
        this.currentData.nama_tertanggung = this.currentData.policy.nama_tertanggung;
        this.currentData.nik_tertanggung = this.currentData.policy.nik_tertanggung;
        this.currentData.dob_tertanggung = this.currentData.policy.dob_tertanggung;
        this.currentData.requester_name = this.currentData.policy.user.nama;        
        console.log(JSON.stringify(this.currentData));
        this.loadData(this.currentData.policy._id);
      },

      async loadClaim(dataid){
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/claim/detail/claim/${dataid}`);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          this.currentData.policy = response.data;          
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadData(dataid){
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/user_policy/detail/claim/${dataid}`);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          this.currentData.policy = response.data;          
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadDiagnose(page,sortBy,sortDesc,limit,search){  
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/diagnose/selection?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          this.diagnoseSelectData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadHospital(page,sortBy,sortDesc,limit,search){  
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/hospital/selection?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          this.hospitalSelectData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadUserPolicy(page,sortBy,sortDesc,limit,search){  
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/user_policy/selection?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          this.userPolicySelectData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      formatThousandGroup (value) {
        let val = (value/1).toFixed(0).replace('.', ',')
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
      },
        
      async onSave(){


        var errmsg =""

        if(!Boolean(this.currentData.hospital))
          errmsg += "* Silahkan Pilih rumah sakit\Kota \r\n";

        if(Boolean(errmsg)) {
          this.$emit('showMessage',errmsg, "info");                        
          return;
        }

        this.currentData.claim = [];
        for(var x=0;x<this.currentData.policy.insurance_product.benefit.length;x++){
          var benefit = this.currentData.policy.insurance_product.benefit[x];
          if(Boolean(benefit.claim_jumlah) && Boolean(benefit.claim_amount)){
            this.currentData.claim.push(
              {
                benefit:benefit._id,
                claim_jumlah:benefit.claim_jumlah,
                claim_amount:benefit.claim_amount
              }
            );          
          }
        };

        this.$emit('showLoading', true);
        var response = await this.$http('put', `/claim`,this.currentData);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          this.currentData = {};
          this.$router.go(-1);
        }else {
          this.$emit('showMessage',response.message, "danger");                        
        }
      },
      async onCancel(){

      },
      async onCalculate(){

      }
    }
  }
</script>

<style>   
  .editRow {
    margin-top:5px;
  }
  .headerRow
  {
    background-color:#808080;
    color: white;
    font-weight: bold;
    height:40px;
  }
  .footerRow
  {
    background-color:#808080;
    color: white;
    font-weight: bold;
    height:40px;
  }
  .headerCol
  {
  }

  .row
  {
    margin-left: 0px;
    margin-right: 0px;
  }
  .tab-content
  {
    height:100%;
  }


  .dropzone{
    padding:0px
  }

  .dropzone .dz-preview{
    margin-right: 10px;
  }
  .col-sm-2 {
    padding-right: 5px;
    padding-left: 5px;
  }
  .col-sm-1 {
    padding-right: 5px;
    padding-left: 5px;
  }
</style>
