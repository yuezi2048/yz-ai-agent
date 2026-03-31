<template>
  <global-modal
    v-model="visible"
    :title="displayTitle"
    width="1200px"
    :mask-closable="false"
    :keyboard="true"
  >
    <upsert-modal
      ref="upsertModalRef"
      :is-editing="isEditing"
      :show-footer="props.showFooter"
      :show-next-button="props.showNextButton"
      :show-prev-button="props.showPrevButton"
      :show-reset-button="props.showResetButton"
      @save="handleSave"
      @next="handleNext"
      @next-edit="handleNextEdit"
      @prev-edit="handlePrevEdit"
      @reset="handleReset"
    >
      <template #content>
        <div class="form-modal">
          <a-form
            ref="formRef"
            :model="formData"
            layout="horizontal"
            :label-col="{ span: 10 }"
            :wrapper-col="{ span: 14 }"
            :validate-trigger="['submit']"
          >
          <!-- ▎ 个人信息（左边分隔符用蓝色样式） -->
          <div class="form-section">
            <div class="section-title">
              <span class="section-divider">▎</span>
              <span>个人信息</span>
            </div>

            <!-- 第一行：姓名、工号、联系电话、性别（4个输入框，24列布局） -->
            <a-row :gutter="[16, 16]">
              <a-col :span="6">
                <a-form-item label="姓名" name="name" :rules="[{ required: true, message: '请输入姓名' }]">
                  <a-input v-model:value="formData.name" placeholder="请输入姓名" allow-clear />
                </a-form-item>
              </a-col>
              <a-col :span="6">
                <a-form-item label="工号" name="employeeNo">
                  <a-input v-model:value="formData.employeeNo" placeholder="系统自动生成" disabled />
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

            <!-- 第四行：首次参保年月、邮件（2个输入框，每个占6列） -->
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

            <!-- 第一行：公司名称、所属部门、岗位（每个占6列） -->
            <a-row :gutter="[16, 16]">
              <a-col :span="12">
                <a-form-item label="公司名称" name="companyName" :rules="[{ required: true, message: '请选择公司名称' }]"
                             :label-col="{ span: 5 }" :wrapper-col="{ span: 19 }">
                  <a-auto-complete
                    v-model:value="formData.companyName"
                    :options="filteredCompanyNameOptions"
                    placeholder="选择或输入公司名称"
                    style="width: 100%"
                    allow-clear
                    @change="handleCompanyNameChange"
                    @blur="handleCompanyNameBlur"
                    @select="(value: string) => { if (value) formRef?.clearValidate(['companyName']) }"
                  />
                  <!-- 公司名称关联验证提示 -->
                  <div v-if="companyAssociationStatus" style="margin-top: 4px; font-size: 12px;">
                    <span v-if="companyAssociationStatus === 'success'" style="color: #52c41a;">
                      已成功关联公司信息：{{ formData.companyName }}
                    </span>
                    <span v-else-if="companyAssociationStatus === 'failed'" style="color: #ff4d4f;">
                      公司信息关联失败，请<a @click="handleCreateCompanyClick" style="color: #1890ff; cursor: pointer; text-decoration: underline;">点此链接</a>创建
                    </span>
                  </div>
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
        </a-form>
        </div>
      </template>
    </upsert-modal>
  </global-modal>
</template>

<script lang="ts" setup>
import { ref, watch, reactive, computed, nextTick } from 'vue'
import GlobalModal from '@/modal/globalModal.vue'
import UpsertModal from '@/modal/upsertModal.vue'
import dayjs, { type Dayjs } from 'dayjs'
import { Modal, message } from 'ant-design-vue'
import { checkExistsUsingPost, addCompanyUsingPost } from '@/api/gongsixinxijiekou'
import { useAutoCompleteWithExtra } from '@/hooks/common/useAutoCompleteWithExtra'

