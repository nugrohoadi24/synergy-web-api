<template>
  <div style="height:100%" v-if="currentData !== null && currentData !== undefined">
    <b-tabs card style="height:100%">
      <b-tab title="DETAIL COMPANY" active>
        <b-card header="Claim Document" style="margin-top:15px"
          border-variant="primary" header-bg-variant="primary" header-text-variant="white">

            <MyInputText label="KODE" :value.sync="currentData.code" mx=10 mandatory/> 
            <MyInputText label="NAMA" :value.sync="currentData.name" mx=150 mandatory/> 

            <MyInputText label="COMPANY NPWP" :value.sync="currentData.company_npwp" mx=150 mandatory/> 
            <MyInputText label="COMPANY AKTA" :value.sync="currentData.company_akta" mx=150 mandatory/> 
            <MyInputText label="COMPANY SOP/NIB" :value.sync="currentData.company_sop_nib" mx=150 mandatory/> 
            <MyInputText label="COMPANY KTP" :value.sync="currentData.company_ktp" mx=150 mandatory/> 
            <MyInputText label="COMPANY BANK ACC" :value.sync="currentData.company_bank_acc_no" mx=150 mandatory/> 

            <b-row class="editRow mb-3" >
                <b-col sm="3">
                <label>ACTIVE</label>
                </b-col>
                <b-col sm="9">
                <b-form-checkbox v-model="currentData.is_active"></b-form-checkbox>
                </b-col>          
            </b-row>

            <b-row style="editRow mt-2">
                <b-col sm="3">   
                <div>
                    <label class="inputLabel">KTP </label>
                </div>     
                </b-col>     
                <b-col sm="9">
                <div v-show="pathKTP == ''">
                    <vue-dropzone :useCustomSlot=true style="min-height:150px" 
                        ref="dropzoneKTP" id="dropzoneKTP" 
                        acceptedFileTypes='.pdf'
                        dictRemoveFileConfirmation="Yakin untuk mendelete file?"
                        @vdropzone-thumbnail="thumbnail"
                        @vdropzone-removed-file="onRemoveFile"
                        @vdropzone-error="onUploadError"
                        @vdropzone-success="onUploadSuccess"
                        :options="ktpDropzoneOption">
                        <div class="dropzone-custom-content">
                        <h3 class="dropzone-custom-title">UPLOAD</h3>
                        <div class="subtitle">UPLOAD</div>
                        </div>
                    </vue-dropzone>  
                </div>
                <a :href="pathKTP" target="_blank" v-show="pathKTP !== ''">
                    <vue-dropzone :useCustomSlot=true style="min-height:150px" 
                        ref="dropzoneKTP" id="dropzoneKTP" 
                        acceptedFileTypes='.pdf'
                        dictRemoveFileConfirmation="Yakin untuk mendelete file?"
                        @vdropzone-thumbnail="thumbnail"
                        @vdropzone-removed-file="onRemoveFile"
                        @vdropzone-error="onUploadError"
                        @vdropzone-success="onUploadSuccess"
                        :options="ktpDropzoneOption">
                        <div class="dropzone-custom-content">
                        <h3 class="dropzone-custom-title">UPLOAD</h3>
                        <div class="subtitle">UPLOAD</div>
                        </div>
                    </vue-dropzone>  
                </a>
                </b-col>
            </b-row>

            <b-row style="editRow mt-2">
                <b-col sm="3">   
                <div>
                    <label class="inputLabel">NPWP </label>
                </div>     
                </b-col>     
                <b-col sm="9">
                <div v-show="pathNPWP == ''">
                    <vue-dropzone :useCustomSlot=true style="min-height:150px" 
                        ref="dropzoneNPWP" id="dropzoneNPWP" 
                        acceptedFileTypes='.pdf'
                        dictRemoveFileConfirmation="Yakin untuk mendelete file?"
                        @vdropzone-thumbnail="thumbnail"
                        @vdropzone-removed-file="onRemoveFile"
                        @vdropzone-error="onUploadError"
                        @vdropzone-success="onUploadSuccess"
                        :options="npwpDropzoneOption">
                        <div class="dropzone-custom-content">
                        <h3 class="dropzone-custom-title">UPLOAD</h3>
                        <div class="subtitle">UPLOAD</div>
                        </div>
                    </vue-dropzone>
                </div>
                <a :href="pathNPWP" target="_blank" v-show="pathNPWP !== ''">
                    <vue-dropzone :useCustomSlot=true style="min-height:150px" 
                        ref="dropzoneNPWP" id="dropzoneNPWP" 
                        acceptedFileTypes='.pdf'
                        dictRemoveFileConfirmation="Yakin untuk mendelete file?"
                        @vdropzone-thumbnail="thumbnail"
                        @vdropzone-removed-file="onRemoveFile"
                        @vdropzone-error="onUploadError"
                        @vdropzone-success="onUploadSuccess"
                        :options="npwpDropzoneOption">
                        <div class="dropzone-custom-content">
                        <h3 class="dropzone-custom-title">UPLOAD</h3>
                        <div class="subtitle">UPLOAD</div>
                        </div>
                    </vue-dropzone>
                </a>     
                </b-col>
            </b-row>

            <b-row style="editRow mt-2">
                <b-col sm="3" >        
                <div>
                    <label class="inputLabel">AKTA </label>
                </div>     
                </b-col>     
                <b-col sm="9" >
                <div v-show="pathAKTA == ''">
                    <vue-dropzone :useCustomSlot=true style="min-height:150px" 
                        ref="dropzoneAKTA" id="dropzoneAKTA" 
                        acceptedFileTypes='.pdf'
                        dictRemoveFileConfirmation="Yakin untuk mendelete file?"
                        @vdropzone-thumbnail="thumbnail"
                        @vdropzone-removed-file="onRemoveFile"
                        @vdropzone-error="onUploadError"
                        @vdropzone-success="onUploadSuccess"
                        :options="aktaDropzoneOption">
                        
                        <div class="dropzone-custom-content">
                        <h3 class="dropzone-custom-title">UPLOAD</h3>
                        <div class="subtitle">UPLOAD</div>
                        </div>
                    </vue-dropzone> 
                </div>   
                <a :href="pathAKTA" target="_blank" v-show="pathAKTA !== ''">
                    <vue-dropzone :useCustomSlot=true style="min-height:150px" 
                        ref="dropzoneAKTA" id="dropzoneAKTA" 
                        acceptedFileTypes='.pdf'
                        dictRemoveFileConfirmation="Yakin untuk mendelete file?"
                        @vdropzone-thumbnail="thumbnail"
                        @vdropzone-removed-file="onRemoveFile"
                        @vdropzone-error="onUploadError"
                        @vdropzone-success="onUploadSuccess"
                        :options="aktaDropzoneOption">
                        
                        <div class="dropzone-custom-content">
                        <h3 class="dropzone-custom-title">UPLOAD</h3>
                        <div class="subtitle">UPLOAD</div>
                        </div>
                    </vue-dropzone> 
                </a>    
                </b-col>
            </b-row>

            <b-row style="editRow mt-2">
                <b-col sm="3">        
                <div>
                    <label class="inputLabel">SOP/NIB </label>
                </div>     
                </b-col>     
                <b-col sm="9">
                <div v-show="pathSOP == ''">
                    <vue-dropzone :useCustomSlot=true style="min-height:150px" 
                        ref="dropzoneSOP" id="dropzoneSOP" 
                        acceptedFileTypes='.pdf'
                        dictRemoveFileConfirmation="Yakin untuk mendelete file?"
                        @vdropzone-thumbnail="thumbnail"
                        @vdropzone-removed-file="onRemoveFile"
                        @vdropzone-error="onUploadError"
                        @vdropzone-success="onUploadSuccess"
                        :options="sopNibDropzoneOption">
                        
                        <div class="dropzone-custom-content">
                        <h3 class="dropzone-custom-title">UPLOAD</h3>
                        <div class="subtitle">UPLOAD</div>
                        </div>
                    </vue-dropzone>
                </div>
                <a :href="pathSOP" target="_blank" v-show="pathSOP !== ''">
                    <vue-dropzone :useCustomSlot=true style="min-height:150px" 
                        ref="dropzoneSOP" id="dropzoneSOP" 
                        acceptedFileTypes='.pdf'
                        dictRemoveFileConfirmation="Yakin untuk mendelete file?"
                        @vdropzone-thumbnail="thumbnail"
                        @vdropzone-removed-file="onRemoveFile"
                        @vdropzone-error="onUploadError"
                        @vdropzone-success="onUploadSuccess"
                        :options="sopNibDropzoneOption">
                        
                        <div class="dropzone-custom-content">
                        <h3 class="dropzone-custom-title">UPLOAD</h3>
                        <div class="subtitle">UPLOAD</div>
                        </div>
                    </vue-dropzone>
                </a>   
                </b-col>
            </b-row>
        </b-card>
      </b-tab>
    </b-tabs>
  </div>
