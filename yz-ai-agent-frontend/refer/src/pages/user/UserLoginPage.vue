<template>
  <div id="userLoginPage">
    <main class="login-container">

      <div class="brand-section">
        <h1 class="brand-text">九华云SaaS管理平台</h1>
        <div class="brand-line"></div> </div>

      <div class="login-card">
        <h2 class="welcome-text">欢迎登录</h2>

        <a-form :model="loginForm" name="basic" autocomplete="off" @finish="handleLogin">
          <a-form-item name="employeeNo" :rules="[{ required: true, message: '请输入工号' }]">
            <a-input v-model:value="loginForm.employeeNo" size="large" placeholder="请输入工号" />
          </a-form-item>

          <a-form-item name="password" :rules="[{ required: true, message: '请输入密码' }]">
            <a-input 
              v-model:value="loginForm.password" 
              type="password" 
              size="large" 
              placeholder="请输入密码"
            >
              <template #suffix>
                <CloseCircleOutlined 
                  v-if="loginForm.password" 
                  @click="clearPassword" 
                  style="cursor: pointer; color: rgba(0, 0, 0, 0.45);"
                />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item>
            <a-checkbox v-model:checked="rememberPassword">记住密码</a-checkbox>
          </a-form-item>

          <a-form-item>
            <a-button type="primary" html-type="submit" size="large" style="width: 100%">登录</a-button>
          </a-form-item>
        </a-form>
      </div>
    </main>

    <footer class="login-footer">
      <p class="footer-text">版权所有：九华云科技有限公司</p>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted, nextTick, watch } from 'vue';
import { message } from "ant-design-vue";
import router from "@/router";
import { useRoute } from "vue-router";
import { Modal } from "ant-design-vue";
import { CloseCircleOutlined } from "@ant-design/icons-vue";
import { userLoginUsingPost, getLoginUserUsingGet } from "@/api/yuangongguanlijiekou";
import { useLoginUserStore } from "@/stores/useLoginUserStore.ts";
import ACCESS_ENUM from "@/access/accessEnum";

const loginUserStore = useLoginUserStore();
const route = useRoute();

// 记住密码选项，默认勾选
const rememberPassword = ref(true);

// 清除密码
const clearPassword = () => {
  loginForm.password = '';
};

// 监听记住密码复选框的变化
watch(rememberPassword, (newValue) => {
  if (!newValue) {
    // 如果取消勾选，立即清除存储的密码和工号
    localStorage.removeItem('savedEmployeeNo');
    localStorage.removeItem('savedPassword');
    localStorage.setItem('rememberPassword', 'false');
  } else {
    // 如果勾选，保存当前状态
    localStorage.setItem('rememberPassword', 'true');
  }
});

// 表单数据模型（界面仍使用“工号”字段，提交时映射到后端需要的 name）
type LoginForm = {
  employeeNo: string;
  password: string;
};

const loginForm = reactive<LoginForm>({
  employeeNo: 'JH001',
  password: '123456',
});

// 页面加载时，从localStorage读取保存的工号和密码
onMounted(() => {
  // 如果已经登录，直接跳转
  const loginUser = loginUserStore.loginUser;
  if (loginUser && typeof loginUser === 'object' && 'role' in loginUser && loginUser.role !== ACCESS_ENUM.NOT_LOGIN) {
    const redirect = route.query.redirect as string || '/';
    router.replace(redirect);
    return;
  }

  const savedEmployeeNo = localStorage.getItem('savedEmployeeNo');
  const savedPassword = localStorage.getItem('savedPassword');
  const savedRememberPassword = localStorage.getItem('rememberPassword');

  if (savedEmployeeNo) {
    loginForm.employeeNo = savedEmployeeNo;
  }

  if (savedRememberPassword === 'true' && savedPassword) {
    rememberPassword.value = true;
    loginForm.password = savedPassword;
  } else {
    rememberPassword.value = savedRememberPassword === 'true';
  }
});

/**
 * 处理登录逻辑（调用真实后端登录接口）
 */
