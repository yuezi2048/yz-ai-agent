<template>
  <div id="profilePage">
    <a-card>
      <template #title>
        <div class="card-title-wrapper">
          <a-tabs v-model:activeKey="activeTab" class="card-title-tabs">
            <a-tab-pane key="basic" tab="基础信息" />
          </a-tabs>
        </div>
      </template>
      <div class="card-body-scroll">
        <a-form
          v-show="activeTab === 'basic'"
            ref="formRef"
            :model="formData"
            layout="horizontal"
            :rules="rules"
            :validate-trigger="['submit']"
            @finish="handleSubmit"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 18 }"
          >
            <!-- ▎ 个人信息（左边分隔符用蓝色样式） -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-divider">▎</span>
                <span>个人信息</span>
              </div>

              <!-- 第一行：姓名、工号、联系电话、性别（4+4+4+2+1，24列布局） -->
              <a-row :gutter="[16, 16]">
                <a-col :span="6">
                  <a-form-item label="姓名" name="name" :rules="[{ required: true, message: '请输入姓名' }]">
                    <a-input v-model:value="formData.name" placeholder="请输入姓名" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="工号" name="employeeNo" :rules="[{ required: true, message: '请输入工号' }]">
                    <a-input v-model:value="formData.employeeNo" placeholder="请输入工号" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="联系电话">
                    <a-input v-model:value="formData.phone" placeholder="请输入联系电话" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="性别">
                    <a-select v-model:value="formData.gender" placeholder="请选择性别" style="width: 100%" allow-clear>
                      <a-select-option value="男">男</a-select-option>
                      <a-select-option value="女">女</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
              </a-row>

              <!-- 第二行：身份证号、出生日期、年龄、户口性质（4+4+4+2+1，24列布局） -->
              <a-row :gutter="[16, 16]">
                <a-col :span="6">
                  <a-form-item label="身份证号">
                    <a-input v-model:value="formData.idCard" placeholder="请输入身份证号" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="出生日期">
                    <a-date-picker
                      v-model:value="formData.birthDate"
                      placeholder="请选择出生日期"
                      style="width: 100%"
                      format="YYYYMMDD"
                      value-format="YYYY-MM-DD"
                      allow-clear
                      @change="handleBirthDateChange"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="年龄">
                    <a-input v-model:value="formData.age" placeholder="自动计算" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="户口性质">
                    <a-select v-model:value="formData.householdType" placeholder="请选择户口性质" style="width: 100%" allow-clear>
                      <a-select-option value="城镇">城镇</a-select-option>
                      <a-select-option value="农村">农村</a-select-option>
                      <a-select-option value="其他">其他</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
              </a-row>

              <!-- 第三行：婚育状况、籍贯、户籍地址、居住地址（4+4+4+2+1，24列布局） -->
              <a-row :gutter="[16, 16]">
                <a-col :span="6">
                  <a-form-item label="婚育状况">
                    <a-select v-model:value="formData.maritalStatus" placeholder="请选择婚育状况" style="width: 100%" allow-clear>
                      <a-select-option value="未婚">未婚</a-select-option>
                      <a-select-option value="已婚">已婚</a-select-option>
                      <a-select-option value="离异">离异</a-select-option>
                      <a-select-option value="其他">其他</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="籍贯">
                    <a-input v-model:value="formData.nativePlace" placeholder="请输入籍贯" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="户籍地址">
                    <a-input v-model:value="formData.householdAddress" placeholder="请输入户籍地址" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="居住地址">
                    <a-input v-model:value="formData.residenceAddress" placeholder="请输入居住地址" allow-clear />
                  </a-form-item>
                </a-col>
              </a-row>

              <!-- 第四行：首次参保年月、邮件（4+4+4+2+1，24列布局，但只有2个字段，每个占6列） -->
              <a-row :gutter="[16, 16]">
                <a-col :span="6">
                  <a-form-item label="首次参保年月">
                    <a-date-picker
                      v-model:value="formData.firstInsuranceDate"
                      placeholder="请选择首次参保年月"
                      style="width: 100%"
                      format="YYYYMM"
                      picker="month"
                      value-format="YYYY-MM"
                      allow-clear
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="邮件">
                    <a-input v-model:value="formData.email" placeholder="请输入邮件" allow-clear />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>

            <!-- ▎紧急联系人信息 -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-divider">▎</span>
                <span>紧急联系人信息</span>
              </div>

              <!-- 一行3个输入框（每个占8列） -->
              <a-row :gutter="[16, 16]">
                <a-col :span="6">
                  <a-form-item label="联系人姓名">
                    <a-input v-model:value="formData.emergencyContactName" placeholder="请输入联系人姓名" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="关系">
                    <a-select v-model:value="formData.emergencyContactRelation" placeholder="请选择关系" style="width: 100%" allow-clear>
                      <a-select-option value="家属">家属</a-select-option>
                      <a-select-option value="朋友">朋友</a-select-option>
                      <a-select-option value="其他">其他</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="联系电话">
                    <a-input v-model:value="formData.emergencyContactPhone" placeholder="请输入联系电话" allow-clear />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>

            <!-- ▎教育经历 -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-divider">▎</span>
                <span>教育经历</span>
              </div>

              <!-- 一行4个输入框 -->
              <a-row :gutter="[16, 16]">
                <a-col :span="6">
                  <a-form-item label="学历">
                    <a-select v-model:value="formData.educationLevel" placeholder="请选择学历" style="width: 100%" allow-clear>
                      <a-select-option value="大专">大专</a-select-option>
                      <a-select-option value="大专以下">大专以下</a-select-option>
                      <a-select-option value="本科">本科</a-select-option>
                      <a-select-option value="本科以上">本科以上</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="学习形式">
                    <a-select v-model:value="formData.educationType" placeholder="请选择学习形式" style="width: 100%" allow-clear>
                      <a-select-option value="全日制">全日制</a-select-option>
                      <a-select-option value="自考">自考</a-select-option>
                      <a-select-option value="成考">成考</a-select-option>
                      <a-select-option value="其他">其他</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="毕业院校">
                    <a-input v-model:value="formData.graduationSchool" placeholder="请输入毕业院校" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="专业">
                    <a-input v-model:value="formData.major" placeholder="请输入专业" allow-clear />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>

            <!-- ▎入职信息 -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-divider">▎</span>
                <span>入职信息</span>
              </div>

              <!-- 第一行：公司名称、所属部门、岗位（公司名称占12列，所属部门和岗位各占6列） -->
              <a-row :gutter="[16, 16]">
                <a-col :span="12">
                  <a-form-item label="公司名称" name="companyName" :rules="[{ required: true, message: '请选择公司名称' }]"
                             :label-col="{ span: 3 }" :wrapper-col="{ span: 21 }">
                    <a-auto-complete
                      v-model:value="formData.companyName"
                      :options="filteredCompanyNameOptions"
                      placeholder="选择或输入公司名称"
                      style="width: 100%"
                      allow-clear
                      @select="handleCompanyNameSelect"
                      @change="handleCompanyNameChange"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="所属部门">
                    <a-input v-model:value="formData.department" placeholder="请输入所属部门" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="岗位">
                    <a-input v-model:value="formData.position" placeholder="请输入岗位" allow-clear />
                  </a-form-item>
                </a-col>
              </a-row>

              <!-- 第二行：入职日期、转正日期、备注（每个占6列） -->
              <a-row :gutter="[16, 16]">
                <a-col :span="6">
                  <a-form-item label="入职日期">
                    <a-date-picker
                      v-model:value="formData.hireDate"
                      placeholder="请选择入职日期"
                      style="width: 100%"
                      format="YYYYMMDD"
                      value-format="YYYY-MM-DD"
                      allow-clear
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="转正日期">
                    <a-date-picker
                      v-model:value="formData.regularDate"
                      placeholder="请选择转正日期"
                      style="width: 100%"
                      format="YYYYMMDD"
                      value-format="YYYY-MM-DD"
                      allow-clear
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="备注">
                    <a-input v-model:value="formData.remark1" placeholder="请输入备注" allow-clear />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>

            <a-row>
              <a-col :span="24">
                <a-form-item>
                  <a-space>
                    <a-button type="primary" html-type="submit" :loading="loading">确认修改</a-button>
                    <a-button @click="handleReset">重置</a-button>
                  </a-space>
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
      </div>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { getLoginUserUsingGet, updateEmployeeUsingPost, listEmployeeUsingPost } from '@/api/yuangongguanlijiekou'