interface FormData {
  id?: number // 员工ID，用于判断是否是编辑模式
  employeeNo: string
  companyId: number
  companyName: string // 用于 AutoComplete 显示
  name: string
  gender: string
  birthDate: Dayjs | string | null
  age: number | string
  phone: string
  idCard: string
  householdType: string
  maritalStatus: string
  nativePlace: string
  householdAddress: string
  residenceAddress: string
  firstInsuranceDate: Dayjs | string | null
  email: string
  emergencyContactName: string
  emergencyContactRelation: string
  emergencyContactPhone: string
  educationLevel: string
  educationType: string
  graduationSchool: string
  major: string
  department: string
  position: string
  hireDate: Dayjs | string | null
  regularDate: Dayjs | string | null
  remark1: string
}

interface Props {
  modelValue: boolean
  title: string
  serialNo?: number | null
  companyList: API.Company[]
  formData?: Partial<FormData>
  /** 是否显示底部操作栏 */
  showFooter?: boolean
  /** 是否显示下一条按钮 */
  showNextButton?: boolean
  /** 是否显示上一条按钮 */
  showPrevButton?: boolean
  /** 是否显示重置按钮 */
  showResetButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  companyList: () => [],
  formData: () => ({
    employeeNo: '',
    companyId: 0,
    name: '',
    gender: '',
    birthDate: null,
    age: '',
    phone: '',
    idCard: '',
    householdType: '',
    maritalStatus: '',
    nativePlace: '',
    householdAddress: '',
    residenceAddress: '',
    firstInsuranceDate: null,
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
    hireDate: null,
    regularDate: null,
    remark1: '',
  }),
  showFooter: true,
  showNextButton: true,
  showPrevButton: true,
  showResetButton: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [data: FormData, callback: (success: boolean) => void]
  'next': []
  'next-edit': [callback: (success: boolean) => void]
  'prev-edit': [callback: (success: boolean) => void]
  'reset': []
}>()

const visible = ref(false)
const formRef = ref()
const upsertModalRef = ref<InstanceType<typeof UpsertModal>>()
const isEditing = ref(false)

// 保存原始记录数据，用于重置
const originalFormData = ref<Partial<FormData> | null>(null)

// 保存新增模式下的初始数据（包含自动填充的公司等），用于重置
const initialDataForAdd = ref<Partial<FormData> | null>(null)

// 公司名称列表（用于 AutoComplete）
const companyNameList = computed(() => {
  return props.companyList.map(company => company.companyName || '')
})

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
  const company = props.companyList.find(c => c.companyName === companyName)
  return company ? (company.id || 0) : 0
}

// 关联状态管理
const companyAssociationStatus = ref<'success' | 'failed' | null>(null)
const companyAssociationId = ref<number | null>(null)

// 检查公司关联状态
const checkCompanyAssociation = async (companyName: string) => {
  if (!companyName) {
    companyAssociationStatus.value = null
    companyAssociationId.value = null
    return
  }
  try {
    const res = await checkExistsUsingPost({
      companyName,
    }) as any
    if (res.data.code === 0 && res.data.data && res.data.data.exists) {
      companyAssociationStatus.value = 'success'
      companyAssociationId.value = res.data.data.id || null
      // 如果关联成功，更新 companyId
      if (res.data.data.id) {
        formData.companyId = res.data.data.id
      }
    } else {
      companyAssociationStatus.value = 'failed'
      companyAssociationId.value = null
    }
  } catch (error) {
    console.error('检查公司关联失败', error)
    companyAssociationStatus.value = 'failed'
    companyAssociationId.value = null
  }
}

// 处理公司名称变化
const handleCompanyNameChange = (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  companyNameAutoComplete.handleChange(value)
  
  // 如果值不为空，清除该字段的验证错误
  if (value) {
    formRef.value?.clearValidate(['companyName'])
  }
  formData.companyName = value
  formData.companyId = getCompanyIdByName(value)
}

// 公司名称失去焦点时验证
const handleCompanyNameBlur = () => {
  if (formData.companyName) {
    checkCompanyAssociation(formData.companyName)
  } else {
    companyAssociationStatus.value = null
    companyAssociationId.value = null
  }
}

