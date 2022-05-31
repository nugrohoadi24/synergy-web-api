
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
                style="margin-top:10px">  </DataTable>  
    
    <b-modal ref="formEdit" hide-header size="xl" scrollable lazy no-close-on-esc no-close-on-backdrop centered 
      :ok-disabled="!this.updateEnable" ok-title="SAVE" cancel-title="CANCEL" @ok="saveData">
      <div>
          <b-row class="editRow"  >
            <b-col sm="2" >
              <div>
                <label>CODE</label>
                <b-form-input size="sm" style="display:inline;width:40%;margin-left:10px" v-model="currentData.code" :formatter="upperFormatter" />
              </div>
            </b-col>          
            <b-col sm="3">
              <div class="d-flex">
                <label>NAME</label>
                <b-form-input size="sm" style="display:inline;width:80%;margin-left:10px" v-model="currentData.name" :formatter="upperFormatter"/>
              </div>
            </b-col>                      

            <b-col sm="3">
              <div>
                <label>TYPE</label>
                <b-form-input size="sm" style="display:inline;width:80%;margin-left:10px" v-model="currentData.type" :formatter="upperFormatter"/>
              </div>
              <div class="d-flex">
                <label>PRODUCT TYPE</label>
                <b-form-select
                  v-model="currentData.product_type"
                  :value="product_type_choose"
                  :options="['SALVUSCARE', 'INSURANCE CLAIM']"
                ></b-form-select>
              </div>
            </b-col>                      
            <b-col sm="2" align-content="end" >
              <div style="align-content: center;">
                <label align-content="end">EXCESS DIJAMIN :</label>
                <b-form-checkbox size="sm" v-model="currentData.excess_dijamin" style="display:inline;width:40%;margin-left:10px"></b-form-checkbox>
              </div>
            </b-col>          
            <b-col sm="2" align-content="end" >
              <div style="align-content: center;">
                <label align-content="end">ACTIVE</label>
                <b-form-checkbox size="sm" v-model="currentData.is_active" style="display:inline;width:40%;margin-left:10px"></b-form-checkbox>
              </div>
            </b-col>          
          </b-row>

          <div style="width:3200px;padding-right:30px">
            <b-container fluid>
              <div style="margin-top:10px;margin-left:-15px">
                <b-button size="sm" class="mb-2" right @click="onAddBenefit" variant="primary" >
                  <b-icon icon="clipboard-plus" aria-hidden="true" style="margin-right:5px"></b-icon>ADD BENEFIT 
                </b-button>
                
                <b-button size="sm" class="mb-2" right @click="onAddPlan" variant="success" >
                  <b-icon icon="file-plus" aria-hidden="true" style="margin-right:5px"></b-icon>ADD PLAN 
                </b-button>

                <b-button size="sm" class="mb-2" right @click="onCopyProduct" variant="warning" >
                  <b-icon icon="clipboard-plus" aria-hidden="true" style="margin-right:5px"></b-icon>COPY PRODUCT
                </b-button>
              </div>

              <b-row class="row1"  style="background-color:#d8d8d8;padding-top:5px;padding-bottom:5px">
                <b-col class="col1" sm="2">
                  <label>BENEFIT / PLAN NAME</label>
                </b-col>
                <b-col class="col1" sm="1" v-for="(benefit,idx) in currentData.benefit_year_limit" :key="benefit._id">
                  <div>
                    <b-form-input size="sm"  v-model="benefit.plan_name" style="width:85%;display:inline" :formatter="upperFormatter"/>
                    <b-icon icon="x-circle" scale="1" variant="danger" align-self="end" style="margin-left:5px"  @click="onDeletePlan(idx)"></b-icon>
                  </div>
                </b-col>
              </b-row>      

               
              <draggable v-model="currentData.benefit"  @start="drag=true" @end="drag=false">
                <b-row class="row1" v-for="(benefit,idx) in currentData.benefit" :key="benefit._id" 
                  v-bind:style='{"padding-top":"5px","padding-bottom":"5px","background-color":(idx%2==0?(benefit.is_group?"#B8DCFF":"#f6f6f6"):(benefit.is_group?"#B8DCFF":"#ffffff")) }'>                

                  <b-col class="col1" sm="2" style="padding-top:3px;padding-bottom:3px">
                    <div class="d-flex justify-content-between align-items-center dataRow">
                      <b-icon icon="x-circle" scale="1" variant="danger" align-self="end"  @click="onDeleteBenefit(idx)"></b-icon>
                      <b-form-input size="sm" v-model="benefit.name" style="display:inline;width:90%" :formatter="upperFormatter" />
                      <b-form-checkbox size="sm" v-model="benefit.is_group" @change="onIsgGroupChange(benefit)" style="display:inline;margin-top:5px"></b-form-checkbox>                        
                    </div>

                    <div class="d-flex justify-content-between align-items-center dataRow" style="margin-right:28px;margin-left:25px" v-if="!benefit.is_group">
                      <label>UNIT</label>
                      <b-form-select style="width:40%" size="sm" v-model="benefit.unit" :options="benefit_unit_data" value-field="key" text-field="name"></b-form-select>
                      <label>UNIT NAME</label>
                      <b-form-input style="width:20%" size="sm" v-model="benefit.unit_name" :formatter="upperFormatter" />
                    </div>

                    <div class="d-flex justify-content-between align-items-center dataRow" style="margin-right:28px;margin-left:25px" v-if="!benefit.is_group">
                      <label>NOTE</label>
                      <b-form-input style="width:88%" size="sm" v-model="benefit.benefit_note" :formatter="upperFormatter"/>
                    </div>                    
                  </b-col>

                  <b-col class="col1" sm="1" v-for="plan in benefit.plan" :key="plan._id" v-if="!benefit.is_group">
                    <div class="dataRow d-flex justify-content-between align-items-center">
                      <money size="sm" class="form-control form-control-sm" style="width:45%" v-model="plan.limit1"></money>
                      <b-form-select  style="width:50%;" size="sm" v-model="plan.limit1Type" :options="satuan_limit_data" value-field="key" text-field="name"></b-form-select>
                    </div>
                    <div class="d-flex justify-content-between align-items-center dataRow " >
                      <money size="sm" class="form-control form-control-sm" style="width:45%" v-model="plan.limit2"></money>
                      <b-form-select style="width:50%" size="sm" v-model="plan.limit2Type" :options="satuan_limit_data" value-field="key" text-field="name"></b-form-select>
                    </div>

                    <div class="d-flex justify-content-between align-items-center dataRow ">
                      <label>UNIT PRICE LIMIT</label>
                      <money size="sm" class="form-control form-control-sm" style="width:50%" v-model="plan.unit_price_limit"></money>
                    </div>
                  </b-col>

                  <b-col class="col1"  sm="10" v-if="benefit.is_group">
                    <label align-self="middle" style="margin-top:5px">BENEFIT GROUP {{benefit.name}}</label>
                  </b-col>
                </b-row>  
              </draggable>



              <b-row class="row1" style="background-color:#dfdfdf;padding-top:5px;padding-bottom:5px">
                <b-col class="col1" sm="2">
                  <label>LIMIT TAHUNAN</label>
                </b-col>
                <b-col class="col1" sm="1" v-for="(benefit,idx) in currentData.benefit_year_limit" :key="benefit._id">
                  <div>
                    <money size="sm" class="form-control form-control-sm" v-model="benefit.limit"></money>
                  </div>
                </b-col>
              </b-row> 

            </b-container>
          </div>         
      </div>
    </b-modal>

  </b-container>