</template>

<script>
  import moment from 'moment';
  export default {
    data () {
      return {
        is_destroying:false,
        currentData:{},
        pathKTP:'',
        pathNPWP:'',
        pathAKTA:'',
        pathSOP:'',

        ktpDropzoneOption: {
          url: process.env.API_BASE_URL + "/company/upload_docs/" +this.$route.query.id ,
          acceptedFileTypes:'.pdf',
          paramName: "file",
          thumbnailWidth: 135,
          thumbnailHeight: 150,
          maxFilesize: 1,
          addRemoveLinks:true,
          useCustomSlot:true,
          dictRemoveFile:"Delete",
          dictCancelUpload:"Cancel",
          
          headers: {
            'Authorization': 'Bearer ' + this.$auth.getToken(),
            'type':'KTP'
          }
        },
        npwpDropzoneOption: {
          url: process.env.API_BASE_URL + "/company/upload_docs/" +this.$route.query.id,
          acceptedFileTypes:'.pdf',
          paramName: "file",
          thumbnailWidth: 135,
          thumbnailHeight: 150,
          maxFilesize: 1,
          addRemoveLinks:true,
          useCustomSlot:true,
          dictRemoveFile:"Delete",
          dictCancelUpload:"Cancel",
          
          headers: {
            'Authorization': 'Bearer ' + this.$auth.getToken(),
            'type':'NPWP'
          }
        },
        aktaDropzoneOption: {
          url: process.env.API_BASE_URL + "/company/upload_docs/" +this.$route.query.id,
          acceptedFileTypes:'.pdf',
          paramName: "file",
          thumbnailWidth: 135,
          thumbnailHeight: 150,
          maxFilesize: 1,
          addRemoveLinks:true,
          useCustomSlot:true,
          dictRemoveFile:"Delete",
          dictCancelUpload:"Cancel",
          
          headers: {
            'Authorization': 'Bearer ' + this.$auth.getToken(),
            'type':'AKTA'
          }
        },
        sopNibDropzoneOption: {
          url: process.env.API_BASE_URL + "/company/upload_docs/" +this.$route.query.id,
          acceptedFileTypes:'.pdf',
          paramName: "file",
          thumbnailWidth: 135,
          thumbnailHeight: 150,
          maxFilesize: 1,
          addRemoveLinks:true,
          useCustomSlot:true,
          dictRemoveFile:"Delete",
          dictCancelUpload:"Cancel",
          
          headers: {
            'Authorization': 'Bearer ' + this.$auth.getToken(),
            'type':'SOP_NIB'
          }
        },
      }
    },
    beforeDestroy() {
      this.is_destroying = true;
    },
    destroyed() {
      this.is_destroying = false;
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
      this.loadItems(this.$route.query.id);
    },

    methods: {
      async loadItems(dataId){   
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/company/detail/${dataId}`);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.currentData = response.data;

          if(Boolean(this.currentData.company_attachement)){
            var token = this.$auth.getToken()
            for(var key in  this.currentData.company_attachement){
              var doc = this.currentData.company_attachement[key];
              var file = { size: doc.size ? doc.size:1024 * 1024, name: doc._id, type: doc.mimetype, manuallyAdded:true};
              var url = process.env.API_BASE_URL + "/document" + doc.path + "?token=" + token;

              if(doc.type == "KTP"){
                this.$refs.dropzoneKTP.manuallyAddFile(file, url);
                this.pathKTP = url;
              }
              else if(doc.type == "NPWP"){
                this.$refs.dropzoneNPWP.manuallyAddFile(file, url);
                this.pathNPWP = url;
              }
              else if(doc.type == "AKTA"){
                this.$refs.dropzoneAKTA.manuallyAddFile(file, url);
                this.pathAKTA = url;
              }
              else if(doc.type == "SOP_NIB")
                this.$refs.dropzoneSOP.manuallyAddFile(file, url);
                this.pathSOP = url;
            }
          }
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async saveData(bvModalEvt){
        bvModalEvt.preventDefault();

        this.$emit('showLoading', true);
        var response = await this.$http(Boolean(this.currentData._id)?"post":"put", `/company`,this.currentData);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.currentData = {};
          this.$refs['formEdit'].hide()
          this.$refs.dataTable.reloadItems();
        }else {
          this.$emit('showMessage',response.message, "danger");                        
        }
      },

      thumbnail: function(file, dataUrl) {
        var j, len, ref, thumbnailElement;
        if (file.previewElement) {
           file.previewElement.addEventListener("click", function() {
              window.open(dataUrl, '_blank');
          });
        }
      },

      async onUploadSuccess(file, response){
        if(Boolean(response.data)){
          if(response.is_ok){
          }else {
            this.$emit('showAlert',response.message, "danger");                        
          }
        }else{
            this.$emit('showAlert',"Tidak dapat mengupload file", "danger");                        
        }
      },

      async onUploadError(file, response){
        this.$emit('showMessage',response.message, "danger");                        
      },

      async onRemoveFile(file){
        var idCompany = this.$route.query.id
        if (this.is_destroying) {
          return;
        }

        this.$emit('showLoading', true);
        var response = await this.$http('post', `/company/remove_docs/${idCompany}/${file.name}`);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          this.$emit('showAlert',"Success", "info");                        
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },


    }
  }
</script>

<style>
 
   
  .editRow {
    margin-top:15px;
  }
</style>