import { listCompanyByPageUsingPost } from '@/api/gongsixinxijiekou'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import dayjs, { type Dayjs } from 'dayjs'
import { useAutoCompleteWithExtra } from '@/hooks/common/useAutoCompleteWithExtra'

const router = useRouter()
const formRef = ref()
const loginUserStore = useLoginUserStore()
const loading = ref(false)
const activeTab = ref('basic')

// 计算年龄
const calculateAge = (birthDate: Dayjs | string | null | undefined): number | string => {
  if (!birthDate) return ''
  const birth = typeof birthDate === 'string' ? dayjs(birthDate) : birthDate
  if (!birth || !birth.isValid()) return ''
  const today = dayjs()
  let age = today.year() - birth.year()
  const monthDiff = today.month() - birth.month()
  if (monthDiff < 0 || (monthDiff === 0 && today.date() < birth.date())) {
    age--
  }
  return age
}

const formData = reactive({
  employeeNo: '',
  companyId: 0,
  companyName: '', // 用于 AutoComplete 显示
  name: '',
  gender: '',
  birthDate: undefined as Dayjs | undefined,
  age: '' as number | string,
  phone: '',
  idCard: '',
  householdType: '',
  maritalStatus: '',
  nativePlace: '',
  householdAddress: '',
  residenceAddress: '',
  firstInsuranceDate: undefined as Dayjs | undefined,
  email: '',
  emergencyContactName: '',
  emergencyContactRelation: '',
  emergencyContactPhone: '',
  educationLevel: '',
  educationType: '',
  graduationSchool: '',
  major: '',
  department: '',
  position: '',
  hireDate: undefined as Dayjs | undefined,
  regularDate: undefined as Dayjs | undefined,
  remark1: '',
})

