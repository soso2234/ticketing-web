<template>
  <div class="page">
    <header class="topbar">
      <div class="brand" translate="no">티켓 예매</div>
      <button class="login" @click="goLogin" translate="no">로그인</button>
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
        <button class="reserveFloating" @click="goQueue(selected)" translate="no">예매하기</button>
        <button class="reserveFloating" @click="goQueue(selected)" :disabled="loading" translate="no">{{ loading ? "요청 중..." : "예매하기" }}</button>
        <p v-if="error" style="color:crimson; margin-top:12px">
          {{ error }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
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

// 백엔드가 다른 프로젝트/서버라면 full URL 필수(클라우드 올릴시 domain 주소로 변경)
const API_BASE = 'http://localhost:3000'

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

function goLogin() {
  router.push('/login')
}
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
    const userId = 'user-' + Math.floor(Math.random() * 100000)
    const eventId = String(p.id) // 포스터 id를 공연번호(eventId)로 사용

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

    // Queue 페이지에서 쓰도록 저장
    localStorage.setItem('queueToken', data.queueToken)
    localStorage.setItem('eventId', eventId)
    localStorage.setItem('userId', userId)

    // Queue 화면으로 이동
    //test
    router.push({ path: '/queue', query: { eventId, token: data.queueToken } })
  } catch (e) {
    console.error(e)
    error.value = '대기열 진입에 실패했습니다. 백엔드(3000) 실행/ CORS 설정을 확인하세요.'
  } finally {
    loading.value = false
    // (선택) 오버레이 닫기
    // selected.value = null
  }
}
</script>

<style scoped src="../assets/styles/HomePage.css"></style>