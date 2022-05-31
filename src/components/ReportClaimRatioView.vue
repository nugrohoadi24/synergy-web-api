<template>
  <b-row class="vh-100 text-center" align-v="center" align-h="center">   
    <b-col>
    <b-row>
      <b-col>
        <center>
        <b-card title="CLAIM FUND REPORT" sub-title="SILAHKAN ISI PARAMETER REPORT" 
          style="padding:15px;width:600px;margin-top:-60px">        
            <MyInputSearchableSelect label="COMPANY" :value.sync="company" v-on:loadItems="loadCompany" 
              style="padding-top:30px"
              :items="companySelectData" value_field="_id" text_field="name" @onItemselect= "onCompanySelected" />            
            <b-row style="padding-top:20px">
              <b-col sm="3">
                <label>COMPANY COVERAGE</label>
              </b-col>
              <b-col sm="9">
                <b-form-select v-model="company_policy" :options="companyPolicySelectData.docs" value-field="policy_no" text-field="policy_no"></b-form-select>
              </b-col>
            </b-row>

            <b-btn type="submit" @click="openReport" variant="success" style="margin-top:40px">GENERATE REPORT</b-btn>
        </b-card>
        </center>
      </b-col>
    </b-row>
    </b-col>
  </b-row>
</template>



<script>
  import api from '@/apiClient/AuthApi'
  export default {
    data () {
      return {
        loading: false,
        company: {},
        company_policy : "",
        companySelectData:{page:1, pages:1, total:0, limit:10, docs: []},
        companyPolicySelectData:{page:1,pages:1,total:0,limit:10,docs: []},
      }
    },
    
    async created () {
      this.loadCompany(1,"","",10,"");
    },

    methods: {
      async loadCompany(page,sortBy,sortDesc,limit,search){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/company/selection?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.companySelectData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },
      
      async loadCompanyPolicy(company){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/company_policy/selection?company=${company}`);
        this.$emit('showLoading', false);
        console.log(response.data.docs);

        if(response.is_ok){
          this.companyPolicySelectData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async onCompanySelected(data){
        console.log(JSON.stringify(data));
        this.companyPolicy = "";
        this.loadCompanyPolicy(data._id);
      },


      async openReport () {
        if(!Boolean(this.company_policy)){
            this.$emit('showMessage',"Silahkan dipilih terlebih dahulu company policy yg akan di ambil reportnya", "danger");                        
            return;
        }


        let accessToken = this.$auth.getToken();
        window.open(process.env.API_BASE_URL + "/report/fund/" + encodeURIComponent(this.company_policy) + "?token=" + accessToken , '_blank');
      }
    }
  }
</script>