const companyList = ref<API.Company[]>([])
const companyNameList = ref<string[]>([])

// 公司名称自动完成选项
const companyNameOptions = computed(() => {
  return companyNameList.value.map(name => ({
    value: name,
    label: name,
  }))
})

// 公司名称自动填充框（使用通用 composable）
const companyNameAutoComplete = useAutoCompleteWithExtra({
  baseOptions: companyNameOptions,
  currentValue: computed(() => formData.companyName || ''),
  enableAutoAdd: true,
})

// 过滤后的公司名称选项
const filteredCompanyNameOptions = companyNameAutoComplete.filteredOptions

// 根据公司名称获取 companyId
const getCompanyIdByName = (companyName: string): number => {
  const input = (companyName || '').trim().toLowerCase()
  const company = companyList.value.find(c => (c.companyName || '').trim().toLowerCase() === input)
  return company ? (company.id || 0) : 0
}

const rules = {
  employeeNo: [{ required: true, message: '请输入工号', trigger: 'submit' }],
  companyName: [{ required: true, message: '请选择公司名称', trigger: 'submit' }],
  name: [{ required: true, message: '请输入员工姓名', trigger: 'submit' }],
}

// 处理出生日期变化，自动计算年龄
const handleBirthDateChange = () => {
  formData.age = calculateAge(formData.birthDate)
}

// 获取公司列表
const fetchCompanyList = async () => {
  try {
    // 需要拿到真实 companyId，因此使用分页接口获取公司列表
    const res = await listCompanyByPageUsingPost({
      current: 1,
      pageSize: 9999,
    } as any) as any
    const records = res?.data?.data?.records || []
    if (res?.data?.code === 0) {
      companyList.value = records as API.Company[]
      companyNameList.value = records.map((c: any) => c.companyName).filter(Boolean)
    }
  } catch (error) {
    console.error('获取公司列表失败', error)
  }
}

