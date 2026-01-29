<template>
  <div class="page">
    <header class="topbar">
      <button class="back" @click="$router.back()">←</button>
      <div class="title">마이페이지</div>
      <div class="spacer"></div>
    </header>

    <main class="main">
      <div class="centerCard">
        <!-- 사용자 정보 -->
        <section class="profile">
          <div class="avatar">👤</div>
          <div class="info">
            <div class="name">
              {{ displayName }} 님
            </div>
            <div class="desc">예매내역을 확인할 수 있어요</div>
          </div>
        </section>

        <!-- 예매내역 -->
        <BookingList :user-id="userId" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BookingList from './BookingList.vue'

const router = useRouter()
const API_BASE = import.meta.env.VITE_API_BASE_URL

const userId = ref('')
const nickname = ref('')
const loadingUser = ref(false)

const displayName = computed(() => nickname.value || '사용자')

function getAuthUserId() {
  try {
    const raw = localStorage.getItem('auth_user')
    const user = raw ? JSON.parse(raw) : null
    return user?.id || ''
  } catch {
    return ''
  }
}

async function fetchUserProfile(id) {
  loadingUser.value = true
  try {
    const resp = await fetch(`${API_BASE}/users/${id}`)
    const data = await resp.json().catch(() => ({}))

    if (!resp.ok) {
      // 로그인 정보가 깨졌거나 user가 없으면 로그인으로 유도
      console.error('fetch user failed:', resp.status, data)
      return
    }

    nickname.value = data?.user?.nickname || ''
  } catch (e) {
    console.error(e)
  } finally {
    loadingUser.value = false
  }
}

onMounted(async () => {
  const id = getAuthUserId()
  if (!id) {
    alert('로그인이 필요합니다.')
    router.push('/login')
    return
  }

  userId.value = id
  await fetchUserProfile(id)
})
</script>

<style scoped src="../assets/styles/MyPage.css"></style>