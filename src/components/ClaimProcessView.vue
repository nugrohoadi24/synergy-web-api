<template>
  <div style="height:100%">
        
    <b-tabs card style="height:100%">
      <b-tab title="Data Polis" active>
       <div class="d-flex justify-content-end align-middle" style="padding-bottom:10px" >
         <h5 class="h4" style="font-weight:bold" >{{this.method}}</h5>

         <div v-if="method !== 'REIMBURSE'" class="ml-auto p-2">
          <b-button size="md" class="ml-auto p-2" style="width:120px;margin-right:20px" @click="onSave" variant="primary" 
            :disabled="!this.updateEnable" v-if="['PROCESSED'].includes(currentData.claim_status)">
            <b-icon icon="cloud-upload" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>SAVE
          </b-button>

          <b-button size="md" class="ml-auto p-2" style="width:120px;margin-right:20px" variant="primary" 
            :disabled="!this.updateEnable" v-if="['SJM_SENT'].includes(currentData.claim_status)" v-b-modal.attention>
            <b-icon icon="cloud-upload" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>SAVE
          </b-button>

          <b-button size="md"  style="width:120px;color:white;margin-right:20px"  @click="onCancel" variant="danger" >
            <b-icon icon="exclamation-square" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>CANCEL 
          </b-button>

          <b-button size="md" style="width:120px;color:white;margin-right:20px" @click="onViewSJM" variant="dark"
            v-if="Boolean(currentData.surat_jaminan_masuk_no)">
            <b-icon icon="box-arrow-in-right" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>VIEW SJM
          </b-button>

          <b-button size="md" style="width:180px;color:white;margin-right:20px" @click="onCreateSJP" variant="success"  
            :disabled="!this.updateEnable" v-if="['PROCESSED','SPB_CREATED','SPB_SENT'].includes(currentData.claim_status) || Boolean(currentData.surat_jaminan_keluar_no)">                        
            <b-icon icon="box-arrow-right" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>BUAT/LIHAT SJP
          </b-button>

          <b-button size="md" style="width:180px;color:white;margin-right:20px" @click="onCreateSPB" variant="success"  
            :disabled="!this.updateEnable" v-if="['PROCESSED','SPB_CREATED','SPB_SENT'].includes(currentData.claim_status) || Boolean(currentData.surat_perkiraan_biaya_no)">            
            <b-icon icon="credit-card-fill" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>BUAT/LIHAT SPB
          </b-button>

          <b-button size="md" style="width:180px;color:white;margin-right:20px" @click="onSendSuratJaminanMasuk" variant="info" 
            :disabled="!this.updateEnable" v-if="['SJM_SENT'].includes(currentData.claim_status)" >
            <b-icon icon="envelope-fill" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>KIRIM SJM
          </b-button>

          <b-button size="md" style="width:180px;color:white;margin-right:20px" @click="onSentSPBAndSJP" variant="warning"  
            :disabled="!this.updateEnable"  v-if="['SPB_CREATED','SPB_SENT'].includes(currentData.claim_status)">
            <b-icon icon="envelope-fill" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>KIRIM SJP DAN SPB
          </b-button>

          <b-button size="md" :disabled="!this.updateEnable" style="width:120px;color:white" v-b-modal.reasonReject variant="danger"
            v-if="['SJM_SENT'].includes(currentData.claim_status)">
            <b-icon icon="X" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>Reject
          </b-button>
         </div>

         <div v-else class="ml-auto p-2">
          <b-button size="md" class="ml-auto p-2" style="width:120px;margin-right:20px" @click="onSave" variant="primary" 
            :disabled="!this.updateEnable" v-if="['PROCESSED'].includes(currentData.claim_status)">
            <b-icon icon="cloud-upload" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>SAVE
          </b-button>

          <b-button size="md" class="ml-auto p-2" style="width:120px;margin-right:20px" variant="primary" 
            :disabled="!this.updateEnable" v-if="['CLAIM_DETAIL'].includes(currentData.claim_status)" v-b-modal.attention>
            <b-icon icon="cloud-upload" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>SAVE
          </b-button>

          <b-button size="md" style="width:120px;margin-right:20px" @click="onCancel" variant="danger" >
            <b-icon icon="exclamation-square" aria-hidden="true" style="color:white;margin-right:10px"></b-icon>Cancel 
          </b-button>

          <b-button size="md" :disabled="!this.updateEnable" style="width:120px;color:white" v-b-modal.reasonReject variant="danger"
            v-if="['CLAIM_DETAIL'].includes(currentData.claim_status)">
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
              <MyInputText label="CERTIFICATE NO" disabled :value.sync="currentData.policy.desc" /> 

              <MyInputText label="HOSPITAL" disabled :value.sync="currentData.hospital.name" /> 
              
              <MyInputText label="NAMA PELAPOR" disabled :value.sync="currentData.requester_name" mx=100 /> 

              <MyInputText label="NO TELP PELAPOR" disabled :value.sync="currentData.requester_phone" mx=30 :inputNumber=true  /> 

              <MyInputText label="EMAIL PELAPOR" disabled :value.sync="currentData.requester_email" mx=100 /> 

              <MyInputText label="RELASI PELAPOR" disabled :value.sync="currentData.requester_relation" mx=40 /> 

              <MyInputText label="NIK PELAPOR" disabled :value.sync="currentData.requester_nik" mx=16 :inputNumber=true /> 

              <b-row class="editRow">      
                <b-col sm="4">
                    <label class="inputLabel">Cashless </label>
                </b-col> 
                <b-col sm="8">
                    <b-form-checkbox disabled v-model="currentData.cashless"/>
                </b-col> 
              </b-row>

            </b-col>

            <b-col sm="6">
              <MyInputText label="NAMA TERTANGGUNG" disabled :value.sync="currentData.policy.nama_tertanggung" mx=100 /> 
              <MyInputText label="NIK TERTANGGUNG" disabled :value.sync="currentData.policy.nik_tertanggung" mx=100 /> 
              <MyInputDate label="DOB TERTANGGUNG" disabled :value.sync="currentData.policy.dob_tertanggung" /> 
              <MyInputTextArea label="ALASAN CLAIM" disabled :value.sync="currentData.claim_reason" mx=500 /> 
              <MyInputDate label="TANGGAL KEJADIAN" disabled :value.sync="currentData.incident_date" v-if="currentData.incident_date !== undefined && currentData.incident_date !== null"/>
              <MyInputDate label="TANGGAL KEJADIAN" disabled :value.sync="currentData.created_at" v-else/>
              <MyInputTextArea label="KRONOLOGI KEJADIAN" disabled :value.sync="currentData.accident_description" mx=500 /> 
              <MyInputText label="BAGIAN TUBUH TERLUKA" disabled :value.sync="currentData.incident_body_part_injured" mx=100 />
            </b-col>
          </b-row>

          <div v-if="method !== 'REIMBURSE'">
            <b-row >
              <b-col sm="6">
                <div v-if="Boolean(currentData.surat_jaminan_masuk_by)" class="d-flex justify-content-center align-middle statusBox">
                  <label>Surat jaminan Masuk Dicetak Oleh <b>{{currentData.surat_jaminan_masuk_by.name}}</b> Pada <b>{{currentData.surat_jaminan_masuk_at | formatDateTime}}</b></label>              
                </div>
              </b-col>
              <b-col sm="6">
                <div  v-if="Boolean(currentData.surat_jaminan_keluar_by)" class="d-flex justify-content-center align-middle statusBox">
                  <label>Surat Jaminan Keluar Dicetak oleh <b>{{currentData.surat_jaminan_keluar_by.name}}</b> Pada <b>{{currentData.surat_jaminan_keluar_at | formatDateTime}}</b></label>              
                </div>
              </b-col>
            </b-row>

            <b-row>
              <b-col sm="6">
                <div  v-if="Boolean(currentData.surat_jaminan_masuk_sent_by)" class="d-flex justify-content-center align-middle statusBox">
                  <label>Surat jaminan Masuk Dikirim Oleh <b>{{currentData.surat_jaminan_masuk_sent_by.name}}</b> Pada <b>{{currentData.surat_jaminan_masuk_sent_at | formatDateTime}}</b></label>              
                </div>
              </b-col>
              <b-col sm="6">
                <div  v-if="Boolean(currentData.surat_jaminan_keluar_sent_by)" class="d-flex justify-content-center align-middle statusBox">
                  <label>Surat Jaminan Keluar Dikirim Oleh <b>{{currentData.surat_jaminan_keluar_sent_by.name}}</b> Pada <b>{{currentData.surat_jaminan_keluar_sent_at | formatDateTime}}</b></label>              
                </div>
              </b-col>
            </b-row>
          </div>

        </b-card>

        <b-card header="PROCESS CLAIM INFORMATION" style="margin-top:15px" 
          border-variant="primary" header-bg-variant="primary" header-text-variant="white"> 

          <b-row>
            <b-col sm="6">
              <MyInputText label="NAMA DOKTER" :value.sync="currentData.doctor_name" mx=100 /> 

              <MyInputSearchableSelect label="DIAGNOSA" :value.sync="currentData.diagnose" v-on:loadItems="loadDiagnose" 
                :items="diagnoseSelectData" value_field="_id" text_field="name" /> 

              <MyInputDate label="TANGGAL ADMISSION" :value.sync="currentData.admission_date" /> 

            </b-col>
            <b-col sm="6">
              <MyInputTextArea label="DIAGNOSA NOTE" :value.sync="currentData.diagnose_note" mx=500 /> 
              
              <MyInputDate label="TANGGAL DISCHARGE" :value.sync="currentData.discharge_date" /> 
            </b-col>
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

      <b-tab title="Benefit" style="height:100%" >                          
       <div class="d-flex" style="padding-bottom:5px" >
          <b-button class="ml-auto p-2" size="md" @click="onCalculate" variant="success" >
            <b-icon icon="calculator" aria-hidden="true" style="margin-right:10px"></b-icon>KALKULASI CLAIM 
          </b-button>
        </div>
        
        <b-row class="headerRow" align-v="center">
          <b-col class="headerCol" sm="3">
            <label>BENEFIT</label>
          </b-col>
          <b-col class="headerCol" sm="2">
            <label>REMAINING LIMIT</label>
          </b-col>
          <b-col class="headerCol" sm="3">
            <label>CLAIMED AMOUNT</label>
          </b-col>
          <b-col class="headerCol" sm="3">
            <label>APPROVED AMOUNT </label>
          </b-col>
          <b-col class="headerCol" sm="1">
            <label>EXCESS </label>
          </b-col>
        </b-row>      

        <div style="overflow-y:scroll;height:80%;width:100%;" v-if="['SJM_SENT','CLAIM_DETAIL'].includes(currentData.claim_status)">
          <div v-for="(benefit,idx) in currentData.policy_benefit_detail" :key="benefit.key">
            <b-row align-v="center" v-if="!benefit.is_group"
              v-bind:style='{"padding-top":"5px","padding-bottom":"10px","font-weight":"normal", "color":"#404040", "background-color":(idx%2==0?"#f6f6f6":"#ffffff") }'>                
              
              <b-col class="col1" sm="3">
                <label>{{(benefit.is_group?"# ":"") + benefit.name}}
                  <b-icon v-if="!benefit.is_group" icon="info-square" aria-hidden="true" style="margin-left:10px"  v-b-popover.hover.top="benefit.benefit_note" title="note"></b-icon>
                </label>
              </b-col>

              <b-col class="col1" sm="2">
                <div v-if="Boolean(benefit.usage1.availableValue)">
                  <label> {{formatThousandGroup(benefit.usage1.availableValue) + " " + formatUnitName(benefit.usage1.valueType,benefit.usage1.durationType,benefit.unit_name)}}</label>
                </div>

                <div v-if="Boolean(benefit.usage2.availableValue) && benefit.usage2.valueType != 'AsClaim'">
                  <label> {{formatThousandGroup(benefit.usage2.availableValue) + " " + formatUnitName(benefit.usage2.valueType,benefit.usage2.durationType,benefit.unit_name)}}</label>                  
                </div>

                <div v-if="Boolean(benefit.unit_price_limit) && Boolean(benefit.unit_name)">
                  <label> {{"Limit Claim Per " + benefit.unit_name + " " +  formatThousandGroup(benefit.unit_price_limit)}}</label>
                </div>
              </b-col>


              <b-col class="col1" sm="3">
                <div class="d-flex justify-content-start align-items-middle" v-if="benefit.unit==1" >
                  <label class="inputLabel">Amount</label>
                  <money size="sm" style="width:100px;" class="form-control form-control-sm"  v-model="benefit.claim_amount"></money>
                </div>
                <div class="d-flex justify-content-start align-items-middle" v-if="benefit.unit==2" >
                  <label class="inputLabel">Jumlah</label>
                  <money size="sm" class="form-control form-control-sm" style="width:50px" v-model="benefit.claim_jumlah"></money>
                  <label class="inputLabel" style="margin-left:15px">Amount</label>
                  <money size="sm" class="form-control form-control-sm" style="width:100px" v-model="benefit.claim_amount"></money>
                </div>    

                <div style="margin-top:5px">
                  <b-form-input placeholder="Claim Note" v-model="benefit.claim_note" size="sm" @keypress="onKeyPressKeepPosition($event)" :formatter="upperFormatter"  />       
                </div>
              </b-col>


              <b-col class="col1" sm="3">
                <div class="d-flex justify-content-start align-items-middle" v-if="benefit.unit==1" >
                  <label class="inputLabel">Amount</label>
                  <money size="sm" style="width:100px;" class="form-control form-control-sm"  v-model="benefit.covered_amount"></money>
                </div>
                <div class="d-flex justify-content-start align-items-middle" v-if="benefit.unit==2" >
                  <label class="inputLabel">Jumlah</label>
                  <money size="sm" class="form-control form-control-sm" style="width:50px" v-model="benefit.covered_jumlah"></money>
                  <label class="inputLabel" style="margin-left:15px">Amount</label>
                  <money size="sm" class="form-control form-control-sm" style="width:100px" v-model="benefit.covered_amount"></money>
                </div>    
              </b-col>

              <b-col class="col1" sm="1">
                <money size="sm" class="form-control form-control-sm" 
                  v-bind:style='{"font-weight":"bold", "color":(benefit.excess_amount>0?"#FF0000":"#c0c0c0")}' v-model="benefit.excess_amount"/>
              </b-col>
            </b-row> 

            <b-row align-v="center" v-else
              v-bind:style='{"padding-top":"5px","padding-bottom":"10px","font-weight":"bold", "color":"#ffffff", "background-color":"#2789E1" }'>                
              
              <b-col class="col1" sm="3">
                <label>{{"# " + benefit.name}}
                </label>
              </b-col>
            </b-row> 
          </div>

          <b-row>  
            <b-col class="col1" sm="12" v-if="!Boolean(this.currentData.policy_benefit_detail)">
              <label align-self="middle" style="margin-top:5px">No data</label>
            </b-col>
          </b-row>  
        </div>

        <div style="overflow-y:scroll;height:80%;width:100%;" v-else>
          <div v-for="(benefit,idx) in currentData.policy_benefit_detail" :key="benefit.key">
            <b-row align-v="center" v-if="!benefit.is_group"
              v-bind:style='{"padding-top":"5px","padding-bottom":"10px","font-weight":"normal", "color":"#404040", "background-color":(idx%2==0?"#f6f6f6":"#ffffff") }'>                
              
              <b-col class="col1" sm="3">
                <label>{{(benefit.is_group?"# ":"") + benefit.name}}
                  <b-icon v-if="!benefit.is_group" icon="info-square" aria-hidden="true" style="margin-left:10px"  v-b-popover.hover.top="benefit.benefit_note" title="note"></b-icon>
                </label>
              </b-col>

              <b-col class="col1" sm="2">
                <div v-if="Boolean(benefit.usage1.availableValue)">
                  <label> {{formatThousandGroup(benefit.usage1.availableValue) + " " + formatUnitName(benefit.usage1.valueType,benefit.usage1.durationType,benefit.unit_name)}}</label>
                </div>

                <div v-if="Boolean(benefit.usage2.availableValue) && benefit.usage2.valueType != 'AsClaim'">
                  <label> {{formatThousandGroup(benefit.usage2.availableValue) + " " + formatUnitName(benefit.usage2.valueType,benefit.usage2.durationType,benefit.unit_name)}}</label>                  
                </div>

                <div v-if="Boolean(benefit.unit_price_limit) && Boolean(benefit.unit_name)">
                  <label> {{"Limit Claim Per " + benefit.unit_name + " " +  formatThousandGroup(benefit.unit_price_limit)}}</label>
                </div>
              </b-col>


              <b-col class="col1" sm="3">
                <div class="d-flex justify-content-start align-items-middle" v-if="benefit.unit==1" >
                  <label class="inputLabel">Amount</label>
                  <money size="sm" style="width:100px;" class="form-control form-control-sm"  v-model="benefit.claim_amount" disabled></money>
                </div>
                <div class="d-flex justify-content-start align-items-middle" v-if="benefit.unit==2" >
                  <label class="inputLabel">Jumlah</label>
                  <money size="sm" class="form-control form-control-sm" style="width:50px" v-model="benefit.claim_jumlah" disabled></money>
                  <label class="inputLabel" style="margin-left:15px">Amount</label>
                  <money size="sm" class="form-control form-control-sm" style="width:100px" v-model="benefit.claim_amount" disabled></money>
                </div>    

                <div style="margin-top:5px">
                  <b-form-input placeholder="Claim Note" v-model="benefit.claim_note" size="sm" @keypress="onKeyPressKeepPosition($event)" :formatter="upperFormatter"  disabled/>       
                </div>
              </b-col>


              <b-col class="col1" sm="3">
                <div class="d-flex justify-content-start align-items-middle" v-if="benefit.unit==1" >
                  <label class="inputLabel">Amount</label>
                  <money size="sm" style="width:100px;" class="form-control form-control-sm"  v-model="benefit.covered_amount" disabled></money>
                </div>
                <div class="d-flex justify-content-start align-items-middle" v-if="benefit.unit==2" >
                  <label class="inputLabel">Jumlah</label>
                  <money size="sm" class="form-control form-control-sm" style="width:50px" v-model="benefit.covered_jumlah" disabled></money>
                  <label class="inputLabel" style="margin-left:15px">Amount</label>
                  <money size="sm" class="form-control form-control-sm" style="width:100px" v-model="benefit.covered_amount" disabled></money>
                </div>    
              </b-col>

              <b-col class="col1" sm="1">
                <money size="sm" class="form-control form-control-sm" 
                  v-bind:style='{"font-weight":"bold", "color":(benefit.excess_amount>0?"#FF0000":"#c0c0c0")}' v-model="benefit.excess_amount" disabled/>
              </b-col>
            </b-row> 

            <b-row align-v="center" v-else
              v-bind:style='{"padding-top":"5px","padding-bottom":"10px","font-weight":"bold", "color":"#ffffff", "background-color":"#2789E1" }'>                
              
              <b-col class="col1" sm="3">
                <label>{{"# " + benefit.name}}
                </label>
              </b-col>
            </b-row> 
          </div>

          <b-row>  
            <b-col class="col1" sm="12" v-if="!Boolean(this.currentData.policy_benefit_detail)">
              <label align-self="middle" style="margin-top:5px">No data</label>
            </b-col>
          </b-row>  
        </div>



        <b-row class="footerRow" align-v="center">
          <b-col  sm="3">
            <label>Limit Tahunan</label>
          </b-col>
          <b-col  sm="2">
              <label>{{formatThousandGroup(this.currentData.yearly_usage_limit)}}</label>
          </b-col>
          <b-col  sm="2">
              <label>{{formatThousandGroup(this.currentData.yearly_usage)}}</label> 
          </b-col>
        </b-row> 
      </b-tab>
    </b-tabs>
    
    <DataIdentity :data="this.currentData"/>

    <b-modal id="reasonReject" title="REASON REJECT" class="text-uppercase"
      size="lg" scrollable  lazy  centered
      ok-title="Save" cancel-title="Cancel" @ok="onReject">
      <MyInputTextArea label="REASON REJECT" :value.sync="currentData.insurance_product_reject_note" mx=500 mandatory/>
    </b-modal>

    <b-modal id="attention" ref="attention" title="PERHATIAN"
      ok-title="Save" cancel-title="Cancel" @ok="onSave" >
      <p class="my-4">
        Detail klaim TIDAK BISA DIUBAH setelah Anda submit. ANDA YAKIN?
      </p>
    </b-modal>
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
          url: process.env.API_BASE_URL + "/claim/upload/" +this.$route.query.id,
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
          url: process.env.API_BASE_URL + "/claim/upload/" +this.$route.query.id,
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
          url: process.env.API_BASE_URL + "/claim/upload/" +this.$route.query.id,
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
          url: process.env.API_BASE_URL + "/claim/upload/" +this.$route.query.id,
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
          url: process.env.API_BASE_URL + "/claim/upload/" +this.$route.query.id,
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
          policy:{
            insurance_product:{
              benefit:[],
              benefit_year_limit:{}
            },
          },
          diagnose:{},
          hospital:{},
          cashless:false,
          user:{},
          policy_benefit_detail:[],
          insurance_product_reject_note:""
        },
        productData:{
          benefit_year_limit:[{limit:0}]
        },
        diagnoseSelectData:{page:1,pages:1,total:0,limit:10,docs: []},
        hospitalSelectData:{page:1,pages:1,total:0,limit:10,docs: []},
        userPolicySelectData:{page:1,pages:1,total:0,limit:10,docs: []},

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
      await this.loadDiagnose(1,"",false,10,"");
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
        var response = await this.$http('get', `/claim/detail/${dataid}`);
        this.$emit('showLoading', false);
        if(response.is_ok){
          this.currentData = response.data;
          console.log('data', this.currentData)

          //Set Diagnose with code and name
          if(this.currentData.diagnose !== undefined) {
            let codeName = this.currentData.diagnose;
            let code_name = codeName.code + ' - ' + codeName.name
            codeName.name = code_name;
          }

          if(Boolean(this.currentData.document)){
            var token = this.$auth.getToken()
            for(var key in  this.currentData.document){
              var doc = this.currentData.document[key];
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
          
          if(Boolean(this.currentData.claim) && Boolean(this.currentData.policy_benefit_detail)){
            for(var cnt=0;cnt<this.currentData.policy_benefit_detail.length;cnt++){
              var claimTmp = this.currentData.claim.find(clm => { return this.currentData.policy_benefit_detail[cnt]._id == clm.benefit});

              if(Boolean(claimTmp)){
                this.currentData.policy_benefit_detail[cnt].claim_jumlah = claimTmp.claim_jumlah;
                this.currentData.policy_benefit_detail[cnt].claim_amount = claimTmp.claim_amount;
                this.currentData.policy_benefit_detail[cnt].covered_amount = claimTmp.covered_amount;
                this.currentData.policy_benefit_detail[cnt].covered_jumlah = claimTmp.covered_jumlah;
                this.currentData.policy_benefit_detail[cnt].excess_amount = claimTmp.excess_amount;
                this.currentData.policy_benefit_detail[cnt].claim_note = claimTmp.claim_note;
              }
            }
          }else{
            await this.loadPolicyDetail(this.currentData.policy._id);        
          }

        } else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadPolicyDetail(dataid) {
        this.$emit('showLoading', true);
        var response = await this.$http('get', `/user_policy/detail/claim/${dataid}`);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          this.currentData.policy_benefit_detail = response.data.policy_benefit_detail;                    
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },

      async loadDiagnose(page,sortBy,sortDesc,limit,search){  
        var response = await this.$http('get', `/diagnose/selection?page=${page}&perpage=${limit}&searchquery=${search}&sb=${(sortDesc?"-":"") + sortBy}`);
        
        if(response.is_ok){
          this.diagnoseSelectData = response.data;

          //Set Diagnose with code and name
          let codeName = this.diagnoseSelectData.docs;
          codeName.forEach( item => {
            let code_name = item.code + ' - ' + item.name
            
            item.name = code_name;
          })
        }else {
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
        if (this.is_destroying) {
          return;
        }

        this.$emit('showLoading', true);
        var response = await this.$http('post', `/claim/upload/remove/${this.currentData._id}/${file.name}`);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          this.$emit('showAlert',"Success", "info");                        
        }else {
          this.$emit('showAlert',response.message, "danger");                        
        }
      },
        
      async onSave(){
        var errmsg =""

        this.currentData.claim = [];
        for(var x=0;x<this.currentData.policy_benefit_detail.length;x++){
          var benefit = this.currentData.policy_benefit_detail[x];
          if(Boolean(benefit.claim_jumlah) || Boolean(benefit.claim_amount)){
            this.currentData.claim.push({
              benefit:benefit._id,
              claim_jumlah:benefit.claim_jumlah,
              claim_amount:benefit.claim_amount,
              covered_amount:benefit.covered_amount,
              covered_jumlah:benefit.covered_jumlah,
              claim_note:benefit.claim_note
            });
          }
        };

        if(this.currentData.claim_status == "SJM_SENT" || this.currentData.claim_status == "CLAIM_DETAIL"){
          this.$refs['attention'].show()
        }

        this.$emit('showLoading', true);
        var response = await this.$http('put', `/claim/process/${this.currentData._id}`,this.currentData);
        
        if(this.currentData.cashless == false && this.currentData.claim_status == "PROCESSED"){
          var response = await this.$http('post', `/claim/pending_reimburse/${this.currentData._id}` ,this.currentData);
        }
        this.$emit('showLoading', false);

        if(response.is_ok){
          this.currentData = {};
          this.$router.go(-1);
        }else {
          this.$emit('showMessage',response.message, "danger");                        
        }
      },

      async onCalculate(){
        var max = 0;

        for(var x=0 ; x<this.currentData.policy_benefit_detail.length ; x++){
          if(max < this.currentData.policy_benefit_detail[x].key) {
            max = this.currentData.policy_benefit_detail[x].key;
          }
        }

        for(var x=0;x<this.currentData.policy_benefit_detail.length;x++){
          var benefit = this.currentData.policy_benefit_detail[x];
          if(Boolean(benefit.claim_jumlah) || Boolean(benefit.claim_amount)){
            benefit.excess_amount = benefit.claim_amount - benefit.covered_amount;
          }
          benefit.key = max+1;
          max++;
        }
      },

      async onViewSJM(){        
        let accessToken = this.$auth.getToken();
        window.open(process.env.API_BASE_URL + "/claim/create_surat_jam/" + this.currentData._id + "?token=" + accessToken , '_blank');
      },

      async onCancel(){
        this.$router.go(-1);
      },
      
      async onCreateSJP(){        
        let accessToken = this.$auth.getToken();
        window.open(process.env.API_BASE_URL + "/claim/surat_jaminan_pulang/" + this.currentData._id + "?token=" + accessToken , '_blank');
      },

      async onCreateSPB(){        
        let accessToken = this.$auth.getToken();
        window.open(process.env.API_BASE_URL + "/claim/surat_perkiraan_biaya/" + this.currentData._id + "?token=" + accessToken , '_blank');
      },

      async onSentSPBAndSJP(){        
        this.$emit('showLoading', true);
        var response = await this.$http('post', `/claim/sent_spb/${this.currentData._id}` ,this.currentData);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          this.$emit('showMessage',response.message, "success");                        
          this.loadData(response.data._id);
        }else { 
          this.$emit('showMessage',response.message, "danger");                        
        }        
      },

      async onSendSuratJaminanMasuk(){        
        this.$emit('showLoading', true);
        var response = await this.$http('post', `/claim/sent_sjm/${this.currentData._id}` ,this.currentData);
        this.$emit('showLoading', false);
        
        if(response.is_ok){
          this.$emit('showMessage',response.message, "success");                        
          this.loadData(response.data._id);
        }else { 
          this.$emit('showMessage',response.message, "danger");                        
        }
      },

      async onReject(){
        let check_claim_amount= 0;
        let check_covered_amount= 0;

        this.currentData.claim = [];
        for(var x=0;x<this.currentData.policy_benefit_detail.length;x++){
          var benefit = this.currentData.policy_benefit_detail[x];
          if(Boolean(Boolean(benefit.covered_jumlah) || Boolean(benefit.covered_amount) || Boolean(benefit.claim_jumlah) || Boolean(benefit.claim_amount)) ){
            this.currentData.claim.push({
              benefit:benefit._id,
              claim_jumlah:benefit.claim_jumlah,
              claim_amount:benefit.claim_amount,
              covered_amount:benefit.covered_amount,
              covered_jumlah:benefit.covered_jumlah,
              claim_note:benefit.claim_note
            });

            check_claim_amount = benefit.claim_amount;
            check_covered_amount = benefit.covered_amount;
          }
        };

        if(check_covered_amount == 0 && check_claim_amount == 0) {
          
          //ACTION REJECT
          let reasonReject = {
            insurance_product_reject_note: this.currentData.insurance_product_reject_note
          }

          this.$emit('showLoading', true);
          var response = await this.$http('post', `/claim/reject/${this.currentData._id}`, reasonReject);
          this.$emit('showLoading', false);
          
          if(response.is_ok){
            this.$router.go(-1);
          }else { 
            this.$emit('showMessage',response.message, "danger");                        
          }
        }
        else if(check_covered_amount == 0 && check_claim_amount > 0) {
          if(this.currentData.document.length > 0) {
            //ACTION REJECT
            let reasonReject = {
              insurance_product_reject_note: this.currentData.insurance_product_reject_note
            }

            this.$emit('showLoading', true);
            var response = await this.$http('post', `/claim/reject/${this.currentData._id}`, reasonReject);
            this.$emit('showLoading', false);
            
            if(response.is_ok){
              this.$router.go(-1);
            }else { 
              this.$emit('showMessage',response.message, "danger");                        
            }

          } else {
            this.$emit('showAlert',"If Claim Amount not 0, you must upload document, Please reload this page!", "info");
          }
        } else {
          this.$emit('showAlert',"Approved Amount must 0, Please reload this page!", "info");
        }
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
