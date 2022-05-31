<template>
  <b-container fluid>
    <!-- :actionView="true" -->
                
    <DataTable ref="dataTable" v-bind:title="title"  
                v-bind:tableData="tableData"                 
                v-bind:fields="fields" 
                v-on:loadItems="loadItems" 
                v-on:onDelete="onDelete" 
                v-on:onEdit="onEdit"
                v-on:onCreateNew="onCreateNew"
                v-on:onView="onView"
                :actionCreate="this.createEnable"
                :actionDelete="this.deleteEnable"
                :search="search"
                style="margin-top:10px">  
    </DataTable>  
    
    <b-modal ref="formEdit" hide-header size="xl" scrollable lazy centered 
      :ok-disabled="!this.updateEnable" ok-title="Save" cancel-title="Cancel" @ok="saveData">
      <b-row> 
        <b-col sm="6">
          <MyInputSearchableSelect label="NAME OF EMPLOYEE/MAIN" :value.sync="currentData.user" v-on:loadItems="loadUser" mandatory
            :items="userSelectData" value_field="_id" text_field="userDesc" @onItemselect= "onUserSelected" /> 

          <b-row class="editRow" >
            <b-col sm="3">
              <label>COMPANY COVERAGE NO<font style="color:red;margin-left:2px">*</font></label>
            </b-col>
            <b-col sm="9">
              <b-form-select v-model="currentData.company_policy" :options="companyPolicySelectData.docs" value-field="policy_no" text-field="policy_no"></b-form-select>
            </b-col>          
          </b-row>
          
          <MyInputSearchableSelect label="PRODUCT" :value.sync="currentData.insurance_product" 
            v-on:loadItems="loadInsuranceProduct" mandatory
            :items="insuranceProductSelectData" value_field="_id" text_field="name" @onItemselect= "onProductSelected"/> 

          
          <MyInputText label="PRODUCT TYPE" :value="currentData.product_type"  disabled/>

          <b-row class="editRow" >
            <b-col sm="3">
              <label>PLAN <font style="color:red;margin-left:2px">*</font></label>
            </b-col>
            <b-col sm="9">
              <b-form-select v-model="currentData.plan_name" :options="planSelectData" value-field="plan_name" text-field="plan_name"></b-form-select>
            </b-col>          
          </b-row>
          
          <MyInputDate label="CERTIFICATE START DATE" :value.sync="currentData.policy_date" mandatory /> 
          <MyInputText label="CERTIFICATE NO." :value.sync="currentData.certificate_no" mx=20 mandatory/> 
          <MyInputText label="CARD NO." :value.sync="currentData.card_no" mx=15 mandatory/> 
          <MyInputText label="STATUS" :value.sync="currentData.status_polis" disabled /> 

          <b-row class="editRow" >
            <b-col sm="3">
              <label>Active</label>
            </b-col>
            <b-col sm="4">
              <b-form-checkbox size="sm" v-model="currentData.is_active" :disabled="currentData.status_polis !='ACTIVE' || currentData.admin_policy_disable_at != null" ></b-form-checkbox>
            </b-col>


            <b-col sm="5" v-if="currentData.is_active == true"  class="d-flex justify-content-end align-middle">
              <b-button :disabled="currentData.status_polis !='ACTIVE'" title="Disable Certificate" variant="danger" size="sm"  @click="disablePolicy()">
                <b-icon icon="exclamation-square" aria-hidden="true" /> Disable Polis
              </b-button>
            </b-col>
          </b-row>

        </b-col>

        <b-col sm="6">
          <MyInputText label="PARTICIPANT NAME" :value.sync="currentData.nama_tertanggung" mx=150 mandatory/> 
          <MyInputText label="PARTICIPANT NIK" :value.sync="currentData.nik_tertanggung" mx=16 :inputNumber=true mandatory/> 
          
          <b-row class="editRow" >
            <b-col sm="3">
              <label>PARTICIPANT STATUS<font style="color:red;margin-left:2px">*</font></label>
            </b-col>
            <b-col sm="9">
              <b-form-select v-model="currentData.relation" :options="hubunganKeluargaOption" value-field="value" text-field="text"></b-form-select>
            </b-col>          
          </b-row>


          <MyInputTextArea label="PARTICIPANT ADDRESS" :value.sync="currentData.alamat_tertanggung" mx=500 mandatory/> 
          <MyInputDate label="PARTICIPANT DOB" :value.sync="currentData.dob_tertanggung" mandatory /> 
          <b-row class="editRow" >
            <b-col sm="3">
              <label>PARTICIPANT GENDER <font style="color:red;margin-left:2px">*</font></label>
            </b-col>
            <b-col sm="9">
              <b-form-radio-group
                v-model="currentData.gender_tertanggung"
                size="sm"
                :options="genderOption"
                name="radio-btn-outline"
                button-variant="outline-primary"
                buttons></b-form-radio-group>
            </b-col>          
          </b-row>

        </b-col>
      </b-row>


     

    

    </b-modal>
  </b-container>
