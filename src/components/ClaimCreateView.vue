<template>
  <div style="height:100%">
    <b-tabs card style="height:100%">
      <b-tab title="Data Polis" active>
       <div class="d-flex justify-content-end align-middle" style="padding-bottom:10px" >
         <h5 class="h4" style="font-weight:bold" >{{this.method}}</h5>

         <div v-if="method !== 'REIMBURSE'" class="ml-auto p-2">
          <b-button size="md" class="ml-auto p-2" :disabled="!this.updateEnable" style="width:120px;margin-right:20px" @click="onSave" variant="success" 
            v-if="!Boolean(currentData.claim_status) || currentData.claim_status == 'CREATED'"  >
            <b-icon icon="cloud-upload" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>Save
          </b-button>

          <b-button size="md" style="width:120px;margin-right:20px" @click="onCancel" variant="danger" >
            <b-icon icon="exclamation-square" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>Cancel 
          </b-button>

          <b-button size="md" :disabled="!this.updateEnable" style="width:180px;color:white;margin-right:20px" @click="onGenerateSuratJaminanMasuk" variant="info"  
            v-if="['SJM_CREATED','SJM_SENT','CREATED'].includes(currentData.claim_status)">
            <b-icon icon="box-arrow-in-right" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>Buat/Lihat SJM
          </b-button>

          <b-button size="md" :disabled="!this.updateEnable" style="width:180px;color:white;margin-right:20px" @click="onSendSuratJaminan" variant="info" 
            v-if="['SJM_CREATED','SJM_SENT'].includes(currentData.claim_status)" >
            <b-icon icon="envelope-fill" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>Kirim SJM
          </b-button>

          <b-button size="md" :disabled="!this.updateEnable" style="width:120px;color:white" @click="onReject" variant="danger"
            v-if="['SJM_CREATED','CREATED'].includes(currentData.claim_status)">
            <b-icon icon="X" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>Reject
          </b-button>
         </div>

         <div v-else class="ml-auto p-2">
           <b-button size="md" class="ml-auto p-2" :disabled="!this.updateEnable" style="width:120px;margin-right:20px" @click="onSave" variant="success" 
            v-if="!Boolean(currentData.claim_status) || currentData.claim_status == 'CREATED'"  >
            <b-icon icon="cloud-upload" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>Save
          </b-button>

          <b-button size="md" style="width:120px;margin-right:20px" @click="onCancel" variant="danger" >
            <b-icon icon="exclamation-square" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>Cancel 
          </b-button>

          <b-button size="md" :disabled="!this.updateEnable" style="width:120px;color:white" @click="onReject" variant="danger"
            v-if="['SJM_CREATED','CREATED'].includes(currentData.claim_status)">
            <b-icon icon="X" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>Reject
          </b-button>
         </div>
         
        </div>

        <b-card header="General Information"  
          border-variant="primary"
          header-bg-variant="primary"
          header-text-variant="white"> 
          
          <b-row>
            <b-col sm="6">
              <MyInputText label="CLAIM NO" disabled :value.sync="currentData.claim_no" mx=100 /> 

              <MyInputSearchableSelect label="CERTIFICATE NO" :value.sync="currentData.policy" v-on:loadItems="loadUserPolicy" 
                :items="userPolicySelectData" value_field="_id" text_field="desc"  @onItemselect="onPolicySelected" /> 

              <MyInputText label="PRODUCT TYPE" :value.sync="currentData.requester_product_type" disabled/>

              <MyInputSearchableSelect label="HOSPITAL" :value.sync="currentData.hospital" v-on:loadItems="loadHospital" 
                :items="hospitalSelectData" value_field="_id" text_field="name" /> 

              <MyInputText label="NAMA PELAPOR" :value.sync="currentData.requester_name" mx=100 /> 

              <MyInputText label="NO TELP PELAPOR" :value.sync="currentData.requester_phone" mx=30 :inputNumber=true  /> 

              <MyInputText label="EMAIL PELAPOR" :value.sync="currentData.requester_email" mx=100 /> 

              <MyInputText label="RELASI PELAPOR" :value.sync="currentData.requester_relation" mx=40 /> 

              <MyInputText label="NIK PELAPOR" :value.sync="currentData.requester_nik" mx=16 :inputNumber=true /> 

              <b-row class="editRow">      
                <b-col sm="4">
                    <label class="inputLabel">CASHLESS </label>
                </b-col> 
                <b-col sm="8">
                    <b-form-checkbox v-model="currentData.cashless"/>
                </b-col> 
              </b-row>
            </b-col>

            <b-col sm="6">
              <MyInputText label="NAMA TERTANGGUNG" disabled :value.sync="currentData.policy.nama_tertanggung" mx=100 /> 
              <MyInputText label="NIK TERTANGGUNG" disabled :value.sync="currentData.policy.nik_tertanggung" mx=100 /> 
              <MyInputDate label="DOB TERTANGGUNG" disabled :value.sync="currentData.policy.dob_tertanggung" /> 
              <MyInputText label="ALASAN CLAIM" :value.sync="currentData.claim_reason" mx=100 /> 
              <MyInputDate label="TANGGAL KEJADIAN" :value.sync="currentData.incident_date"/>
              <MyInputTextArea label="KRONOLOGI KEJADIAN" :value.sync="currentData.accident_description" mx=500 />
              <MyInputText label="BAGIAN TUBUH TERLUKA" :value.sync="currentData.incident_body_part_injured" mx=100 />
            </b-col>
          </b-row>

          <b-row >
            <b-col sm="6">
              <div v-if="Boolean(currentData.surat_jaminan_masuk_by)" class="d-flex justify-content-center align-middle statusBox">
                <label>Surat jaminan Masuk Dicetak Oleh <b>{{currentData.surat_jaminan_masuk_by.name}}</b> Pada <b>{{currentData.surat_jaminan_masuk_at | formatDateTime}}</b></label>              
              </div>
            </b-col>
            <b-col sm="6">
              <div  v-if="Boolean(currentData.surat_jaminan_masuk_sent_by)" class="d-flex justify-content-center align-middle statusBox">
                <label>Surat jaminan Masuk Dikirim Oleh <b>{{currentData.surat_jaminan_masuk_sent_by.name}}</b> Pada <b>{{currentData.surat_jaminan_masuk_sent_at | formatDateTime}}</b></label>              
              </div>
            </b-col>
          </b-row>
          
        </b-card>    

        
      </b-tab>

      <b-tab title="Benefit" style="height:100%" >                          
       <div class="d-flex" style="padding-bottom:5px" >
        </div>
        
        <b-row class="headerRow" align-v="center">
          <b-col class="headerCol" sm="3">
            <label>BENEFIT</label>
          </b-col>
          <b-col class="headerCol" sm="3">
            <label>REMAINING LIMIT</label>
          </b-col>
          <b-col class="headerCol" sm="3">
            <label>CLAIMED AMOUNT</label>
          </b-col>
          <b-col class="headerCol" sm="3">
            <label>NOTE</label>
          </b-col>
        </b-row>      

        <div style="overflow-y:scroll;height:80%;width:100%;"  >
          
          <div v-for="(benefit,idx) in currentData.policy_benefit_detail" :key="benefit._id" >

            <b-row align-v="center"  v-if="!benefit.is_group"
              v-bind:style='{"padding-top":"5px","padding-bottom":"10px","font-weight":"normal", "color":"#404040", "background-color":(idx%2==0?"#f6f6f6":"#ffffff") }'>                

              <b-col class="col1" sm="3">
                <label>{{(benefit.is_group?"# ":"") + benefit.name}}
                <b-icon icon="info-square" aria-hidden="true" style="margin-left:10px"  v-b-popover.hover.top="benefit.benefit_note" title="note"></b-icon></label>
              </b-col>

              <b-col class="col1" sm="3" >
                <div v-if="Boolean(benefit.usage1.availableValue)">
                  <label> {{formatThousandGroup(benefit.usage1.availableValue) + " " + formatUnitName(benefit.usage1.valueType,benefit.usage1.durationType,benefit.unit_name)}}</label>
                </div>
                <div v-if="Boolean(benefit.usage2.availableValue)  && benefit.usage2.valueType != 'AsClaim'">
                  <label> {{formatThousandGroup(benefit.usage2.availableValue) + " " + formatUnitName(benefit.usage2.valueType,benefit.usage2.durationType,benefit.unit_name)}}</label>
                </div>

                <div v-if="Boolean(benefit.unit_price_limit) && Boolean(benefit.unit_name)">
                  <label> {{"Limit Claim Per " + benefit.unit_name + " " +  formatThousandGroup(benefit.unit_price_limit)}}</label>
                </div>

              </b-col>

              <b-col class="col1" sm="3" >
                <table style="padding-top:3px;padding-bottom:3px">
                  <tr v-if="Boolean(benefit.usage1.value)">
                    <td>{{formatThousandGroup(benefit.usage1.value) + " " + formatUnitNameUsage(benefit.usage1.valueType,benefit.unit_name)}}</td>
                  </tr>
                  <tr v-if="Boolean(benefit.usage2.value)">
                    <td>{{formatThousandGroup(benefit.usage2.value) + " " + formatUnitNameUsage(benefit.usage2.valueType,benefit.unit_name)}}</td>
                  </tr>
                </table>
              </b-col>
              <b-col class="col1" sm="3">
                <b-form-input v-model="benefit.request_claim_note" @keypress="onKeyPressKeepPosition($event)" :formatter="upperFormatter" />
              </b-col>
            </b-row> 

            <b-row align-v="center"  v-else
              v-bind:style='{"padding":"10px","font-weight":"bold", "color":"#ffffff", "background-color":"#2789E1"}'>                
              <b-col class="col1" sm="3">
                <label>{{"# "+ benefit.name}}</label>
              </b-col>
            </b-row>
          </div>


          <b-row>  
            <b-col class="col1"  sm="12" v-if="!Boolean(currentData.policy_benefit_detail)">
              <label align-self="middle" style="margin-top:5px">No data</label>
            </b-col>
          </b-row>  
        </div>

        <b-row class="footerRow" align-v="center">
          <b-col  sm="3">
            <label>LIMIT TAHUNAN</label>
          </b-col>
          <b-col sm="3">
              <label align-self="middle">{{formatThousandGroup(this.currentData.yearly_usage_limit)}}</label>
          </b-col>
          <b-col sm="2">
            <label align-self="middle">{{formatThousandGroup(this.currentData.yearly_usage)}}</label>
          </b-col>
        </b-row> 
      </b-tab>
    </b-tabs>

    <DataIdentity :data="this.currentData"/>

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
        policyDetail:{
          benefit:[],
          benefit_year_limit:{}
        },

        currentData:{
          key:1,
          policy:{
          },
          diagnose:{},
          hospital:{},
          cashless:false,
          user:{},
          policy_benefit_detail:[],
          product_type:""
        },
        productData:{
          benefit_year_limit:[{limit:0}]
        },
        diagnoseSelectData:{page:1,pages:1,total:0,limit:10,docs: []},
        hospitalSelectData:{page:1,pages:1,total:0,limit:10,docs: []},
        userPolicySelectData:{page:1,pages:1,total:0,limit:10,docs: []},

        method:""
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
      await this.loadHospital(1,"",false,10,"");        

      this.method = this.$route.query.method;

      if(Boolean(this.$route.query.id)) {
        await this.loadData(this.$route.query.id);
      }
      else {
        await this.loadUserPolicy(1,"",false,10,"");
      }

    },

    methods: {
      async onPolicySelected(){      
        this.currentData.nama_tertanggung = this.currentData.policy.nama_tertanggung;
        this.currentData.nik_tertanggung = this.currentData.policy.nik_tertanggung;
        this.currentData.dob_tertanggung = this.currentData.policy.dob_tertanggung;
        this.currentData.requester_name = this.currentData.policy.user.nama;        
        this.currentData.requester_nik = this.currentData.policy.user.nik;        
        this.currentData.requester_phone = this.currentData.policy.user.phone;        
        this.currentData.requester_email = this.currentData.policy.user.email;
        this.currentData.requester_product_type = this.currentData.policy.product_type;

        this.loadPolicyDetail(this.currentData.policy._id);
      },

      async loadData(dataid){
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/claim/detail/${dataid}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.currentData = response.data;
          console.log('response', this.currentData)

          var getProductType = this.currentData;
      
          if(getProductType.requester_product_type == "1") {
            getProductType.requester_product_type = "SALVUSCARE"
          } else {
            getProductType.requester_product_type = "INSURANCE CLAIM"
          }


          await this.loadPolicyDetail(this.currentData.policy._id);       
        } else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadPolicyDetail(dataid){
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/user_policy/detail/claim/${dataid}`);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          
          if(response.data.product_type == "1") {
            response.data.product_type = "SALVUSCARE"
          } else {
            response.data.product_type = "INSURANCE CLAIM"
          }

          this.currentData.product_type = response.data.product_type;

          this.currentData.policy_benefit_detail = response.data.policy_benefit_detail;

          for(var key in this.currentData.policy_benefit_detail){
            var tmpBenefitData = this.currentData.policy_benefit_detail[key];
            if(!Boolean(tmpBenefitData.benefit_note)) {
              this.currentData.policy_benefit_detail[key].benefit_note = "TIDAK ADA NOTE";
            }
          }

          this.currentData.yearly_usage_limit = response.data.yearly_usage_limit;
          this.currentData.yearly_usage = response.data.yearly_usage;
          this.currentData.created_at = this.currentData.created_at;

          if(Boolean(this.currentData.request_claim_note)){
            for(var x =0;x<this.currentData.policy_benefit_detail.length;x++){            
              var t = this.currentData.request_claim_note.find(n => n.benefit.toString() == this.currentData.policy_benefit_detail[x]._id.toString());
              if(Boolean(t)){
                this.currentData.policy_benefit_detail[x].request_claim_note = t.note;
              }
            }
          }
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
        
          this.product_type = this.userPolicySelectData.docs
          this.product_type.forEach(item => {
            if(item.product_type == "1") {
              item.product_type = "SALVUSCARE"
            } else {
              item.product_type = "INSURANCE CLAIM"
            }
          })

        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      formatThousandGroup (value) {
        let val = (value/1).toFixed(0).replace('.', ',')
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
      },
        

      async onReject(){        

       this.$bvModal.msgBoxConfirm('Apakah anda yakin untuk menreject Claim berikut ini?') 
        .then(async value => {
          if(value) {
            this.$emit('showLoading', true);
            var response = await this.$http('post', `/claim/reject/${this.currentData._id}`,null);
            this.$emit('showLoading', false);
            
            if(response.is_ok){
              this.loadData(response.data._id);
            }else { 
              this.$emit('showMessage',response.message, "danger");                        
            }
          }
        })
        .catch(err => {
          // An error occurred
        })

        
      },

      async onSave(){
        this.$emit('showLoading', true);
        this.currentData.request_claim_note = [];
        for(var x= 0;x<this.currentData.policy_benefit_detail.length;x++){
          var benefit = this.currentData.policy_benefit_detail[x];
          if(Boolean(benefit.request_claim_note)) {
            this.currentData.request_claim_note.push({
              benefit: benefit._id,
              note: benefit.request_claim_note
            });
          }
        }

        if(this.currentData.product_type == "SALVUSCARE") {
          this.currentData.product_type = "1"
        } else {
          this.currentData.product_type = "2"
        }

        if(this.currentData.requester_product_type == "SALVUSCARE") {
          this.currentData.requester_product_type = "1"
        } else {
          this.currentData.requester_product_type = "2"
        }

        var response = await this.$http(Boolean(this.currentData._id)?"post":"put", `/claim/create`,this.currentData);
        this.$emit('showLoading', false);

        if(this.currentData.cashless == false && this.currentData.claim_status == "CREATED") {
          var response = await this.$http('post', `/claim/create_claim_detail/${this.currentData._id}` ,this.currentData);
        }
        
        if(response.is_ok){
          this.$router.go(-1);
        }else {
          this.$emit('showMessage',response.message, "danger");                        
        }
      },

      async onCancel(){
        this.$router.go(-1);
      },
      async onCalculate(){
      },

      async onGenerateSuratJaminanMasuk(){        
        let accessToken = this.$auth.getToken();
        window.open(process.env.API_BASE_URL + "/claim/create_surat_jam/" + this.currentData._id + "?token=" + accessToken , '_blank');
        this.$router.go(-1);
      },

      async onSendSuratJaminan(){        
        this.$emit('showLoading', true);
        var response = await this.$http('post', `/claim/sent_sjm/${this.currentData._id}` ,this.currentData);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          this.loadData(response.data._id);
          this.$emit('showMessage',response.message, "success");                        
        }else { 
          this.$emit('showMessage',response.message, "danger");                        
        }
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

  .statusBox {
    padding:3px;
    background:#f0f0f0;
    margin-top:8px;
    margin-bottom:8px;
    margin-left:15px;
    margin-right:15px;
    border:1px solid #c0c0c0
  }
</style>