</template>

<script>
  import moment from 'moment';
  
  export default {
    data () {
      return {
        title:"PRODUCT SETUP",
        loading: false,
        fields: [
          { key: 'code', label:"CODE", sortable: true},
          { key: 'name', label:"NAME", sortable: true},
          { key: 'type', label:"TYPE", sortable: true},
          { key: 'jenis_produk', label:"PRODUCT TYPE", sortable: true},
          { key: 'is_active', label:"ACTIVE", sortable: true },
          { key: 'plan_count', label:"PLAN QTY", sortable: true},
          { key: 'excess_dijamin', label:"EXCESS", sortable: true},
          { key: 'action',label:"ACTION",tdClass:"columnActionStyle",thClass:"columnActionStyle" }
        ],
        tableData : {
          page:1,
          pages:1,
          total:0,
          limit:10,
          docs: [
          ]
        },
        satuan_limit_data: [],
        benefit_unit_data:[
          {key:"1",name:"Total Harga"},
          {key:"2",name:"Unit & Harga/Unit"}
        ],

        product_type_data:[
          {key:"RAWAT JALAN",name:"RAWAT JALAN"},
          {key:"RAWAT INAP",name:"RAWAT INAP"},
          {key:"GIGI",name:"GIGI"},
          {key:"MATA",name:"MATA"},
          {key:"MATERNITY",name:"MATERNITY"} 
        ], 
        currentData:{},
        product_type_choose:"",
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

      await this.loadClaimLimitOption();
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
        var response = await this.$http('get', `/insurance_product?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        
        this.$emit('showLoading', false);

        console.log(response);
        if(response.is_ok){
          this.tableData = response.data;
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
          this.satuan_limit_data.sort((a, b) => parseInt(a.key) > parseInt(b.key))
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },
      onCreateNew(){
        this.currentData = {
          benefit:[],
          benefit_year_limit:[],
          name:"",
          code:"",
        };
        this.confirmPassword = "";
        this.$refs['formEdit'].show()
      },

      async onEdit(data){        
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/insurance_product/detail/${data._id}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.currentData = response.data;

          if(this.currentData.product_type == "1"){
            this.currentData.product_type = "SALVUSCARE"
            this.product_type_choose = "SALVUSCARE"
          } else {
            this.currentData.product_type = "INSURANCE CLAIM"
            this.product_type_choose = "INSURANCE CLAIM"
          }
          this.$refs['formEdit'].show()
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async onDelete(data){
        this.$emit('showLoading', true);
        var response = await this.$http('delete', `/insurance_product/${data._id}`);
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
          errmsg += "* Silahkan input kode product  \r\n";

        if(!Boolean(this.currentData.name))
          errmsg += "* Silahkan input nama product \r\n";

        this.currentData.benefit.forEach(benefitItem => {
          if(benefitItem.is_group){
            benefitItem.plan = [];
            benefitItem.unit = ""
          }else{
            var x = 0;
            benefitItem.plan.forEach(planItem => {
              planItem.plan_name = this.currentData.benefit_year_limit[x].plan_name;         
              x++;
            });
          }
        });

        if(Boolean(errmsg)) {
          this.$emit('showMessage',errmsg, "info");                        
          return;
        }

        if(this.currentData.product_type == "SALVUSCARE") {
          this.currentData.product_type = "1"
        } else {
          this.currentData.product_type = "2"
        }

        this.$emit('showLoading', true);
        var response = await this.$http(Boolean(this.currentData._id)?"post":"put", `/insurance_product`,this.currentData);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.currentData = {};
          this.$refs['formEdit'].hide()
          this.$refs.dataTable.reloadItems();
        }else {
          this.$emit('showMessage',response.message, "danger");                        
        }
      },


      async onDeleteBenefit(index){
        this.currentData.benefit.splice(index, 1);
      },
      
      async onDeletePlan(index){
        this.currentData.benefit_year_limit.splice(index, 1);

        this.currentData.benefit.forEach(data => { 
          data.plan.splice(index, 1);
        });
      },

      async onAddBenefit() {        
        var newBenefit = {
            plan:[]
        };

        this.currentData.benefit_year_limit.forEach(plandt => {
          newBenefit.plan.push({
            plan_name : plandt.plan_name
          });
        });
        this.currentData.benefit.push(newBenefit);
      },

      async onAddPlan(){
        this.currentData.benefit_year_limit.push(
          {
            plan_name:""
          }  
        )
        this.currentData.benefit.forEach(data => { 
          data.plan.push({
            plan_name:""
          })
        });        
      },

      async onCopyProduct () {
        this.currentData._id = undefined;
        this.currentData.is_active= true;
        this.currentData.code = "";
        this.currentData.name = "";
        this.$emit('showMessage',"Data telah di copy, silahkan edit data dan lalukan save agar data tersimpan.", "danger");                        
      },

      async onIsgGroupChange(benefit){
        if(!benefit.is_group){
          benefit.plan = [];        
          this.currentData.benefit_year_limit.forEach(plandt => {
            benefit.plan.push({
              plan_name : plandt.plan_name
            });
          });
        }
      }
    }
  }
</script>

<style>
  .row1 {
  }

  .col1 {
  }
   
  .editRow {
    margin-top:10px;
  }

  .dataRow {
    padding-top:3px;
    padding-bottom:3px
  }

  .benefitAlternateRow {
    background-color:#f4f4f4;
  }


  @media (min-width: 992px) {
    .modal-xl {
       max-width: 95% !important; width: 95% !important
    }
  }
</style>