</template>

<script>
  import moment from 'moment';
  export default {
    data () {
      return {
        title:"PARTICIPANT REGISTRATION",
        loading: false,
        fields: [
          { key: 'user.nama', label:"NAMA USER", sortable: false},
          { key: 'nama_tertanggung', label:"NAMA PARTICIPANT", sortable: true},
          { key: 'dob_tertanggung', label:"TANGGAL LAHIR", date:true},
          { key: 'card_no', label:"CARD NO", sortable: true},
          { key: 'certificate_no', label:"CERTIFICATE NO", sortable: true},
          { key: 'policy_date', label:"POLICY DATE", sortable: true, date:true},
          { key: 'policy_end_date', label:"END DATE", sortable: true, date:true},
          { key: 'insurance_product.name', label:"PRODUCT", sortable: false},
          // { key: 'insurance_product.product_type', label:"PRODUCT TYPE", sortable: false},
          { key: 'plan_name', label:"PLAN", sortable: true},
          { key: 'status_polis', label:"STATUS", sortable: false},          
          { key: 'action',label:"ACTION",tdClass:"columnActionStyle",thClass:"columnActionStyle" }
        ],
        genderOption: [
          { text: 'PRIA', value: 'M' },
          { text: 'WANITA', value: 'F' },
          { text: 'KOSONG', value: '' }
        ],
        hubunganKeluargaOption: [
          { text: 'KARYAWAN/UTAMA', value: 'KARYAWAN/UTAMA' },
          { text: 'PASANGAN', value: 'PASANGAN' },
          { text: 'ANAK', value: 'ANAK' }
        ],
        userSelectData:{
          page:1,
          pages:1,
          total:0,
          limit:10,
          docs: [
          ],
        },
        companyPolicySelectData:{page:1,pages:1,total:0,limit:10,docs: []},
        insuranceProductSelectData:{
          page:1,
          pages:1,
          total:0,
          limit:10,
          docs: [
          ],
        },
        planSelectData:{
          
        },
        tableData : {
          page:1,
          pages:1,
          total:0,
          limit:10,
          docs: [
          ],
        },
        search:"",
        currentData:{
          insurance_product:{
          },
          user:{},
          product_type:"",
        },
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

      if(!Boolean(sortDesc))
        sortDesc = 'true';
      this.loadItems(page?page:1,sortBy?sortBy:"created_at",sortDesc=="true",limit?limit:10,search?search:"");
      this.loadUser(1,"","",10,"");
      this.loadInsuranceProduct(1,"","",10,"");
    },

    methods: {
      async loadItems(page,sortBy,sortDesc,limit,search){   
        this.search = search;
        this.$router
          .replace({ query: { ...this.$route.query, p: page, sb:sortBy ,sd:sortDesc,l:limit,s:search } })
          .catch(() => {});

        this.$emit('showLoading', true);
        var response = await this.$http('get', `/user_policy?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.tableData = response.data;
          this.search = search;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadUser(page,sortBy,sortDesc,limit,search){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/user/selection?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.userSelectData = response.data;
          for(var usrkey in this.userSelectData.docs){
            var userData = this.userSelectData.docs[usrkey];
            userData.userDesc = userData.nama;
            if(Boolean(userData.email)) {
              userData.userDesc += " / " + userData.email
            }

            if(Boolean(userData.handphone))
              userData.userDesc += " / " + userData.handphone 
          }
          
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadInsuranceProduct(page,sortBy,sortDesc,limit,search){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/insurance_product/selection?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.insuranceProductSelectData = response.data;

          this.product_type = this.insuranceProductSelectData.docs

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

      async onUserSelected(data){
        //user company
        this.loadCompanyPolicy(data.company);
      },

      async onProductSelected(data){
        console.log('productData', data)
        this.currentData.insurance_product = data;    
        this.currentData.plan_name = null
        this.currentData.product_type = data.product_type;
        console.log('select', this.currentData.product_type);
        this.loadPlan(data._id);
      },

      async loadPlan(productId){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/insurance_product/plan/selection?productId=${productId}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.planSelectData = response.data.docs;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadCompanyPolicy(company){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/company_policy/selection?company=${company}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.companyPolicySelectData = response.data;
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },


      onCreateNew(){
        this.currentData = {is_active:true};
        this.confirmPassword = "";
        this.$refs['formEdit'].show()
      },

      async onEdit(data){
        console.log('data edit', data)
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/user_policy/detail/${data._id}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.currentData = response.data;

          if(this.currentData.product_type == "1") {
            this.currentData.product_type = "SALVUSCARE"
          } else {
            this.currentData.product_type = "INSURANCE CLAIM"
          }

//          this.currentData.policy_date = moment(this.currentData.policy_date).toDate();
          this.loadCompanyPolicy(this.currentData.user.company);
          this.loadPlan(this.currentData.insurance_product._id);   
          this.$refs['formEdit'].show()
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async onView(data){
        this.$router.push({ path: 'user_policy/detail', query: { id: data._id } })
      },

      async onDelete(data){
        this.$emit('showLoading', true);
        var response = await this.$http('delete', `/user_policy/${data._id}`);
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

        if(!Boolean(this.currentData.user))
          errmsg += "* Silahkan input userr\n";

        if(!Boolean(this.currentData.certificate_no))
          errmsg += "* Silahkan input no sertifikat \r\n";

        if(!Boolean(this.currentData.nama_tertanggung))
          errmsg += "* Silahkan input nama tertanggung \r\n";

        if(!Boolean(this.currentData.policy_date))
          errmsg += "* Silahkan input policy date \r\n";

        if(!Boolean(this.currentData.insurance_product))
          errmsg += "* Silahkan input insurance product \r\n";

        if(!Boolean(this.currentData.plan_name))
          errmsg += "* Silahkan input plan name \r\n";

        if(Boolean(errmsg)) {
          this.$emit('showMessage',errmsg, "info");                        
          return;
        }

        this.$emit('showLoading', true);

        console.log('currentData in save', this.currentData)

        if(this.currentData.product_type == "SALVUSCARE") {
          this.currentData.product_type = "1"
        } else {
          this.currentData.product_type = "2"
        }

        var response = await this.$http(Boolean(this.currentData._id)?"post":"put", `/user_policy`,this.currentData);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.currentData = {};
          this.$refs['formEdit'].hide()
          this.$refs.dataTable.reloadItems();
        }else {
          this.$emit('showMessage',response.message, "danger");                        
        }
      },

      async disablePolicy(){

        this.$bvModal.msgBoxConfirm('anda yakin untuk non aktifkan Polis ini dan polis keluarga Peserta dengan product yg sama?') 
        .then(async value => {
          if(value) {
            this.$emit('showLoading', true);
            var response = await this.$http('put', `/user_policy/disable`, {
              policyId: this.currentData._id
            });
            this.$emit('showLoading', false);

            if(response.is_ok){
              this.$emit('showMessage',response.message, "info");                        
              this.currentData.is_active = false;
            }else {
              this.$emit('showMessage',response.message, "danger");                        
            }
          }
        })
        .catch(err => {
          // An error occurred
        })
      }

    }
  }
</script>

<style>
 
   

  @media (min-width: 992px) {
    .modal-xl {
       max-width: 90% !important; width: 90% !important
    }
  }
  .editRow {
    margin-top:15px;
  }  
</style>