// 处理公司名称变化
const handleCompanyNameChange = (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  companyNameAutoComplete.handleChange(value)
  
  if (value) {
    formRef.value?.clearValidate?.(['companyName'])
  }
  formData.companyName = value
  formData.companyId = getCompanyIdByName(value)
}

// 处理公司名称选择（AutoComplete 选中时）
const handleCompanyNameSelect = (value: string) => {
  handleCompanyNameChange(value)
}

// 加载用户信息
const loadUserInfo = async () => {
  loading.value = true
  try {
    // 第一步：获取登录用户信息，得到用户ID
    const loginRes = await getLoginUserUsingGet() as any
    if (loginRes.data.code !== 0 || !loginRes.data.data) {
      message.error('获取用户信息失败')
      return
    }
    
    const loginUser = loginRes.data.data
    const userId = (loginUser as any).id
    
    if (!userId) {
      message.error('用户ID不存在')
      return
    }
    
    // 第二步：使用用户ID查询员工详细信息
    await fetchCompanyList()
    
    const employeeRes = await listEmployeeUsingPost({
      id: userId,
      current: 1,
      pageSize: 1,
    } as API.EmployeeQueryDTO) as any
    
    if (employeeRes.data.code !== 0 || !employeeRes.data.data || !employeeRes.data.data.records || employeeRes.data.data.records.length === 0) {
      message.error('获取员工信息失败')
      return
    }
    
    const employee = employeeRes.data.data.records[0] as API.EmployeeVO
    
    // 根据 companyId 获取 companyName
    let companyName = employee.companyName || ''
    if (!companyName && employee.companyId) {
      const company = companyList.value.find(c => c.id === employee.companyId)
      companyName = company?.companyName || ''
    }
    
    // 处理首次参保年月：如果是 YYYY-MM-DD 格式，转换为 YYYY-MM 格式
    let firstInsuranceDateValue: Dayjs | undefined = undefined
    if (employee.firstInsuranceDate) {
      const firstInsuranceDateStr = employee.firstInsuranceDate
      // 如果是 YYYY-MM-DD 格式，提取前7位（YYYY-MM）
      if (firstInsuranceDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        firstInsuranceDateValue = dayjs(firstInsuranceDateStr.substring(0, 7))
      } else if (firstInsuranceDateStr.match(/^\d{4}-\d{2}$/)) {
        firstInsuranceDateValue = dayjs(firstInsuranceDateStr)
      } else {
        firstInsuranceDateValue = dayjs(firstInsuranceDateStr)
      }
    }
    
    // 填充表单数据，参考 EmployeeEditModal.vue 的处理方式
    Object.assign(formData, {
      employeeNo: employee.employeeNo || '',
      companyId: employee.companyId ?? 0,
      companyName: companyName,
      name: employee.name || '',
      gender: employee.gender || '',
      birthDate: employee.birthDate ? (typeof employee.birthDate === 'string' ? dayjs(employee.birthDate) : employee.birthDate) : undefined,
      age: calculateAge(employee.birthDate),
      phone: employee.phone || '',
      idCard: employee.idCard || '',
      householdType: employee.householdType || '',
      maritalStatus: employee.maritalStatus || '',
      nativePlace: employee.nativePlace || '',
      householdAddress: employee.householdAddress || '',
      residenceAddress: employee.residenceAddress || '',
      firstInsuranceDate: firstInsuranceDateValue,
      email: employee.email || '',
      emergencyContactName: employee.emergencyContactName || '',
      emergencyContactRelation: employee.emergencyContactRelation || '',
      emergencyContactPhone: employee.emergencyContactPhone || '',
      educationLevel: employee.educationLevel || '',
      educationType: employee.educationType || '',
      graduationSchool: employee.graduationSchool || '',
      major: employee.major || '',
      department: employee.department || '',
      position: employee.position || '',
      hireDate: employee.hireDate ? (typeof employee.hireDate === 'string' ? dayjs(employee.hireDate) : employee.hireDate) : undefined,
      regularDate: employee.regularDate ? (typeof employee.regularDate === 'string' ? dayjs(employee.regularDate) : employee.regularDate) : undefined,
      remark1: employee.remark1 || '',
    })
  } catch (error) {
    console.error('获取用户信息失败', error)
    message.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    if (!(loginUserStore.loginUser as any).id) {
      message.error('用户ID不存在')
      return
    }
    loading.value = true
    // 确保 companyId 已根据 companyName 更新
    if (formData.companyName && !formData.companyId) {
      formData.companyId = getCompanyIdByName(formData.companyName)
    }
    // 兜底：日期字段可能是字符串或 Dayjs，这里统一转 Dayjs 再 format
    const normalizeDate = (d: any, pattern = 'YYYY-MM-DD') => (d ? dayjs(d).format(pattern) : undefined)

    const submitData = {
      id: (loginUserStore.loginUser as any).id,
      employeeNo: formData.employeeNo,
      companyId: formData.companyId,
      name: formData.name,
      gender: formData.gender,
      birthDate: normalizeDate(formData.birthDate),
      phone: formData.phone,
      idCard: formData.idCard,
      householdType: formData.householdType,
      maritalStatus: formData.maritalStatus,
      nativePlace: formData.nativePlace,
      householdAddress: formData.householdAddress,
      residenceAddress: formData.residenceAddress,
      // 首次参保年月：提交时默认携带该月第一天（YYYY-MM-01）
      firstInsuranceDate: normalizeDate(formData.firstInsuranceDate, 'YYYY-MM-01'),
      email: formData.email || undefined,
      emergencyContactName: formData.emergencyContactName,
      emergencyContactRelation: formData.emergencyContactRelation,
      emergencyContactPhone: formData.emergencyContactPhone,
      educationLevel: formData.educationLevel,
      educationType: formData.educationType,
      graduationSchool: formData.graduationSchool,
      major: formData.major,
      department: formData.department,
      position: formData.position,
      hireDate: normalizeDate(formData.hireDate),
      regularDate: normalizeDate(formData.regularDate),
      remark1: formData.remark1,
    } as API.EmployeeUpdateDTO
    const res = await updateEmployeeUsingPost(submitData) as any
    if (res.data.code === 0) {
      message.success('更新成功')
      // 刷新用户信息
      await loginUserStore.fetchLoginUser()
      // 重新加载表单数据以显示最新信息
      await loadUserInfo()
    } else {
      message.error('更新失败 ' + (res.data.message || ''))
    }
  } catch (error: any) {
    if (error?.errorFields) {
      // 表单验证失败
      return
    }
    message.error('更新失败：' + (error?.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  loadUserInfo()
  formRef.value?.resetFields()
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
@import '@/styles/form-modal.css';


#profilePage {
  padding: 20px;
}


#profilePage :deep(.ant-card-body) {
  padding-top: 0;
  padding-bottom: 0;
  max-height: calc(100vh - 120px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-body-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 24px 0 24px;
}

#profilePage :deep(.ant-card-head) {
  padding: 0 24px;
}

#profilePage :deep(.ant-card-head-title) {
  padding: 16px 0;
  width: 100%;
}

.card-title-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.card-title-tabs {
  width: 100%;
  min-width: 0;
}

.card-title-tabs :deep(.ant-tabs-nav) {
  margin: 0;
}

.card-title-tabs :deep(.ant-tabs-nav-wrap) {
  width: 100%;
}

.card-title-tabs :deep(.ant-tabs-nav-list) {
  width: 100%;
}

.card-title-tabs :deep(.ant-tabs-tab) {
  padding: 8px 16px;
}

.section-title {
  margin-bottom: 16px;
  font-weight: 500;
  font-size: 14px;
}

.section-divider {
  color: #1890ff;
  margin-right: 8px;
}
</style>
