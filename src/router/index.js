import Vue from 'vue'
import Router from 'vue-router'
import Login from '@/components/Login'

import Home from '@/components/Home'
import MasterAdmin from '@/components/MasterAdmin'
import MasterUser from '@/components/MasterUser'
import CompanyView from '@/components/CompanyView'
import ProvinceView from '@/components/ProvinceView'
import CityView from '@/components/CityView'
import DistrictView from '@/components/DistrictView'
import SubdistrictView from '@/components/SubdistrictView'
import HospitalView from '@/components/HospitalView'
import InsuranceProductView from '@/components/InsuranceProductView'
import ImportUserView from '@/components/ImportUserView'
import ImportUserPolicyView from '@/components/ImportUserPolicyView'
import UserPolicyView from '@/components/UserPolicyView'
import UserPolicyDetailView  from '@/components/UserPolicyDetailView'
import ClaimListView  from '@/components/ClaimListView'
import ClaimCreateView  from '@/components/ClaimCreateView'
import ClaimProcessView  from '@/components/ClaimProcessView'
import ClaimProcessListView  from '@/components/ClaimProcessListView'
import ClaimClosureListView  from '@/components/ClaimClosureListView'
import ClaimPendingView from '@/components/ClaimPendingView'
import ClaimProcessPendingView from '@/components/ClaimProcessPendingView'
import CompanyPolicyView  from '@/components/CompanyPolicyView'
import ReportClaimRatioView  from '@/components/ReportClaimRatioView'
import ReportClaimDetailView  from '@/components/ReportClaimDetailView'
import ChangePasswordView  from '@/components/ChangePasswordView'
import ReportClaimTopTenView  from '@/components/ReportClaimTopTenView'
import AnnouncementView  from '@/components/AnnouncementView'
import ResetPassUser  from '@/components/ResetPassUser'
import MobileActionMessageView from '@/components/MobileActionMessageView'
import MasterRoleAccess from '@/components/MasterRoleAccess'
import MasterVoucherView from '@/components/MasterVoucherView'
import ImportVoucherWalletView from '@/components/ImportVoucherWalletView'
import VoucherWalletView from '@/components/VoucherWalletView'
import ImportVoucherWalletApproveView from '@/components/ImportVoucherWalletApproveView'
import StoreTransactionView from '@/components/StoreTransactionView'
import CompanyPolicyDepositView from '@/components/CompanyPolicyDepositView'
import ImportProviderView from '@/components/ImportProviderView'
import DashboardHR from '@/components/DashboardHR'
import CompanyViewDetail from '@/components/CompanyViewDetail'

Vue.use(Router)

