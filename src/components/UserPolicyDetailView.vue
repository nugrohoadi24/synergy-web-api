<template>
  <b-container fluid>
    <label style="font-size:10px" >{{currentData._id}}</label>

    <b-row class="editRow" >      
      <b-col sm="2">
        <div class="d-flex align-middle" align-v="center">
          <label class="inputLabel">CERTIFICATE NO : </label>
          <label style="font-weight:bold" >{{currentData.certificate_no}}</label>
        </div>
      </b-col>
      <b-col sm="4">
        <div class="d-flex align-middle" align-v="center">
          <label class="inputLabel">NAMA TERTANGGUNG : </label>
          <label style="font-weight:bold" >{{currentData.nama_tertanggung}}</label>
        </div>
      </b-col>
      <b-col sm="3">
        <div class="d-flex align-middle" align-v="center">
          <label class="inputLabel">NAMA PRODUCT : </label>
          <label style="font-weight:bold" >{{productData.name}}</label>
        </div>
      </b-col>

      <b-col sm="3">
        <div class="d-flex align-middle" align-v="center">
          <label class="inputLabel">NAMA PLAN : </label>
          <label style="font-weight:bold" >{{currentData.plan_name}}</label>
        </div>
      </b-col>
    </b-row>

    <b-row class="row1"  style="background-color:#d8d8d8;padding-top:5px;padding-bottom:5px">
      <b-col class="col1" sm="3">
        <label>BENEFIT</label>
      </b-col>
      <b-col class="col1" sm="2">
        <label>CURRENT LIMIT</label>
      </b-col>
      <b-col class="col1" sm="2">
        <label>CLAIMED AMOUNT</label>
      </b-col>
      <b-col class="col1" sm="3">
        <label>INPROGRESS CLAIM</label>
      </b-col>
      <b-col class="col1" sm="2">
        <label>UNUSED LIMIT</label>
      </b-col>
    </b-row>      


    <b-row class="row1" v-for="(benefit,idx) in productData.benefit" :key="benefit._id" 
      v-bind:style='{"padding-top":"5px","padding-bottom":"5px","background-color":(idx%2==0?(benefit.is_group?"#B8DCFF":"#f6f6f6"):(benefit.is_group?"#B8DCFF":"#ffffff")) }'>                
      
      <b-col class="col1" sm="3" style="padding-top:3px;padding-bottom:3px">
        <label>{{benefit.name}}</label>
      </b-col>

      <b-col class="col1" sm="2" v-if="!benefit.is_group">
        <div style="padding-top:3px;padding-bottom:3px">
          <label>{{formatThousandGroup(benefit.plan[0].limit1)}}</label>
          <label>{{benefit.plan[0].limit1TypeText}}</label>
        </div>
        <div style="padding-top:3px;padding-bottom:3px" v-if="benefit.plan[0].limit2 !=0 || benefit.plan[0].limit2 == undefined">
          <label>{{formatThousandGroup(benefit.plan[0].limit2)}}</label>
          <label>{{benefit.plan[0].limit2TypeText}}</label>
        </div>        
      </b-col>

      <b-col class="col1" sm="2"  v-if="!benefit.is_group">
        <div style="padding-top:3px;padding-bottom:3px">
          <label>{{formatThousandGroup(benefit.plan[0].usageValue1) + " " + benefit.plan[0].usageValueType1}}</label>

        </div>
        <div style="padding-top:3px;padding-bottom:3px" v-if="benefit.plan[0].limit2 !=0 || benefit.plan[0].limit2 == undefined">
          <label>{{formatThousandGroup(benefit.plan[0].usageValue2) + " " + benefit.plan[0].usageValueType2}}</label>
        </div>        
      </b-col>


      <b-col class="col1" sm="3"  v-if="!benefit.is_group">          
        <div style="padding-top:3px;padding-bottom:3px">
          <label>{{formatThousandGroup(benefit.plan[0].inprogress_value1) + " " + benefit.plan[0].usageValueType1}}</label>
        </div>
        <div style="padding-top:3px;padding-bottom:3px" v-if="benefit.plan[0].limit2 !=0 || benefit.plan[0].limit2 == undefined">
          <label>{{formatThousandGroup(benefit.plan[0].inprogress_value2) + " " + benefit.plan[0].usageValueType2}}</label>
        </div> 
      </b-col>

      <b-col class="col1" sm="2"  v-if="!benefit.is_group">
        <div style="padding-top:3px;padding-bottom:3px">
          <label>{{formatThousandGroup(benefit.plan[0].unused_limit1) + " " + benefit.plan[0].usageValueType1}}</label>
        </div>
        <div style="padding-top:3px;padding-bottom:3px" v-if="benefit.plan[0].limit2 !=0 || benefit.plan[0].limit2 == undefined">
          <label>{{formatThousandGroup(benefit.plan[0].unused_limit2) + " " + benefit.plan[0].usageValueType2}}</label>
        </div>        
      </b-col>
      

      <b-col class="col1"  sm="9" v-if="benefit.is_group">
        <label align-self="middle" style="margin-top:5px">BENEFIT GROUP {{benefit.name}}</label>
      </b-col>
    </b-row>  



    <b-row class="row1" style="background-color:#dfdfdf;padding-top:5px;padding-bottom:5px">
      <b-col class="col1" sm="3">
        <label>LIMIT TAHUNAN</label>
      </b-col>
      <b-col class="col1" sm="2">
           <label>{{formatThousandGroup(this.productData.benefit_year_limit[0].limit)}}</label>
      </b-col>
    </b-row> 

  </b-container>
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
        currentData:{},
        productData:{
          benefit_year_limit:[{limit:0}]
        },
        satuan_limit_data:[]
      }
    },

    async created () {
      await this.loadClaimLimitOption();
      this.loadData(this.$route.query.id);
    },

    methods: {
      async loadData(dataid){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/user_policy/detail/${dataid}`);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          this.currentData = response.data;
          await this.loadProductData(this.currentData.insurance_product._id,this.currentData.plan_name);
          await this.loadInprogressClaim(this.currentData._id);
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadClaimLimitOption(){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `data/claim_limit_option`);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          this.satuan_limit_data = response.data.docs;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadInprogressClaim(policyId){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `claim/inprogress?policyId=${policyId}`);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          var temp = response.data; 
          this.productData.benefit.forEach(x=> {
            if(Boolean(x.is_group))
              return;              

            x.plan[0].inprogress_value1 = 0;
            x.plan[0].inprogress_value2 = 0;

            var benefitInprogressUsage = temp.find(us => us._id==x._id);            
            if(Boolean(benefitInprogressUsage)){
              if(x.plan[0].usageValueType1 == "Claim"){
                x.plan[0].inprogress_value1 = parseFloat(benefitInprogressUsage.totalClaim);
              }else if (x.plan[0].usageValueType1 == "kali"){
                x.plan[0].inprogress_value1 = parseFloat(benefitInprogressUsage.totalJumlah);
              }else if (x.plan[0].usageValueType1 == "Rupiah"){
                x.plan[0].inprogress_value1 = parseFloat(benefitInprogressUsage.totalAmount);
              }

              if(x.plan[0].usageValueType2 == "Claim"){
                x.plan[0].inprogress_value2 = parseFloat(benefitInprogressUsage.totalClaim);
              }else if (x.plan[0].usageValueType2 == "kali"){
                x.plan[0].inprogress_value2 = parseFloat(benefitInprogressUsage.totalJumlah);
              }else if (x.plan[0].usageValueType2 == "Rupiah"){
                x.plan[0].inprogress_value2 = parseFloat(benefitInprogressUsage.totalAmount);
              }
            }

            x.plan[0].unused_limit1=  x.plan[0].limit1 - x.plan[0].usageValue1 - x.plan[0].inprogress_value1;
            x.plan[0].unused_limit2 = x.plan[0].limit2 - x.plan[0].usageValue2 - x.plan[0].inprogress_value2;

            x._id = x._ix + "1";
          });

          console.log(this.productData);

        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

    
      async loadProductData(productId,planName){  
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/insurance_product/detail/${productId}/${planName}`);
        this.$emit('showLoading', false);
                
        if(response.is_ok){
          this.productData = response.data;
          var currentDate = moment.utc().toDate();       

          this.productData.benefit.forEach(x=> {            
            if(Boolean(x.is_group))
              return;              

            var limit1 = this.satuan_limit_data.find(s=> s.key == x.plan[0].limit1Type);
            x.plan[0].limit1TypeText = Boolean(limit1)?limit1.name:"";

            var limit2 = this.satuan_limit_data.find(s=> s.key == x.plan[0].limit2Type);
            x.plan[0].limit2TypeText = Boolean(limit2)?limit2.name:"";

            var benefitUsage = this.currentData.benefit_usage.find(us => us.benefit==x._id);   

            x.plan[0].usageValueType1 = "";
            x.plan[0].usageValue1 = "0";
            x.plan[0].usageValueType2 = "";
            x.plan[0].usageValue2 = "0";
            x.plan[0].usageValueType1 = limit1.valueType;
            x.plan[0].usageValueType2 = limit2.valueType;


            if(Boolean(benefitUsage)){
              var usageByDuration = null;
              if(limit1.durationType == "day"){
                usageByDuration = benefitUsage.daily.find(xs => xs.period_start == currentDate);
              }else if(limit1.durationType == "month"){
                usageByDuration = benefitUsage.monthly.find(xs => xs.period_start <= currentDate && xs.period_end >= currentDate);
              }else if(limit1.durationType == "year"){
                usageByDuration = benefitUsage.yearly.find(xs => xs.period_start <= currentDate && xs.period_end >= currentDate);
              }else if(limit1.durationType == "quarter"){
                usageByDuration = benefitUsage.quarter.find(xs => xs.period_start <= currentDate && xs.period_end >= currentDate);
              }else if(limit1.durationType == "semester"){
                usageByDuration = benefitUsage.semester.find(xs => xs.period_start <= currentDate && xs.period_end >= currentDate);
              }

              if(Boolean(usageByDuration)){
                if(limit1.valueType == "Claim"){
                  x.plan[0].usageValue1 = usageByDuration.claim_count;
                }else if (limit1.valueType == "kali"){
                  x.plan[0].usageValue1 = usageByDuration.usage_jlh;
                }else if (limit1.valueType == "Rupiah"){
                  x.plan[0].usageValue1 = usageByDuration.usage_amount;
                }
              }

              x.plan[0].usageValue1 = x.plan[0].usageValue1;


              usageByDuration = null;

              if(limit2.durationType == "day"){
                usageByDuration = benefitUsage.daily.find(xs => xs.period_start == currentDate);
              }else if(limit2.durationType == "month"){
                usageByDuration = benefitUsage.monthly.find(xs => xs.period_start <= currentDate && xs.period_end >= currentDate);
              }else if(limit2.durationType == "year"){
                usageByDuration = benefitUsage.yearly.find(xs => xs.period_start <= currentDate && xs.period_end >= currentDate);
              }else if(limit2.durationType == "quarter"){
                usageByDuration = benefitUsage.quarter.find(xs => xs.period_start <= currentDate && xs.period_end >= currentDate);
              }else if(limit2.durationType == "semester"){
                usageByDuration = benefitUsage.semester.find(xs => xs.period_start <= currentDate && xs.period_end >= currentDate);
              }

              if(Boolean(usageByDuration)){
                if(limit2.valueType == "Claim"){
                  x.plan[0].usageValue2 = usageByDuration.claim_count;
                }else if (limit2.valueType == "kali"){
                  x.plan[0].usageValue2 = usageByDuration.usage_jlh;
                }else if (limit2.valueType == "Rupiah"){
                  x.plan[0].usageValue2 = usageByDuration.usage_amount;
                }
              }
              x.plan[0].usageValueType2 = limit2.valueType;
              x.plan[0].usageValue2 = x.plan[0].usageValue2;
            }

          });
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      }
    }
  }
</script>

<style>   
  .editRow {
    margin-top:5px;
  }
</style>