// 处理创建公司链接点击
const handleCreateCompanyClick = async () => {
  if (!formData.companyName) {
    message.warning('请先填写公司名称')
    return
  }

  Modal.confirm({
    title: '确认创建',
    content: `是否要创建公司"${formData.companyName}"的公司信息？`,
    onOk: async () => {
      try {
        const res = (await addCompanyUsingPost({
          companyName: formData.companyName,
        })) as any

        if (res.data.code === 0) {
          message.success('公司创建成功')
          // 重新验证
          await checkCompanyAssociation(formData.companyName)
        } else {
          message.error('公司创建失败：' + (res.data.message || ''))
        }
      } catch (error: any) {
        console.error('创建公司失败', error)
        message.error('创建公司失败：' + (error.message || '未知错误'))
      }
    },
  })
}

// 计算显示的标题（包含序号）
const displayTitle = computed(() => {
  if (props.serialNo !== null && props.serialNo !== undefined) {
    return `${props.title}（第 ${props.serialNo} 条）`
  }
  return props.title
})

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

const formData = reactive<FormData>({
  employeeNo: '',
  companyId: 0,
  companyName: '',
  name: '',
  gender: '',
  birthDate: null,
  age: '',
  phone: '',
  idCard: '',
  householdType: '',
  maritalStatus: '',
  nativePlace: '',
  householdAddress: '',
  residenceAddress: '',
  firstInsuranceDate: null,
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
  hireDate: null,
  regularDate: null,
  remark1: '',
})

// 处理出生日期变化，自动计算年龄
const handleBirthDateChange = () => {
  formData.age = calculateAge(formData.birthDate)
}

