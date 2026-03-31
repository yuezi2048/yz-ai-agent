import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import UserLoginPage from "@/pages/user/UserLoginPage.vue";
import ACCESS_ENUM from "@/access/accessEnum.ts";
import UserManagePage from "@/pages/admin/UserManagePage.vue";
import ClientManagePage from "@/pages/invoice/ClientManagePage.vue";
import CompanyManagePage from "@/pages/base/CompanyManagePage.vue";
import InvoiceQueryPage from "@/pages/invoice/InvoiceQueryPage.vue";
import BankTransactionPage from "@/pages/finance/BankTransactionPage.vue";
import InputInvoicePage from "@/pages/finance/InputInvoicePage.vue";
import AccountsReceivablePage from "@/pages/finance/AccountsReceivablePage.vue";
import TransferMethodPage from "@/pages/base/TransferMethodPage.vue";
import InvoiceTypePage from "@/pages/base/InvoiceTypePage.vue";
import MarkPage from "@/pages/base/MarkPage.vue";
import InputInvoicePurposePage from '@/pages/base/InputInvoicePurposePage.vue';
import PermissionPage from '@/pages/base/PermissionPage.vue';
import EmployeeManagePage from "@/pages/employee/EmployeeManagePage.vue";
import EmployeePermissionPage from "@/pages/employee/EmployeePermissionPage.vue";
import StatisticsPage from "@/pages/bi/StatisticsPage.vue";
import SupplierManagePage from "@/pages/supplier/SupplierManagePage.vue";
import ChangePasswordPage from "@/pages/user/ChangePasswordPage.vue";
import ProfilePage from "@/pages/user/ProfilePage.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: '主页',
      component: HomePage,
      meta: {
        access: ACCESS_ENUM.USER, // 所有已登录用户都可以访问
        title: '主页',
      },
    },
    {
      path: '/user/login',
      name: '登录',
      component: UserLoginPage,
      meta: { layout: false }
    },
    {
      path: '/user/changePassword',
      name: '修改密码',
      component: ChangePasswordPage,
      meta: {
        access: ACCESS_ENUM.USER, // 所有已登录用户都可以修改密码
        title: '修改密码',
      },
    },
    {
      path: '/user/profile',
      name: '个人资料',
      component: ProfilePage,
      meta: {
        access: ACCESS_ENUM.USER, // 所有已登录用户都可以访问
        title: '个人资料',
      },
    },
    {
      path: '/admin/userManage',
      name: '用户管理',
      component: UserManagePage,
      meta: {
        access: ACCESS_ENUM.SUPER_ADMIN, // 仅管理员
      },
    },
    {
      path: '/invoice/client',
      name: '客户管理',
      component: ClientManagePage,
      meta: {
        access: ACCESS_ENUM.BUSINESS_USER, // 业务岗位、管理员可以访问
      },
    },
    {
      path: '/invoice/company',
      name: '公司管理',
      component: CompanyManagePage,
      meta: {
        access: ACCESS_ENUM.BUSINESS_USER, // 业务岗位、管理员可以访问（基础信息模块）
      },
    },
    {
      path: '/invoice/info/query',
      name: '销项发票',
      component: InvoiceQueryPage,
      meta: {
        access: ACCESS_ENUM.BUSINESS_USER, // 业务岗位、管理员可以访问
        title: '销项发票',
      },
    },
    {
      path: '/finance/bank/transaction',
      name: '银行收支明细',
      component: BankTransactionPage,
      meta: {
        access: ACCESS_ENUM.FINANCE_USER, // 财务岗位、管理员可以访问
        title: '银行收支明细',
      },
    },
    {
      path: '/finance/input/invoice',
      name: '进项发票管理',
      component: InputInvoicePage,
      meta: {
        access: ACCESS_ENUM.FINANCE_USER, // 财务岗位、管理员可以访问
        title: '进项发票管理',
      },
    },
    {
      path: '/finance/accounts/receivable',
      name: '应收账款列表',
      component: AccountsReceivablePage,
      meta: {
        access: ACCESS_ENUM.FINANCE_USER, // 财务岗位、管理员可以访问
        title: '应收账款列表',
      },
    },
    {
      path: '/base/company',
      name: '公司信息',
      component: CompanyManagePage,
      meta: {
        access: ACCESS_ENUM.BUSINESS_USER, // 业务岗位、管理员可以访问
        title: '公司信息',
      },
    },
    {
      path: '/base/transfer/method',
      name: '票据种类',
      component: TransferMethodPage,
      meta: {
        access: ACCESS_ENUM.BUSINESS_USER, // 业务岗位、管理员可以访问
        title: '票据种类',
      },
    },
    {
      path: '/base/invoice/type',
      name: '发票种类',
      component: InvoiceTypePage,
      meta: {
        access: ACCESS_ENUM.BUSINESS_USER, // 业务岗位、管理员可以访问
        title: '发票种类',
      },
    },
    {
      path: '/base/mark',
      name: '销票标注',
      component: MarkPage,
      meta: {
        access: ACCESS_ENUM.BUSINESS_USER, // 业务岗位、管理员可以访问
        title: '销票标注',
      },
    },
    {
      path: '/base/input/invoice/purpose',
      name: '进票用途',
      component: InputInvoicePurposePage,
      meta: {
        access: ACCESS_ENUM.BUSINESS_USER, // 业务岗位、管理员可以访问
        title: '进票用途',
      },
    },
    {
      path: '/base/permission',
      name: '权限管理',
      component: PermissionPage,
      meta: {
        access: ACCESS_ENUM.SUPER_ADMIN, // 仅管理员
        title: '权限管理',
      },
    },
    {
      path: '/employee/manage',
      name: '员工信息维护',
      component: EmployeeManagePage,
      meta: {
        access: ACCESS_ENUM.FINANCE_USER, // 财务岗位、管理员可以访问
        title: '员工信息维护',
      },
    },
    {
      path: '/employee/permission',
      name: '权限维护',
      component: EmployeePermissionPage,
      meta: {
        access: ACCESS_ENUM.SUPER_ADMIN, // 仅管理员
        title: '权限维护',
      },
    },
    {
      path: '/bi/statistics',
      name: '报表查询',
      component: StatisticsPage,
      meta: {
        access: ACCESS_ENUM.SUPER_ADMIN, // 仅管理员
        title: '报表查询',
      },
    },
    {
      path: '/supplier/list',
      name: '供应商信息管理',
      component: SupplierManagePage,
      meta: {
        access: ACCESS_ENUM.BUSINESS_USER, // 业务岗位、管理员可以访问
        title: '供应商信息管理',
      },
    },
  ],
})

export default router
