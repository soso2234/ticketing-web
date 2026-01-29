<template>
  <div class="page">
    <header class="topbar">
      <button class="back" @click="goLogin">←</button>
      <div class="title">회원가입</div>
      <div class="spacer"></div>
    </header>

    <main class="main">
      <div class="card">
        <div class="logo">weave</div>
        <div class="subtitle">
          이메일로 간편하게
          회원가입을 진행하세요.
        </div>

        <input
          class="input"
          type="name"
          placeholder="이름"
          v-model="name"
        />

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

        <button class="btn primary" @click="signup">
          회원가입
        </button>

        <button class="link" @click="goLogin">
          이미 계정이 있으신가요? 로그인
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()

  const name = ref('')
  const email = ref('')
  const password = ref('')

  const goLogin = () => router.push('/login')
  const API_BASE = import.meta.env.VITE_API_BASE_URL

  async function signup() {
    if (!name.value || !email.value || !password.value) {
      alert('이름, 이메일, 비밀번호를 모두 입력해주세요')
      return
    }

    try {
      //const res = await fetch('http://localhost:3000/auth/signup', {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.value,
          email: email.value,
          password: password.value,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          alert('이미 가입된 이메일입니다.')
          return
        }
        throw new Error(data.error)
      }

      alert('회원가입 완료! 로그인 페이지로 이동합니다.')
      router.push('/login')
    } catch (err) {
      console.error('signup error:', err)
      alert('회원가입 중 오류가 발생했습니다.')
    }
  }
</script>
<style scoped src="../assets/styles/SignupPage.css"></style>