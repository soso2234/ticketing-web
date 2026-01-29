<template>
  <div class="page">
    <header class="topbar">
      <div class="brandLeft" aria-hidden="true"></div>
      <div class="brand">티켓 예매</div>
      <div class="actions">
        <button v-if="!isLoggedIn" class="login" @click="goLogin" translate="no">로그인</button>
        <template v-else>
          <button class="login" @click="goMyPage" translate="no">마이페이지</button>
          <button class="login" @click="goMyReservations" translate="no">예매내역</button>
          <button class="login" @click="logout" translate="no">로그아웃</button>
        </template>
      </div>
    </header>
    <main class="main">
      <div class="container">
        <section class="grid">
          <article
            v-for="p in posters"
            :key="p.id"
            class="card"
            @click="openPoster(p)"
          >
            <div class="poster">
              <img :src="p.image" :alt="p.title" class="posterImg" />
            </div>

            <div class="meta">
              <div class="title" translate="no">{{ p.title }}</div>
              <div class="sub" translate="no">{{ p.sub }}</div>
            </div>
          </article>
        </section>
      </div>
    </main>

    <div v-if="selected" class="overlay" @click.self="closePoster">
      <div class="focus">
        <button class="x" @click="closePoster" aria-label="close">✕</button>
        <img :src="selected.image" :alt="selected.title" class="focusImg" />

        <!-- 기존 버튼이 중복으로 2개 있어 하나만 남기는 게 정상인데,
             현재 동작 유지 원하면 아래 1개만 사용하세요. -->
        <button
          class="reserveFloating"
          @click="goQueue(selected)"
          :disabled="loading"
          translate="no"
        >
          {{ loading ? "요청 중..." : "예매하기" }}
        </button>

        <p v-if="error" style="color:crimson; margin-top:12px">
          {{ error }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

import poster1 from '../assets/posters/poster1.jpg'
import poster2 from '../assets/posters/poster2.jpg'
import poster3 from '../assets/posters/poster3.jpg'
import poster4 from '../assets/posters/poster4.jpg'
import poster5 from '../assets/posters/poster5.jpg'
import poster6 from '../assets/posters/poster6.jpg'
import poster7 from '../assets/posters/poster7.jpg'
import poster8 from '../assets/posters/poster8.jpg'
import poster9 from '../assets/posters/poster9.jpg'

const router = useRouter()
const selected = ref(null)

// 로그인 상태
const isLoggedIn = ref(false)

function refreshAuthState() {
  try {
    const raw = localStorage.getItem('auth_user')
    if (!raw) return (isLoggedIn.value = false)
    const parsed = JSON.parse(raw)
    isLoggedIn.value = !!parsed?.id // id가 있어야 로그인으로 인정
  } catch {
    isLoggedIn.value = false
  }
}


function goLogin() {
  router.push('/login')
}

function goMyPage() {
  // 라우트는 나중에 만들 예정이라면 일단 placeholder로 이동만
  router.push('/mypage')
}

function goMyReservations() {
  router.push('/reservations')
}

function logout() {
  // 로그인 정보 제거
  localStorage.removeItem('auth_user')

  // (선택) 흐름 데이터도 정리 (대기열/예매 관련)
  localStorage.removeItem('queueToken')
  localStorage.removeItem('eventId')
  localStorage.removeItem('userId') // 예전에 랜덤으로 쓰던 값이 남아있을 수 있음

  refreshAuthState()

  alert('로그아웃 되었습니다.')
  // router.push('/login') // 로그인 창으로 이동
}


// storage 이벤트: 다른 탭/창에서 localStorage 변경 시 반영
function onStorageChange(e) {
  if (e.key === 'auth_user') refreshAuthState()
}

onMounted(() => {
  refreshAuthState()
  window.addEventListener('storage', onStorageChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', onStorageChange)
})

// 백엔드가 다른 프로젝트/서버라면 full URL 필수(클라우드 올릴시 domain 주소로 변경)
const API_BASE = import.meta.env.VITE_API_BASE_URL
// (선택) 버튼 중복 클릭 방지/에러 표시용
const loading = ref(false)
const error = ref('')

const posters = ref([
  { id: 1, title: '<센과 치히로의 행방불명>오리지널투어(SPIRITED AWAY)', sub: '예술의전당 오페라 극장 2026.01.23', image: poster1 },
  { id: 2, title: '뮤지컬<비틀쥬스>', sub: 'LG 아트센터 서울 LG SIGNATURE 홀 2026.02.01', image: poster2 },
  { id: 3, title: '뮤지컬<물랑루즈!>(Mulin Rouge! The Musical)', sub: '블루스퀘어 신한카드홀 2026.02.15', image: poster3 },
  { id: 4, title: '뮤지컬<킹키부츠>', sub: '샤롯데씨어터 2026.02.22', image: poster4 },
  { id: 5, title: '뮤지컬<한복 입은 남자>', sub: '충무아트센터 대극장 2026.03.01', image: poster5 },
  { id: 6, title: '뮤지컬<데스노트>', sub: '디큐브 링크아트센터 2026.03.04', image: poster6 },
  { id: 7, title: '뮤지컬<빨래>', sub: 'NOL 유니플렉스 2관 2026.03.15', image: poster7 },
  { id: 8, title: '뮤지컬<홍련>', sub: '충무아트센터 중극장 블랙 2026.03.17', image: poster8 },
  { id: 9, title: '뮤지컬<어서 오세요,휴남동 서점입니다>', sub: '루미나아트홀 2026.03.31', image: poster9 },
])

function openPoster(p) {
  selected.value = p
}
function closePoster() {
  selected.value = null
}

// 예매하기 버튼 → 대기열 진입 API 호출 → queueToken 저장 → /queue 이동
async function goQueue(p) {
  if (loading.value) return
  loading.value = true
  error.value = ''

  try {
    const eventId = String(p.id)

    // ✅ 발표/부하테스트용: 로그인 없어도 큐 진입 가능
    // 익명 사용자 식별자(대기열용) - 세션마다 랜덤이면 충분
    const userId = `anon-${Math.floor(Math.random() * 100000000)}`

    // ✅ BookingPage에서 예매 INSERT할 때 쓸 값들(데모용)
    const eventAtMap = {
      1: '2026-02-23T19:00:00+09:00',
      2: '2026-02-01T19:00:00+09:00',
      3: '2026-02-15T19:00:00+09:00',
      4: '2026-02-22T19:00:00+09:00',
      5: '2026-03-01T19:00:00+09:00',
      6: '2026-03-04T19:00:00+09:00',
      7: '2026-03-15T19:00:00+09:00',
      8: '2026-03-17T19:00:00+09:00',
      9: '2026-03-31T19:00:00+09:00',
    }
    const eventAt = eventAtMap[p.id]
    if (!eventAt) throw new Error('eventAt missing')

    localStorage.setItem('eventId', eventId)
    localStorage.setItem('eventAt', eventAt)
    localStorage.setItem('userId', userId) // 큐/클라 편의용(익명)

    const resp = await fetch(`${API_BASE}/queue/enter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, eventId }),
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(`queue enter failed: ${resp.status} ${text}`)
    }

    const data = await resp.json()

    localStorage.setItem('queueToken', data.queueToken)

    router.push({ path: '/queue', query: { eventId, token: data.queueToken } })
  } catch (e) {
    console.error(e)
    error.value = '대기열 진입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

</script>

<style scoped src="../assets/styles/HomePage.css"></style>
