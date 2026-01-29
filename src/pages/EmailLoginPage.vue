<template>
  <div class="page">
    <header class="topbar">
      <button class="back" @click="goBack">←</button>
      <div class="title">이메일 로그인</div>
      <div class="spacer"></div>
    </header>

    <main class="main">
      <div class="card">
        <div class="logo">weave</div>

        <div class="subtitle">
          이메일과 비밀번호로<br />
          로그인하세요.
        </div>

        <input
          class="input"
          type="email"
          placeholder="이메일"
          v-model="email"
        />

        <input
          class="input"
          type="password"
          placeholder="비밀번호"
          v-model="password"
        />

        <button class="btn primary" @click="login">
          로그인
        </button>

        <button class="link" @click="goSignup">
          아직 계정이 없으신가요? 회원가입
        </button>
      </div>
    </main>
  </div>
</template>
<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()

  const email = ref('')
  const password = ref('')

  // 뒤로가기 / 회원가입
  const goBack = () => router.push('/login')
  const goSignup = () => router.push('/signup')

  // 백엔드 API 주소 (.env)
  const API_BASE = import.meta.env.VITE_API_BASE_URL

  async function login() {
    if (!email.value || !password.value) {
      alert('이메일과 비밀번호를 입력해주세요')
      return
    }

    try {
      // `${API_BASE}/auth/login`,
      //const res = await fetch('http://localhost:3000/auth/login', {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.value,
          password: password.value,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          alert('이메일 또는 비밀번호가 올바르지 않습니다.')
          return
        }
        if (res.status === 403 && data?.error === 'not_local_account') {
          alert('카카오로 가입된 계정입니다. 카카오 로그인을 이용해주세요.')
          return
        }
        alert('로그인에 실패했습니다.')
        return
      }

      // 로그인 성공 → 카카오 로그인과 동일한 방식으로 저장
      localStorage.setItem('auth_user', JSON.stringify(data.user))

      alert('로그인 완료!')
      router.push('/')
    } catch (err) {
      console.error('POST /auth/login failed:', err)
      alert('서버 연결에 실패했습니다.')
    }
  }
</script>
<style scoped src="../assets/styles/SignupPage.css"></style>