var router = new Router({
  mode: 'hash',
  routes: [
    {
      path: '/',
      name: 'Login',
      alias:['/login'],
      component: Login
    },
    {
      path: '/home',
      name: 'Home',
      component: Home,
      meta:{
        requiresAuth:true
      }
    },
    {
      path: '/role',
      name: 'MasterRole',
      component: MasterRoleAccess,
      meta:{
        code: 'MROLE',
        requiresAuth:true
      }
    },
    {
      path: '/master_admin',
      name: 'MasterAdmin',
      component: MasterAdmin,
      meta:{
        code: 'MADMIN',
        requiresAuth:true
      }
    },
    {
      path: '/master_user',
      name: 'MasterUser',
      component: MasterUser,
      meta:{
        code: 'MUSER',
        requiresAuth:true
      }
    },
    {
      path: '/company',
      name: 'CompanyView',
      component: CompanyView,
      meta:{
        code: 'MCOMPANY',
        requiresAuth:true
      }
    },
    {
      path: '/province',
      name: 'ProvinceView',
      component: ProvinceView,
      meta:{
        code: 'MPROVINCE',
        requiresAuth:true
      }
    },
    {
      path: '/city',
      name: 'CityView',
      component: CityView,
      meta:{
        code: 'MCITY',
        requiresAuth:true
      }
    },
    {
      path: '/district',
      name: 'DistrictView',
      component: DistrictView,
      meta:{
        code: 'MDISTRICT',
        requiresAuth:true
      }
    },
    {
      path: '/subdistrict',
      name: 'SubdistrictView',
      component: SubdistrictView,
      meta:{
        code: 'MVILLAGE',
        requiresAuth:true
      }
    },
    {
      path: '/hospital',
      name: 'HospitalView',
      component: HospitalView,
      meta:{
        code: 'MHOSPITAL',
        requiresAuth:true
      }
    },
    {
      path: '/insurance_product',
      name: 'InsuranceProductView',
      component: InsuranceProductView,
      meta:{
        code: 'MINSPRODUCT',
        requiresAuth:true
      }
    },
    {
      path: '/import_user',
      name: 'ImportUserView',
      component: ImportUserView,
      meta:{
        code: 'MUSERUPLOAD',
        requiresAuth:true
      }
    },
    {
      path: '/import_user_policy',
      name: 'ImportUserPolicyView',
      component: ImportUserPolicyView,
      meta:{
        code: 'MPARTICIPANTUPLOAD',
        requiresAuth:true
      }
    },
    {
      path: '/user_policy',
      name: 'UserPolicyView',
      component: UserPolicyView,
      meta:{
        code: 'MPARTICIPANT',
        requiresAuth:true
      }
    },
    {
      path: '/user_policy/detail',
      name: 'UserPolicyDetailView',
      component: UserPolicyDetailView,
      props: route => ({ queryid: route.query.id }),
      meta:{
        code: 'MPARTICIPANT',
        requiresAuth:true
      }
    },
    {
      path: '/claim',
      name: 'ClaimListView',
      component: ClaimListView,
      meta:{
        code: 'CLAIM',
        requiresAuth:true
      }
    },
    {
      path: '/claim_create',
      name: 'ClaimCreateView',
      component: ClaimCreateView,
      meta:{
        code: 'CLAIM',
        requiresAuth:true
      }
    },
    {
      path: '/claim_process_list',
      name: 'ClaimProcessView',
      component: ClaimProcessListView,
      meta:{
        code: 'CLAIM',
        requiresAuth:true
      }
    },
    {
      path: '/claim_process',
      name: 'ClaimProcessView',
      component: ClaimProcessView,
      meta:{
        code: 'CLAIM',
        requiresAuth:true
      }
    },
    {
      path: '/claim_closure',
      name: 'ClaimClosureListView',
      component: ClaimClosureListView,
      meta:{
        code: 'CLAIM',
        requiresAuth:true
      }
    },
    {
      path: '/claim_pending',
      name: 'ClaimPendingView',
      component: ClaimPendingView,
      meta:{
        code: 'CLAIM',
        requiresAuth:true
      }
    },
    {
      path: '/claim_process_pending',
      name: 'ClaimProcessPendingView',
      component: ClaimProcessPendingView,
      meta:{
        code: 'CLAIM',
        requiresAuth:true
      }
    },
    {
      path: '/company_policy',
      name: 'CompanyPolicyView',
      component: CompanyPolicyView,
      meta:{
        code: 'MCOMPPOLICY',
        requiresAuth:true
      }
    },
    {
      path: '/report/claim_ratio',
      name: 'ReportClaimRatioView',
      component: ReportClaimRatioView,
      meta:{
        code: 'RCLAIMRATIO',
        requiresAuth:true
      }
    },
    {
      path: '/report/claim_detail',
      name: 'ReportClaimDetailView',
      component: ReportClaimDetailView,
      meta:{
        code: 'RCLAIMDETAIL',
        requiresAuth:true
      }
    },
    {
      path: '/report/topten',
      name: 'ChangePasswordView',
      component: ReportClaimTopTenView,
      meta:{
        code: 'RTOPTEN',
        requiresAuth:true
      }
    },
    {
      path: '/change_password',
      name: 'ChangePasswordView',
      component: ChangePasswordView,
      meta:{
        code: '',
        requiresAuth:true
      }
    },
    {
      path: '/announcement',
      name: 'AnnouncementView',
      component: AnnouncementView,
      meta:{
        code: 'ANNOUNCEMENT',
        requiresAuth:true
      }
    },
    {
      path: '/resetpassusr',
      name: 'ResetPassUser',
      component: ResetPassUser,
      meta:{
        code: '',
      }
    },
    {
      path: '/msg',
      name: 'msg',
      component: MobileActionMessageView,
      meta:{
        code: '',
      }
    },
    {
      path: '/voucher',
      name: 'Voucher',
      component: MasterVoucherView,
      meta:{
        code: 'VOUCHER',
        requiresAuth:true
      }
    },
    {
      path: '/import_voucher',
      name: 'ImportVoucherWallet',
      component: ImportVoucherWalletView,
      meta:{
        code: 'IMPORTVOUCHERWALLET',
        requiresAuth:true
      }
    },
    {
      path: '/approve_import_voucher',
      name: 'ImportVoucherWallet',
      component: ImportVoucherWalletApproveView,
      meta:{
        code: 'IMPORTVOUCHERWALLETAPPROVE',
        approve : true,
        requiresAuth:true
      }
    },

    {
      path: '/voucher_wallet',
      name: 'VoucherWallet',
      component: VoucherWalletView,
      meta:{
        code: 'VOUCHERWALLET',
        requiresAuth:true
      }
    },
    {
      path: '/store_transaction',
      name: 'StoreTransaction',
      component: StoreTransactionView,
      meta:{
        code: 'ORDERTRANSACTION',
        requiresAuth:true
      }
    },
	{
      path: '/deposit',
      name: 'Deposit',
      component: CompanyPolicyDepositView,
      meta:{
        code: 'MDEPOSIT',
        requiresAuth:true
      }
    },    
    {
      path: '/import_provider',
      name: 'ImportProvider',
      component: ImportProviderView,
      meta:{
        code: 'MIMPORTPROVIDER',
        requiresAuth:true
      }
    },
    {
      path: '/dashboard-hr',
      name: 'DashboardHR',
      component: DashboardHR,
      meta:{
        code: 'MUSER',
        requiresAuth:true
      }
    },
    {
      path: '/company_detail',
      name: 'CompanyViewDetail',
      component: CompanyViewDetail,
      props: route => ({ queryid: route.query.id }),
      meta:{
        code: 'MCOMPANY',
        requiresAuth:true
      }
    },
  ]
})

router.beforeEach((to, from, next) => {
  if(to.matched.some(record => record.meta.requiresAuth)) {  
      if (Vue.prototype.$auth.getToken() == null) {
          next({
              path: '/login',
              params: { nextUrl: to.fullPath }
              
          })
      } else {
        next();
      }
  } else {
    next();
  }
})

export default router