watch(() => props.modelValue, async (val) => {
  visible.value = val
  if (val && props.formData) {
    // 编辑模式判定：有 id 或有 serialNo 视为编辑
    isEditing.value =
      (!!(props.formData.id && typeof props.formData.id === 'number')) ||
      (props.serialNo !== null && props.serialNo !== undefined)
    // 根据 companyId 获取 companyName
    let companyName = props.formData.companyName || ''
    if (!companyName && props.formData.companyId) {
      const company = props.companyList.find(c => c.id === props.formData.companyId)
      companyName = company?.companyName || ''
    }
    // 保存原始数据用于重置（包含 id，用于判断编辑模式）
    originalFormData.value = {
      id: props.formData.id, // 保存 id，用于判断编辑模式
      employeeNo: props.formData.employeeNo || '',
      companyId: props.formData.companyId ?? 0,
      companyName: companyName,
      name: props.formData.name || '',
      gender: props.formData.gender || '',
      birthDate: props.formData.birthDate ? (typeof props.formData.birthDate === 'string' ? dayjs(props.formData.birthDate) : props.formData.birthDate) : null,
      age: props.formData.age || calculateAge(props.formData.birthDate),
      phone: props.formData.phone || '',
      idCard: props.formData.idCard || '',
      householdType: props.formData.householdType || '',
      maritalStatus: props.formData.maritalStatus || '',
      nativePlace: props.formData.nativePlace || '',
      householdAddress: props.formData.householdAddress || '',
      residenceAddress: props.formData.residenceAddress || '',
      firstInsuranceDate: props.formData.firstInsuranceDate ? (typeof props.formData.firstInsuranceDate === 'string' ? dayjs(props.formData.firstInsuranceDate) : props.formData.firstInsuranceDate) : null,
      email: props.formData.email || '',
      emergencyContactName: props.formData.emergencyContactName || '',
      emergencyContactRelation: props.formData.emergencyContactRelation || '',
      emergencyContactPhone: props.formData.emergencyContactPhone || '',
      educationLevel: props.formData.educationLevel || '',
      educationType: props.formData.educationType || '',
      graduationSchool: props.formData.graduationSchool || '',
      major: props.formData.major || '',
      department: props.formData.department || '',
      position: props.formData.position || '',
      hireDate: props.formData.hireDate ? (typeof props.formData.hireDate === 'string' ? dayjs(props.formData.hireDate) : props.formData.hireDate) : null,
      regularDate: props.formData.regularDate ? (typeof props.formData.regularDate === 'string' ? dayjs(props.formData.regularDate) : props.formData.regularDate) : null,
      remark1: props.formData.remark1 || '',
    }
    Object.assign(formData, originalFormData.value)
    // 如果已有公司名称，自动验证
    if (formData.companyName) {
      await checkCompanyAssociation(formData.companyName)
    }
    await nextTick()
    upsertModalRef.value?.resetButtonState()
  } else {
    // === 新增模式 ===
    // 1. 先清空
    Object.assign(formData, {
      employeeNo: '',
      companyId: 0,
      companyName: '',
      name: '',
      gender: '',
      birthDate: null,
      age: '',
      phone: '',
      idCard: '',
      householdType: '',
      maritalStatus: '',
      nativePlace: '',
      householdAddress: '',
      residenceAddress: '',
      firstInsuranceDate: null,
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
      hireDate: null,
      regularDate: null,
      remark1: '',
    })
    
    // 2. 处理自动填充 (如果 props 里有默认公司)
    if (props.formData?.companyName) {
      formData.companyName = props.formData.companyName
      formData.companyId = getCompanyIdByName(formData.companyName)
      await checkCompanyAssociation(formData.companyName)
    }
    
    // 【修复 3-1】记录初始状态（含自动填充值）
    initialDataForAdd.value = { ...formData }
    
    isEditing.value = false
    originalFormData.value = null
    await nextTick()
    upsertModalRef.value?.resetButtonState()
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleSave = async (callback: (success: boolean) => void) => {
  try {
    await formRef.value?.validate()
    // 确保 companyId 已根据 companyName 更新
    if (formData.companyName && !formData.companyId) {
      formData.companyId = getCompanyIdByName(formData.companyName)
    }

    // 新增模式下，不设置 employeeNo，让后端自动生成
    // 编辑模式下，使用原有的 employeeNo（如果存在）

    // 转换日期格式
    const submitData: any = {
      ...formData,
      birthDate: formData.birthDate
        ? (typeof formData.birthDate === 'string'
          ? formData.birthDate
          : formData.birthDate.format('YYYY-MM-DD'))
        : undefined,
      // 首次参保年月：请求时默认携带该月第一天（YYYY-MM-01）
      firstInsuranceDate: formData.firstInsuranceDate
        ? (typeof formData.firstInsuranceDate === 'string'
          ? (formData.firstInsuranceDate.match(/^\d{4}-\d{2}$/)
            ? `${formData.firstInsuranceDate}-01`
            : formData.firstInsuranceDate)
          : formData.firstInsuranceDate.format('YYYY-MM-01'))
        : undefined,
      hireDate: formData.hireDate
        ? (typeof formData.hireDate === 'string'
          ? formData.hireDate
          : formData.hireDate.format('YYYY-MM-DD'))
        : undefined,
      regularDate: formData.regularDate
        ? (typeof formData.regularDate === 'string'
          ? formData.regularDate
          : formData.regularDate.format('YYYY-MM-DD'))
        : undefined,
      age: typeof formData.age === 'number' ? formData.age : (formData.age ? parseInt(formData.age) : undefined),
      email: formData.email || undefined,
    }
    // 移除 companyName，只保留 companyId，避免后端未识别字段
    delete submitData.companyName
    
    // 新增模式下，删除 employeeNo，让后端自动生成
    if (!isEditing.value) {
      delete submitData.employeeNo
    }
    // 编辑模式下，如果 employeeNo 为空，也删除它，让后端保留原有值
    else if (!submitData.employeeNo || !submitData.employeeNo.trim()) {
      delete submitData.employeeNo
    }
    
    emit('ok', submitData as FormData, callback)
  } catch (error) {
    console.error('表单验证失败', error)
    callback(false)
  }
}

const handleNext = () => {
  formRef.value?.clearValidate()
  upsertModalRef.value?.resetButtonState()
  emit('next')
}

// 监听 formData 变化（用于编辑模式下更新数据，如下一条功能）
watch(() => props.formData, (newFormData) => {
  if (visible.value && newFormData) {
    const hasId = !!(newFormData.id && typeof newFormData.id === 'number')
    const isSerialEdit = props.serialNo !== null && props.serialNo !== undefined
    
    // 判断是否刚刚从新增转变为编辑（ID 从无到有）
    const isSwitchingToAddSuccess = !isEditing.value && hasId

    // 【修复 2】智能更新逻辑
    if (isSwitchingToAddSuccess) {
      // 场景：新增保存成功，父组件回传了 ID 和 employeeNo
      isEditing.value = true
      formData.id = newFormData.id // 只同步 ID
      // 如果后端返回了工号，同步工号（后端自动生成的）
      if (newFormData.employeeNo) {
        formData.employeeNo = newFormData.employeeNo
      }
      // 更新快照，以便下次重置能回到这个保存后的状态（包含后端生成的 employeeNo）
      // 需要重新构建完整的 originalFormData，包含所有字段
      const companyName = newFormData.companyName || formData.companyName || ''
      originalFormData.value = {
        id: newFormData.id,
        employeeNo: newFormData.employeeNo || formData.employeeNo || '',
        companyId: newFormData.companyId ?? formData.companyId ?? 0,
        companyName: companyName,
        name: newFormData.name || formData.name || '',
        gender: newFormData.gender || formData.gender || '',
        birthDate: newFormData.birthDate ? (typeof newFormData.birthDate === 'string' ? dayjs(newFormData.birthDate) : newFormData.birthDate) : formData.birthDate,
        age: newFormData.age || formData.age || calculateAge(newFormData.birthDate || formData.birthDate),
        phone: newFormData.phone || formData.phone || '',
        idCard: newFormData.idCard || formData.idCard || '',
        householdType: newFormData.householdType || formData.householdType || '',
        maritalStatus: newFormData.maritalStatus || formData.maritalStatus || '',
        nativePlace: newFormData.nativePlace || formData.nativePlace || '',
        householdAddress: newFormData.householdAddress || formData.householdAddress || '',
        residenceAddress: newFormData.residenceAddress || formData.residenceAddress || '',
        firstInsuranceDate: newFormData.firstInsuranceDate ? (typeof newFormData.firstInsuranceDate === 'string' ? dayjs(newFormData.firstInsuranceDate) : newFormData.firstInsuranceDate) : formData.firstInsuranceDate,
        email: newFormData.email || formData.email || '',
        emergencyContactName: newFormData.emergencyContactName || formData.emergencyContactName || '',
        emergencyContactRelation: newFormData.emergencyContactRelation || formData.emergencyContactRelation || '',
        emergencyContactPhone: newFormData.emergencyContactPhone || formData.emergencyContactPhone || '',
        educationLevel: newFormData.educationLevel || formData.educationLevel || '',
        educationType: newFormData.educationType || formData.educationType || '',
        graduationSchool: newFormData.graduationSchool || formData.graduationSchool || '',
        major: newFormData.major || formData.major || '',
        department: newFormData.department || formData.department || '',
        position: newFormData.position || formData.position || '',
        hireDate: newFormData.hireDate ? (typeof newFormData.hireDate === 'string' ? dayjs(newFormData.hireDate) : newFormData.hireDate) : formData.hireDate,
        regularDate: newFormData.regularDate ? (typeof newFormData.regularDate === 'string' ? dayjs(newFormData.regularDate) : newFormData.regularDate) : formData.regularDate,
        remark1: newFormData.remark1 || formData.remark1 || '',
      }
      
      // 这里的关键是：不要 Object.assign 整个表单，防止光标跳动或输入丢失
      // 只更新关键字段（id 和 employeeNo）
    } else if (hasId || isSerialEdit) {
      // 场景：点击"下一条"或直接打开编辑 -> 此时需要完整覆盖
      // 只有当 ID 真正发生变化时（切换了人），才完整重置
      const isIdChanged = newFormData.id !== originalFormData.value?.id
      
      if (isIdChanged) {
        isEditing.value = true
        // 根据 companyId 获取 companyName
        let companyName = newFormData.companyName || ''
        if (!companyName && newFormData.companyId) {
          const company = props.companyList.find(c => c.id === newFormData.companyId)
          companyName = company?.companyName || ''
        }
        originalFormData.value = {
          id: newFormData.id, // 保存 id，用于判断编辑模式
          employeeNo: newFormData.employeeNo || '',
          companyId: newFormData.companyId ?? 0,
          companyName: companyName,
          name: newFormData.name || '',
          gender: newFormData.gender || '',
          birthDate: newFormData.birthDate ? (typeof newFormData.birthDate === 'string' ? dayjs(newFormData.birthDate) : newFormData.birthDate) : null,
          age: newFormData.age || calculateAge(newFormData.birthDate),
          phone: newFormData.phone || '',
          idCard: newFormData.idCard || '',
          householdType: newFormData.householdType || '',
          maritalStatus: newFormData.maritalStatus || '',
          nativePlace: newFormData.nativePlace || '',
          householdAddress: newFormData.householdAddress || '',
          residenceAddress: newFormData.residenceAddress || '',
          firstInsuranceDate: newFormData.firstInsuranceDate ? (typeof newFormData.firstInsuranceDate === 'string' ? dayjs(newFormData.firstInsuranceDate) : newFormData.firstInsuranceDate) : null,
          email: newFormData.email || '',
          emergencyContactName: newFormData.emergencyContactName || '',
          emergencyContactRelation: newFormData.emergencyContactRelation || '',
          emergencyContactPhone: newFormData.emergencyContactPhone || '',
          educationLevel: newFormData.educationLevel || '',
          educationType: newFormData.educationType || '',
          graduationSchool: newFormData.graduationSchool || '',
          major: newFormData.major || '',
          department: newFormData.department || '',
          position: newFormData.position || '',
          hireDate: newFormData.hireDate ? (typeof newFormData.hireDate === 'string' ? dayjs(newFormData.hireDate) : newFormData.hireDate) : null,
          regularDate: newFormData.regularDate ? (typeof newFormData.regularDate === 'string' ? dayjs(newFormData.regularDate) : newFormData.regularDate) : null,
          remark1: newFormData.remark1 || '',
        }
        Object.assign(formData, originalFormData.value)
        nextTick().then(() => {
          upsertModalRef.value?.resetButtonState()
        })
      }
    } else {
      // 新增模式：id 不存在且无 serialNo
      isEditing.value = false
    }
  }
}, { deep: true })

const handleNextEdit = (callback: (success: boolean) => void) => {
  emit('next-edit', callback)
}

const handlePrevEdit = (callback: (success: boolean) => void) => {
  emit('prev-edit', callback)
}

const handleReset = async () => {
  formRef.value?.resetFields()
  // 清空公司关联状态
  companyAssociationStatus.value = null
  companyAssociationId.value = null
  
  if (isEditing.value) {
    // 编辑模式：回退到 originalFormData（从后端加载的原始数据，包含自动填充的字段）
    if (originalFormData.value) {
      // 重新构建完整的数据对象，确保所有字段都被正确赋值
      const resetData: Partial<FormData> = {
        id: originalFormData.value.id,
        employeeNo: originalFormData.value.employeeNo || '',
        companyId: originalFormData.value.companyId ?? 0,
        companyName: originalFormData.value.companyName || '',
        name: originalFormData.value.name || '',
        gender: originalFormData.value.gender || '',
        birthDate: originalFormData.value.birthDate ? (typeof originalFormData.value.birthDate === 'string' ? dayjs(originalFormData.value.birthDate) : originalFormData.value.birthDate) : null,
        age: originalFormData.value.age || calculateAge(originalFormData.value.birthDate),
        phone: originalFormData.value.phone || '',
        idCard: originalFormData.value.idCard || '',
        householdType: originalFormData.value.householdType || '',
        maritalStatus: originalFormData.value.maritalStatus || '',
        nativePlace: originalFormData.value.nativePlace || '',
        householdAddress: originalFormData.value.householdAddress || '',
        residenceAddress: originalFormData.value.residenceAddress || '',
        firstInsuranceDate: originalFormData.value.firstInsuranceDate ? (typeof originalFormData.value.firstInsuranceDate === 'string' ? dayjs(originalFormData.value.firstInsuranceDate) : originalFormData.value.firstInsuranceDate) : null,
        email: originalFormData.value.email || '',
        emergencyContactName: originalFormData.value.emergencyContactName || '',
        emergencyContactRelation: originalFormData.value.emergencyContactRelation || '',
        emergencyContactPhone: originalFormData.value.emergencyContactPhone || '',
        educationLevel: originalFormData.value.educationLevel || '',
        educationType: originalFormData.value.educationType || '',
        graduationSchool: originalFormData.value.graduationSchool || '',
        major: originalFormData.value.major || '',
        department: originalFormData.value.department || '',
        position: originalFormData.value.position || '',
        hireDate: originalFormData.value.hireDate ? (typeof originalFormData.value.hireDate === 'string' ? dayjs(originalFormData.value.hireDate) : originalFormData.value.hireDate) : null,
        regularDate: originalFormData.value.regularDate ? (typeof originalFormData.value.regularDate === 'string' ? dayjs(originalFormData.value.regularDate) : originalFormData.value.regularDate) : null,
        remark1: originalFormData.value.remark1 || '',
      }
      Object.assign(formData, resetData)
      // 如果已有公司名称，自动验证
      if (originalFormData.value.companyName) {
        await checkCompanyAssociation(originalFormData.value.companyName)
      }
    } else if (props.formData) {
      // 兜底：如果 originalFormData 不存在，使用 props.formData
      // 根据 companyId 获取 companyName
      let companyName = props.formData.companyName || ''
      if (!companyName && props.formData.companyId) {
        const company = props.companyList.find(c => c.id === props.formData.companyId)
        companyName = company?.companyName || ''
      }
      const resetData: Partial<FormData> = {
        id: props.formData.id,
        employeeNo: props.formData.employeeNo || '',
        companyId: props.formData.companyId ?? 0,
        companyName: companyName,
        name: props.formData.name || '',
        gender: props.formData.gender || '',
        birthDate: props.formData.birthDate ? (typeof props.formData.birthDate === 'string' ? dayjs(props.formData.birthDate) : props.formData.birthDate) : null,
        age: props.formData.age || calculateAge(props.formData.birthDate),
        phone: props.formData.phone || '',
        idCard: props.formData.idCard || '',
        householdType: props.formData.householdType || '',
        maritalStatus: props.formData.maritalStatus || '',
        nativePlace: props.formData.nativePlace || '',
        householdAddress: props.formData.householdAddress || '',
        residenceAddress: props.formData.residenceAddress || '',
        firstInsuranceDate: props.formData.firstInsuranceDate ? (typeof props.formData.firstInsuranceDate === 'string' ? dayjs(props.formData.firstInsuranceDate) : props.formData.firstInsuranceDate) : null,
        email: props.formData.email || '',
        emergencyContactName: props.formData.emergencyContactName || '',
        emergencyContactRelation: props.formData.emergencyContactRelation || '',
        emergencyContactPhone: props.formData.emergencyContactPhone || '',
        educationLevel: props.formData.educationLevel || '',
        educationType: props.formData.educationType || '',
        graduationSchool: props.formData.graduationSchool || '',
        major: props.formData.major || '',
        department: props.formData.department || '',
        position: props.formData.position || '',
        hireDate: props.formData.hireDate ? (typeof props.formData.hireDate === 'string' ? dayjs(props.formData.hireDate) : props.formData.hireDate) : null,
        regularDate: props.formData.regularDate ? (typeof props.formData.regularDate === 'string' ? dayjs(props.formData.regularDate) : props.formData.regularDate) : null,
        remark1: props.formData.remark1 || '',
      }
      Object.assign(formData, resetData)
      // 如果已有公司名称，自动验证
      if (props.formData.companyName) {
        await checkCompanyAssociation(props.formData.companyName)
      }
    }
  } else {
    // 新增模式：回退到 initialDataForAdd（包含自动填充的公司名称等）
    if (initialDataForAdd.value) {
      Object.assign(formData, initialDataForAdd.value)
      // 重新触发一次关联检查，让绿色成功提示显示出来
      if (formData.companyName) {
        await checkCompanyAssociation(formData.companyName)
      }
    } else {
      // 兜底清空
      Object.assign(formData, {
        employeeNo: '',
        companyId: 0,
        companyName: '',
        name: '',
        gender: '',
        birthDate: null,
        age: '',
        phone: '',
        idCard: '',
        householdType: '',
        maritalStatus: '',
        nativePlace: '',
        householdAddress: '',
        residenceAddress: '',
        firstInsuranceDate: null,
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
        hireDate: null,
        regularDate: null,
        remark1: '',
      })
    }
  }
  formRef.value?.clearValidate()
  upsertModalRef.value?.resetButtonState()
}
</script>

<style scoped>
@import '@/styles/form-modal.css';
</style>
