<template>
  <div style="height:100%">
        
    <b-tabs card style="height:100%">
      <b-tab title="Data Polis" active>
        <div class="d-flex justify-content-end align-middle" style="padding-bottom:10px" >
          <h5 class="h4" style="font-weight:bold" >{{currentData.form_status}}</h5>

          <div v-if="method !== 'REJECT'" class="ml-auto p-2">
            <b-button size="md" class="ml-auto p-2" style="width:120px;margin-right:20px" @click="onSave" variant="success"
              v-if="['PENDING REVIEW'].includes(currentData.form_status)">
              <b-icon icon="cloud-upload" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>Process
            </b-button>

            <b-button size="md" style="width:120px;margin-right:20px" @click="onCancel" variant="danger" >
              <b-icon icon="exclamation-square" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>Cancel 
            </b-button>

            <b-button size="md" style="width:120px;color:white" @click="onReject" variant="danger"
              v-if="['PENDING REVIEW'].includes(currentData.form_status)">
              <b-icon icon="X" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>Reject
            </b-button>
          </div>
        </div>

        <b-card header="GENERAL INFORMATION"  
          border-variant="primary"
          header-bg-variant="primary"
          header-text-variant="white"> 
          
          <b-row>
            <b-col sm="6">
              <MyInputText label="CERTIFICATE NO" disabled 
                :value.sync="currentData.form_certificate_no.desc" /> 

              <MyInputText label="HOSPITAL" :value.sync="currentData.form_participant_hospital.name" /> 
              
              <div v-if="currentData.form_reporter == 'PESERTA'">
                <MyInputText label="NAMA PELAPOR" :value.sync="currentData.form_submit_signature" mx=100 /> 

                <MyInputText label="NO TELP PELAPOR" :value.sync="currentData.form_participant_phone_number" mx=30 :inputNumber=true  /> 

                <MyInputText label="EMAIL PELAPOR" :value.sync="currentData.form_participant_email" mx=100 /> 

                <MyInputText label="RELASI PELAPOR" :value.sync="currentData.form_reporter" mx=40 /> 

                <MyInputText label="NIK PELAPOR" :value.sync="currentData.form_identity_card_no" mx=16 :inputNumber=true /> 
              </div>
              <div v-else>
                <div v-for="currentData in currentData.form_reporter_detail" :key="currentData._id">
                  <MyInputText label="NAMA PELAPOR" disabled :value.sync="currentData.reporter_name" mx=100 /> 

                  <MyInputText label="NO TELP PELAPOR" :value.sync="currentData.reporter_phone_number" mx=30 :inputNumber=true  /> 

                  <MyInputText label="EMAIL PELAPOR" :value.sync="currentData.reporter_email" mx=100 /> 

                  <MyInputText label="RELASI PELAPOR" :value.sync="currentData.reporter_relation" mx=40 /> 

                  <MyInputText label="NIK PELAPOR" disabled :value.sync="currentData.reporter_nik" mx=16 :inputNumber=true /> 
                </div>
              </div>

              <MyInputText label="METHOD" disabled :value.sync="currentData.form_type" mx=40 /> 

              <MyInputText label="NOMOR CLAIM" disabled :value.sync="currentData.form_claim_no" mx=40 />

              <MyInputText label="NOMOR SUBMIT" disabled :value.sync="currentData.form_submit_no" mx=40 />

            </b-col>

            <b-col sm="6">
              <MyInputText label="ID PESERTA" :value.sync="currentData.form_participant_user_id" mx=100 disabled/>

              <MyInputText label="NAMA TERTANGGUNG" :value.sync="currentData.form_participant_name" mx=100 /> 
              
              <MyInputText label="NIK TERTANGGUNG" :value.sync="currentData.form_identity_card_no" mx=100 /> 
              
              <MyInputDate label="DOB TERTANGGUNG" :value.sync="currentData.form_certificate_no.dob_tertanggung" /> 
              
              <div v-if="currentData.form_reason_submit == 'KECELAKAAN'">
                <div v-for="item in currentData.form_reason_incident_detail" :key="item._id">
                  <MyInputTextArea label="ALASAN CLAIM" :value.sync="currentData.form_reason_submit" mx=500 />

                  <MyInputDate label="TANGGAL KEJADIAN" :value.sync="item.incident_date"/>

                  <b-row class="editRow">
                    <b-col sm="3">
                      <label>WAKTU KEJADIAN</label>
                    </b-col>
                    <b-col sm="9">
                      <b-form-timepicker label="TANGGAL KEJADIAN" v-model="item.incident_hour" :hour12="false" />
                    </b-col>
                  </b-row>

                  <MyInputText label="PENYEBAB KEJADIAN" :value.sync="item.incident_cause" mx=100 />

                  <MyInputTextArea label="KRONOLOGI KEJADIAN" :value.sync="item.incident_chronogical" mx=500 /> 

                  <MyInputText label="BAGIAN YANG TERLUKA" :value.sync="item.incident_body_part_injured" mx=100 />
                </div>
              </div>
              <div v-else>
                <div v-for="item in currentData.form_reason_sick_detail" :key="item._id">
                  <MyInputTextArea label="ALASAN CLAIM" :value.sync="currentData.form_reason_submit" mx=500 />

                  <MyInputDate label="TANGGAL KEJADIAN" :value.sync="item.sick_recognized_at"/>
                  
                  <MyInputTextArea label="KRONOLOGI KEJADIAN" :value.sync="item.sick_chronogical" mx=500 /> 
                </div>
              </div>
            </b-col>

            <div v-if="currentData.form_type == 'REIMBURSE'" class="col-sm-12 no-pad">
              <div class="horizontal-line"></div>
              <b-col sm="6">
                <div v-for="item in currentData.form_participant_bank_acc" :key="item._id">
                  <MyInputText label="NAMA BANK" :value.sync="item.bank_acc_name" mx=100 />

                  <MyInputText label="NOMOR REKENING" :value.sync="item.bank_acc_number" mx=100 />

                  <MyInputText label="NAMA PEMILIK" :value.sync="item.bank_name" mx=100 />
                </div>
              </b-col>
            </div>

            <div class="horizontal-line"></div>

            <div class="col-sm-12 text-center">
              <label>PERNYATAAN PERSETUJUAN</label>
              <label class="mt-2" v-if="currentData.form_type == 'CASHLESS'">
                Dengan ini saya selaku Peserta/Wali/Pelapor yang bertindak atas nama Peserta dalam menyampaikan keterangan ini dengan sebenarnya dan tanpa paksaan, dan mengajukan laporan permintaan Klaim Cashless atas nama Peserta. <br><br>
                Dengan klik tombol submit, saya setuju bahwa seluruh data yang saya sampaikan melalui kanal ini dapat digunakan untuk kebutuhan pemprosesan klaim atas nama Peserta, dimana dapat diteruskan ke pihak penyedia Kesehatan Rekanan, Konsultasi Asuransi atau penanggung yang terafiliasi dengan Salvus Health. <br><br>
                Berikut saya cantumkan nama lengkap sesuai dalam KTP, untuk dianggap sah sebagai tanda tangan basah saya.
              </label>
              <label class="mt-2" v-else>
                Dengan ini saya selaku Peserta/Wali/Pelapor yang bertindak atas nama Peserta dalam menyampaikan keterangan ini dengan sebenarnya dan tanpa paksaan, dan mengajukan laporan permintaan Klaim Reimburse atas nama Peserta. <br><br>
                Dengan klik tombol submit, saya setuju bahwa seluruh data yang saya sampaikan melalui kanal ini dapat digunakan untuk kebutuhan pemprosesan klaim atas nama Peserta, dimana dapat diteruskan ke pihak penyedia Kesehatan Rekanan, Konsultasi Asuransi atau penanggung yang terafiliasi dengan Salvus Health. <br><br>
                Berikut saya cantumkan nama lengkap sesuai dalam KTP, untuk dianggap sah sebagai tanda tangan basah saya.
              </label>
              <label>
                {{ currentData.form_submit_signature }}
              </label>
            </div>
          </b-row>

        </b-card>
        
        <b-card header="Claim Document" style="margin-top:15px"
          border-variant="primary" header-bg-variant="primary" header-text-variant="white"> 

          <b-row style="margin-bottom:10px">
            <b-col sm="4">   
              <div class="d-flex justify-content-center align-middle">
                <label class="inputLabel">KTP </label>
              </div>     
            </b-col>     
            <b-col sm="8">
              <vue-dropzone :useCustomSlot=true style="min-height:150px" 
                ref="dropzoneKTP" id="dropzoneKTP" 
                acceptedFileTypes='.jpeg,.jpg,.png,.bmp'
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
            </b-col>
           </b-row>

          <b-row style="margin-bottom:10px">
            <b-col sm="4">   
              <div class="d-flex justify-content-center align-middle">
                <label class="inputLabel">RESUME MEDIS </label>
              </div>     
            </b-col>     
            <b-col sm="8">
              <vue-dropzone :useCustomSlot=true style="min-height:150px" 
                ref="dropzoneResumeMedis" id="dropzoneResumeMedis" 
                acceptedFileTypes='.jpeg,.jpg,.png,.bmp'
                dictRemoveFileConfirmation="Yakin untuk mendelete file?"
                @vdropzone-thumbnail="thumbnail"
                @vdropzone-removed-file="onRemoveFile"
                @vdropzone-error="onUploadError"
                @vdropzone-success="onUploadSuccess"
                :options="resumeMedisDropzoneOption">
                <div class="dropzone-custom-content">
                  <h3 class="dropzone-custom-title">UPLOAD</h3>
                  <div class="subtitle">UPLOAD</div>
                </div>
              </vue-dropzone>      
            </b-col>
          </b-row>

          <b-row style="margin-bottom:10px">
            <b-col sm="4" >        
              <div class="d-flex justify-content-center align-middle">
                <label class="inputLabel">COPY RESEP </label>
              </div>     
            </b-col>     
            <b-col sm="8" >
              <vue-dropzone :useCustomSlot=true style="min-height:150px" 
                ref="dropzoneCopyResep" id="dropzoneCopyResep" 
                acceptedFileTypes='.jpeg,.jpg,.png,.bmp'
                dictRemoveFileConfirmation="Yakin untuk mendelete file?"
                @vdropzone-thumbnail="thumbnail"
                @vdropzone-removed-file="onRemoveFile"
                @vdropzone-error="onUploadError"
                @vdropzone-success="onUploadSuccess"
                :options="dropzoneCopyResepOption">
                
                <div class="dropzone-custom-content">
                  <h3 class="dropzone-custom-title">UPLOAD</h3>
                  <div class="subtitle">UPLOAD</div>
                </div>
              </vue-dropzone>      
            </b-col>
          </b-row>

          <b-row style="margin-bottom:10px">
            <b-col sm="4">        
              <div class="d-flex justify-content-center align-middle">
                <label class="inputLabel">KWITANSI BIAYA PERAWATAN TERAKHIR </label>
              </div>     
            </b-col>     
            <b-col sm="8">
              <vue-dropzone :useCustomSlot=true style="min-height:150px" 
                ref="dropzoneLastReceipt" id="dropzoneLastReceipt" 
                acceptedFileTypes='.jpeg,.jpg,.png,.bmp'
                dictRemoveFileConfirmation="Yakin untuk mendelete file?"
                @vdropzone-thumbnail="thumbnail"
                @vdropzone-removed-file="onRemoveFile"
                @vdropzone-error="onUploadError"
                @vdropzone-success="onUploadSuccess"
                :options="dropzoneLastReceiptOptions">
                <div class="dropzone-custom-content">
                  <h3 class="dropzone-custom-title">UPLOAD</h3>
                  <div class="subtitle">UPLOAD</div>
                </div>
              </vue-dropzone>      
            </b-col>
          </b-row>

          <b-row style="margin-bottom:10px">
            <b-col sm="4">
              <div class="d-flex justify-content-center align-middle">
                <label class="inputLabel">DOKUMEN LAINNYA</label>
              </div>     
            </b-col>     
            <b-col sm="8">
              <vue-dropzone :useCustomSlot=true style="min-height:150px" 
                ref="dropzoneOthers" id="dropzoneOthers" 
                acceptedFileTypes='.jpeg,.jpg,.png,.bmp'
                dictRemoveFileConfirmation="Yakin untuk mendelete file?"
                @vdropzone-thumbnail="thumbnail"
                @vdropzone-error="onUploadError"
                @vdropzone-removed-file="onRemoveFile"
                @vdropzone-success="onUploadSuccess"
                :options="dropzoneOthersOptions">
                <div class="dropzone-custom-content">
                  <h3 class="dropzone-custom-title">Upload</h3>
                  <div class="subtitle">Upload</div>
                </div>
              </vue-dropzone>      
            </b-col>
          </b-row>

        </b-card>        
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
        is_destroying:false,
        loading: false,  
        viewAction:this.$route.query.action,

        ktpDropzoneOption: {
          url: process.env.API_BASE_URL + "/digital_form/upload_docs/" +this.$route.query.id,
          acceptedFileTypes:'.jpeg,.jpg,.png,.bmp',
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
        resumeMedisDropzoneOption: {
          url: process.env.API_BASE_URL + "/digital_form/upload_docs/" +this.$route.query.id,
          acceptedFileTypes:'.jpeg,.jpg,.png,.bmp',
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
            'type':'RESUME_MEDIS'
          }
        },
        dropzoneCopyResepOption: {
          url: process.env.API_BASE_URL + "/digital_form/upload_docs/" +this.$route.query.id,
          acceptedFileTypes:'.jpeg,.jpg,.png,.bmp',
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
            'type':'COPY_RESEP'
          }
        },

        dropzoneLastReceiptOptions :{
          url: process.env.API_BASE_URL + "/digital_form/upload_docs/" +this.$route.query.id,
          acceptedFileTypes:'.jpeg,.jpg,.png,.bmp',
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
            'type':'LAST_RECEIPT'
          }
        },

        dropzoneOthersOptions :{
          url: process.env.API_BASE_URL + "/digital_form/upload_docs/" +this.$route.query.id,
          acceptedFileTypes:'.jpeg,.jpg,.png,.bmp',
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
            'type':'OTHERS'
          }
        },

        currentData:{
          form_attachement:{},
          form_certificate_no:{},
          form_participant_hospital:{},
          form_user_submit:{}
        },

        method:"",
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
      this.method = this.$route.query.method;
      await this.loadData(this.$route.query.id); 
    },

    beforeDestroy() {
      this.is_destroying = true;
    },
    destroyed() {
      this.is_destroying = false;
    },

    methods: {
      thumbnail: function(file, dataUrl) {
        var j, len, ref, thumbnailElement;
        if (file.previewElement) {
           file.previewElement.addEventListener("click", function() {
              window.open(dataUrl, '_blank');
          });
        }
      },

      async loadData(dataid){
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/digital_form/detail/${dataid}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.currentData = response.data;

          var desc = this.currentData.form_certificate_no.certificate_no + ' / ' + this.currentData.form_certificate_no.nama_tertanggung
          this.currentData.form_certificate_no.desc = desc

          if(Boolean(this.currentData.form_attachement)){
            var token = this.$auth.getToken()
            for(var key in  this.currentData.form_attachement){
              var doc = this.currentData.form_attachement[key];
              var file = { size: doc.size ? doc.size:1024 * 1024, name: doc._id, type: doc.mimetype };
              var url = process.env.API_BASE_URL + "/document" + doc.path + "?token=" + token;

              if(doc.type == "RESUME_MEDIS")
                this.$refs.dropzoneResumeMedis.manuallyAddFile(file, url);
              else if(doc.type == "COPY_RESEP")
                this.$refs.dropzoneCopyResep.manuallyAddFile(file, url);
              else if(doc.type == "LAST_RECEIPT")
                this.$refs.dropzoneLastReceipt.manuallyAddFile(file, url);
              else if(doc.type == "OTHERS")
                this.$refs.dropzoneOthers.manuallyAddFile(file, url);
              else if(doc.type == "KTP")
                this.$refs.dropzoneKTP.manuallyAddFile(file, url);
            }
          }

        } else {
          this.$emit('showAlert',response.message, "danger");                        
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
        var idForm = this.$route.query.id
        if (this.is_destroying) {
          return;
        }

        this.$emit('showLoading', true);
        var response = await this.$http('post', `/digital_form/remove_docs/${idForm}/${file.name}`);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          this.$emit('showAlert',"Success", "info");                        
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

       async onSave(){
        this.$emit('showLoading', true);

        let chronogical = ''

        if(this.currentData.form_reason_submit == 'KECELAKAAN'){
          this.currentData.form_reason_incident_detail.forEach( item => {
            chronogical = item.incident_chronogical
          })
        } else {
          this.currentData.form_reason_sick_detail.forEach( item => {
            chronogical = item.sick_chronogical
          })
        }

        let saveData = {
          form_id: this.currentData._id,
          hospital:this.currentData.form_participant_hospital._id,
          policy_id:this.currentData.form_certificate_no._id,
          requester_name:this.currentData.form_participant_name,
          requester_phone:this.currentData.form_participant_phone_number,
          requester_email:this.currentData.form_participant_email,
          requester_relation:this.currentData.form_reporter,
          requester_nik:this.currentData.form_identity_card_no,
          claim_reason:this.currentData.form_reason_submit,
          accident_description: chronogical,
          requester_product_type:this.currentData.form_certificate_no.product_type,
          nama_tertanggung:this.currentData.form_submit_signature,
        }
        var response = await this.$http('post', `/digital_form/proccess`, saveData);
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.$router.go(-1);
        }else {
          this.$emit('showMessage',response.message, "danger");                        
        }
      },

      async onCancel(){
        this.$router.go(-1);
      },

      async onReject(){        

       this.$bvModal.msgBoxConfirm('Apakah anda yakin untuk menreject Pending Claim ini?') 
        .then(async value => {
          if(value) {
            this.$emit('showLoading', true);
            var response = await this.$http('put', `/digital_form/reject/${this.currentData._id}`,null);
            this.$emit('showLoading', false);
            
            if(response.is_ok){
              this.$router.go(-1);
            }else { 
              this.$emit('showMessage',response.message, "danger");                        
            }
          }
        })
        .catch(err => {
          // An error occurred
        })
      },
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
  .showDocuments
  {
    width: 100%;
    height: 155px;
    border: 2px solid #e5e5e5;
    font-family: Arial,sans-serif;
    letter-spacing: .2px;
    color: #777;
    background: white;
    transition: .2s linear;
  }
  .showDocuments img {
    height: 150px;
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
  .horizontal-line {
    width: 100%;
    margin-top: 20px;
    margin-bottom: 20px;
    border: 0;
    border-top: 3px solid #808080;
  }

  .no-pad {
    padding: 0 !important;
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