const handleLogin = async (values: LoginForm) => {
  try {
    const res = await userLoginUsingPost({
      employeeNo: values.employeeNo,
      password: values.password,
    });

    if (res.data.code === 0 && res.data.data) {
      // 如果勾选了记住密码，保存工号和密码
      if (rememberPassword.value) {
        localStorage.setItem('savedEmployeeNo', values.employeeNo);
        localStorage.setItem('savedPassword', values.password);
        localStorage.setItem('rememberPassword', 'true');
      }
      // 注意：如果未勾选，watch 监听器已经处理了清除逻辑

      // 登录成功后，获取完整的用户信息
      try {
        const userRes = await getLoginUserUsingGet();
        if (userRes.data.code === 0 && userRes.data.data) {
          // 将后端返回的登录用户信息写入全局 Store，并映射 permission -> role
          loginUserStore.setLoginUserFromApi(userRes.data.data);
        } else {
          // 如果获取用户信息失败，使用登录接口返回的数据
          loginUserStore.setLoginUserFromApi(res.data.data);
        }
      } catch (error) {
        // 如果获取用户信息失败，使用登录接口返回的数据
        loginUserStore.setLoginUserFromApi(res.data.data);
      }

      // 如果使用默认密码 123456，强制弹出修改密码模态框
      // if (values.password === '123456' && res.data.data.id) {
      //   Modal.confirm({
      //     title: '安全提示',
      //     content: '当前密码为默认密码，为了账号安全，请先修改密码后再继续使用系统。',
      //     okText: '修改密码',
      //     cancelText: '稍后再说',
      //     async onOk() {
      //       // 这里简单演示，实际可改为单独的修改密码页面 / 表单
      //       const newPassword = window.prompt('请输入新密码（至少6位）：', '');
      //       if (!newPassword || newPassword.length < 6) {
      //         message.warning('新密码长度至少为 6 位');
      //         return Promise.reject();
      //       }
      //       const resp = await updatePasswordUsingPost({
      //         id: res.data.data!.id!,
      //         oldPassword: values.password,
      //         newPassword,
      //       });
      //       if (resp.data.code === 0) {
      //         message.success('密码修改成功，请使用新密码重新登录');
      //         // 清空本地记住的旧密码
      //         localStorage.removeItem('savedPassword');
      //         await router.push('/user/login');
      //       } else {
      //         message.error('密码修改失败：' + (resp.data.message || ''));
      //         return Promise.reject();
      //       }
      //     },
      //   });
      //   return;
      // }

      message.success('登录成功');
      
      // 确保用户信息已保存到 sessionStorage
      // setLoginUserFromApi 已经保存了，但为了确保同步，再次确认
      await nextTick();
      
      // 检查是否有 redirect 参数，如果有则跳转到指定页面，否则跳转到首页
      const redirect = route.query.redirect as string || '/';
      
      // 使用 replace 避免在历史记录中留下登录页面
      router.replace(redirect).catch((err) => {
        // 如果跳转失败（比如路由守卫阻止），尝试使用 push
        console.error('路由跳转失败:', err);
        router.push(redirect);
      });
    } else {
      message.error('登录失败 ' + (res.data.message || ''));
    }
  } catch (e: any) {
    message.error('登录失败 ' + (e?.message || '网络异常'));
  }
};
</script>

<style scoped>
/* ---------------------------------------------------- */
/* 全局容器与背景 */
/* ---------------------------------------------------- */
#userLoginPage {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 强制占满一屏 */
  width: 100%;
  overflow: hidden; /* 防止出现滚动条 */
  background-color: #f0f2f5;
  background-image: url('@/assets/background.png'); /* 确保背景图路径正确 */
  background-size: cover; /* 保证背景覆盖全部 */
  background-position: center center;
  font-family: "Microsoft YaHei", "Heiti SC", sans-serif; /* 使用黑体，更符合体制内审美 */
}

/* ---------------------------------------------------- */
/* 主布局区域 (Flex) */
/* ---------------------------------------------------- */
.login-container {
  flex: 1; /* 占据中间所有剩余空间 */
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  gap: 10vw; /* 关键：利用 gap 拉开文字和登录框的距离，使用vw单位适应屏幕 */
  padding: 0 40px;
  position: relative;
  z-index: 1;
}

/* ---------------------------------------------------- */
/* 左侧：大气立体淡化字体 */
/* ---------------------------------------------------- */
.brand-section {
  text-align: left;
  /* 防止文字被压缩 */
  flex-shrink: 0;
}

.brand-text {
  font-size: 64px; /* 大气尺寸 */
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  letter-spacing: 8px; /* 增加字间距，显得更庄重 */

  /* 核心效果：淡化 + 立体感 */
  color: rgba(255, 255, 255, 0.85); /* 稍微透明的白色，不刺眼 */
  text-shadow:
      0 10px 20px rgba(0, 0, 0, 0.2), /* 远处的柔和投影，营造悬浮感 */
      0 2px 0 rgba(180, 180, 180, 0.3); /* 近处的硬边，营造厚度感 */

  white-space: nowrap; /* 强制不换行 */
  cursor: default;
  user-select: none;
}

/* 装饰短横线 */
.brand-line {
  width: 80px;
  height: 6px;
  background: rgba(255, 255, 255, 0.8);
  margin-top: 24px;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

/* ---------------------------------------------------- */
/* 右侧：登录卡片 */
/* ---------------------------------------------------- */
.login-card {
  width: 400px; /* 稍微加宽，更稳重 */
  background: rgba(255, 255, 255, 0.96); /* 保持高不透明度，确保表单清晰 */
  padding: 40px 35px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); /* 加深阴影，突出层次 */
  backdrop-filter: blur(8px); /* 磨砂效果 */

  /* 确保Flex布局下不被压缩 */
  flex-shrink: 0;
}

.welcome-text {
  font-size: 24px;
  color: #1f1f1f;
  text-align: center;
  margin-bottom: 40px;
  font-weight: 600;
  letter-spacing: 2px;
}

/* ---------------------------------------------------- */
/* 底部版权 */
/* ---------------------------------------------------- */
.login-footer {
  text-align: center;
  padding-bottom: 24px;
  width: 100%;
}

.footer-text {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85); /* 醒目的淡白色 */
  font-weight: 500;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5); /* 增加投影，防止背景太亮看不清 */
}

/* ---------------------------------------------------- */
/* 响应式媒体查询 */
/* ---------------------------------------------------- */

/* 当屏幕宽度小于 1200px 时 (一般笔记本或平板竖屏) */
@media (max-width: 1200px) {
  /* 隐藏左侧大字，防止重叠 */
  .brand-section {
    display: none;
  }

  /* 登录框保持居中 */
  .login-container {
    justify-content: center;
    gap: 0;
  }
}
</style>