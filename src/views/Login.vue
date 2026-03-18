<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">建筑碳排放管理平台</h2>
      <!-- 登录表单 -->
      <el-form 
        :model="loginForm" 
        :rules="loginRules" 
        ref="loginFormRef" 
        label-width="80px"
        class="login-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名" 
            size="large"
            prefix-icon="el-icon-user"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码" 
            size="large"
            prefix-icon="el-icon-lock"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleLogin" 
            size="large"
            class="login-btn"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
// 导入Vue相关依赖
import { ref } from 'vue';
// 导入Element Plus提示组件
import { ElMessage } from 'element-plus';
// 导入axios用于请求后端接口
import axios from 'axios';
// 导入路由用于跳转页面
import { useRouter } from 'vue-router';

// 初始化路由实例
const router = useRouter();

// 表单引用（用于验证）
const loginFormRef = ref(null);

// 登录表单数据
const loginForm = ref({
  username: '', // 用户名
  password: ''  // 密码
});

// 表单验证规则
const loginRules = ref({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在2-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6-20个字符', trigger: 'blur' }
  ]
});

// 登录按钮点击事件
const handleLogin = async () => {
  try {
    // 1. 先验证表单是否填写正确
    await loginFormRef.value.validate();
    
    // 2. 调用后端登录接口
    const res = await axios.post('http://localhost:3000/api/login', loginForm.value);
    
    // 3. 处理登录结果
    if (res.data.code === 200) {
      // 登录成功：保存token和用户名到本地存储
      localStorage.setItem('token', res.data.data.token);
      localStorage.setItem('username', res.data.data.username);
      
      // 提示并跳转到仪表盘页面
      ElMessage.success('登录成功！');
      router.push('/dashboard');
    } else {
      // 登录失败：提示错误信息
      ElMessage.error(res.data.msg);
    }
  } catch (err) {
    // 网络错误/其他异常
    console.error('登录失败：', err);
    ElMessage.error('登录失败，请检查用户名/密码或网络！');
  }
};
</script>

<style scoped>
/* 登录页面整体样式 */
.login-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0;
}

/* 登录卡片样式 */
.login-card {
  width: 420px;
  padding: 40px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* 登录标题样式 */
.login-title {
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 30px;
}

/* 登录表单样式 */
.login-form {
  margin-top: 20px;
}

/* 登录按钮样式 */
.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
}
</style>