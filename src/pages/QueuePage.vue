<template>
  <div class="page">
    <header class="topbar">
      <button class="back" @click="goHome">←</button>
      <div class="title">대기열</div>
      <div class="spacer"></div>
    </header>

    <main class="main">
      <div class="card">
        <!-- 대기 인원수에 따른 상단 문구 -->
        <div class="topText">{{ headlineText }}<br /></div>

        <div class="label">나의 대기순서</div>
        <div class="num">{{ myNumberDisplay }}</div>

        <div class="bar">
          <div class="fill" :style="{ width: progress + '%' }"></div>
        </div>

        <!-- 대기 인원수에 따른 설명 문구 -->
        <div class="desc">
          {{ descLine1 }}<br />
          {{ descLine2 }}
        </div>

        <!-- 구간별 새로고침 경고 문구(막바지에 더 강하게) -->
        <div class="hint">
          {{ hintText }}
        </div>

        <!-- 상태/에러 표시 -->
        <div v-if="error" style="color:crimson; margin-top:12px">{{ error }}</div>
        <div v-else style="opacity:0.8; margin-top:12px">
          상태: {{ status || '-' }}
          <span v-if="estimatedWaitSec !== null"> · 예상 {{ estimatedWaitSec }}초</span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 백엔드가 다른 프로젝트/서버라 full URL 사용(클라우드 올릴시 domain 주소로 변경)
const API_BASE = import.meta.env.VITE_API_BASE_URL

// 화면 표시값들
const myNumber = ref(null)          // 서버 position
const initial = ref(null)           // 최초 position (progress 계산용)
const status = ref('')
const estimatedWaitSec = ref(null)
const error = ref('')
const loading = ref(false)

let timer = null

const myNumberDisplay = computed(() => {
  if (myNumber.value === null) return '...'
  return myNumber.value
})

const progress = computed(() => {
  if (initial.value === null || initial.value <= 0) return 0
  if (myNumber.value === null) return 0
  const done = initial.value - myNumber.value
  return Math.min(100, Math.max(0, Math.round((done / initial.value) * 100)))
})

/**
 * 구간 기준(원하면 숫자만 바꾸면 됨)
 * - 200+ : 초기 대기
 * - 100~199 : 중간 대기
 * - 50~99 : 후반 대기
 * - 11~49 : 임박
 * - 1~10 : 거의 도착
 */
function band(position) {
  if (position === null || position === undefined) return 'LOADING'
  if (position <= 0) return 'DONE'
  if (position <= 10) return 'ALMOST'
  if (position <= 49) return 'SOON'
  if (position <= 99) return 'LATE'
  if (position <= 199) return 'MID'
  return 'EARLY'
}

// 상단 문구(“거의 다 왔어요” 같은 것)
const headlineText = computed(() => {
  if (status.value === 'ADMITTED') return '입장 가능합니다.'
  if (status.value === 'EXPIRED') return '대기 정보가 만료되었어요.'
  if (error.value) return '대기열 정보를 확인 중입니다.'

  const b = band(myNumber.value)
  switch (b) {
    case 'ALMOST':
      return '거의 다 왔어요.'
    case 'SOON':
      return '곧 입장합니다. 준비해주세요.'
    case 'LATE':
      return '입장 순서가 다가오고 있어요.'
    case 'MID':
      return '대기열이 진행 중입니다.'
    case 'EARLY':
      return '접속자가 많아 대기 중입니다.'
    case 'DONE':
      return '예매 페이지로 이동합니다.'
    default:
      return '대기열 정보를 불러오는 중이에요.'
  }
})

// 설명 문구 2줄(인원수에 따라)
const descLine1 = computed(() => {
  if (status.value === 'ADMITTED') return '잠시 후 예매하기 페이지로 연결됩니다.'
  const b = band(myNumber.value)
  switch (b) {
    case 'ALMOST':
      return '곧 예매 페이지로 연결됩니다.'
    case 'SOON':
      return '예매 준비를 해주세요.'
    case 'LATE':
      return '현재 접속 인원이 많아 대기중입니다.'
    case 'MID':
      return '대기열이 순서대로 진행되고 있습니다.'
    case 'EARLY':
      return '현재 접속 인원이 많아 대기중입니다.'
    case 'DONE':
      return '예매 페이지로 이동 중입니다.'
    default:
      return '대기열 상태를 확인하고 있습니다.'
  }
})

const descLine2 = computed(() => {
  // 예상 대기시간이 있으면 그걸 조금 “사람 친화적으로” 보여줌(원하면 이 줄 자체를 고정 문구로 바꿔도 됨)
  const sec = estimatedWaitSec.value
  if (sec === null || sec === undefined) {
    return '잠시만 기다려주시면 예매하기 페이지로 연결됩니다.'
  }
  if (sec < 60) return `예상 대기시간은 약 ${Math.ceil(sec / 10) * 10}초입니다.`
  const min = Math.ceil(sec / 60)
  return `예상 대기시간은 약 ${min}분입니다.`
})

// 새로고침 경고 문구(막바지일수록 강하게)
const hintText = computed(() => {
  const b = band(myNumber.value)
  if (b === 'ALMOST') {
    return '지금 새로고침/재접속하면 순번이 초기화될 수 있어요. 그대로 기다려주세요.'
  }
  if (b === 'SOON') {
    return '새로고침 하거나 재접속 하시면 대기순서가 초기화되어 대기시간이 더 길어질 수 있습니다.'
  }
  return '새로고침 하거나 재접속 하시면 대기순서가 초기화되어 대기시간이 더 길어집니다.'
})

function goHome() {
  router.push('/')
}

function getQueueToken() {
  return route.query.token || localStorage.getItem('queueToken')
}

async function fetchStatus() {
  const token = getQueueToken()
  if (!token) {
    error.value = 'queueToken이 없습니다. 처음 화면에서 다시 진입하세요.'
    return
  }

  if (loading.value) return
  loading.value = true
  error.value = ''

  try {
    const resp = await fetch(
      `${API_BASE}/queue/status?token=${encodeURIComponent(token)}`
    )
    if (!resp.ok) {
      const t = await resp.text().catch(() => '')
      throw new Error(`status failed: ${resp.status} ${t}`)
    }
    const data = await resp.json()

    status.value = data.status || ''
    estimatedWaitSec.value = data.estimatedWaitSec ?? null

    if (typeof data.position === 'number') {
      myNumber.value = data.position
      if (initial.value === null) initial.value = data.position
    }

    if (data.status === 'ADMITTED' && data.admissionToken) {
      await startReservationAndMove(data.admissionToken)
    }
  } catch (e) {
    console.error(e)
    error.value = '상태 조회에 실패했습니다. 백엔드(3000)/CORS를 확인하세요.'
  } finally {
    loading.value = false
  }
}

async function startReservationAndMove(admissionToken) {
  if (timer) {
    clearInterval(timer)
    timer = null
  }

  const resp = await fetch(`${API_BASE}/reservation/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admissionToken }),
  })

  if (!resp.ok) {
    const t = await resp.text().catch(() => '')
    throw new Error(`reservation/start failed: ${resp.status} ${t}`)
  }

  const data = await resp.json()
  localStorage.setItem('reservationId', data.reservationId)

  router.replace({
    path: '/booking',
    query: {
      showId: route.query.showId || '',
      reservationId: data.reservationId,
    },
  })
}

onMounted(async () => {
  await fetchStatus()
  timer = setInterval(fetchStatus, 1000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped src="../assets/styles/QueuePage.css"></style>
