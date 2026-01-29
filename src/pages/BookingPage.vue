<template>
  <div class="page">
    <header class="header">
      <div class="container headInner">
        <button class="back" @click="goHome">◀</button>
        <div class="headTitle">좌석 선택</div>
        <button class="menu">☰</button>
      </div>

      <div class="container sub">
        <template v-if="selectedList.length">
          <div class="seatLine">
            선택 좌석 : {{ selectedList.join(', ') }}
          </div>
        </template>
        <template v-else>
          <div class="hintText">좌석을 선택해 주세요.</div>
        </template>
      </div>
    </header>

    <main class="container main">
      <div class="stage">Stage</div>

      <div class="grid">
        <button
          v-for="seat in seats"
          :key="seat"
          class="seat"
          :class="{ selected: selectedSeats.has(seat) }"
          @click="toggleSeat(seat)"
        >
          {{ seat }}
        </button>
      </div>
    </main>

    <div v-if="count > 0" class="bottomBar">
      <div class="bottomInner container">
        <div class="count">총 {{ count }} 매</div>
        <button class="reserve" @click="reserveTicket" :disabled="loading">
          {{ loading ? '예매 중...' : '티켓 예매' }}
        </button>
      </div>
      <p v-if="error" style="color:crimson; margin-top:10px" class="container">
        {{ error }}
      </p>
    </div>

    <SuccessModal
      :open="modalOpen"
      title="예매 성공!"
      message="예매가 완료되었습니다."
      @close="onCloseModal"
    />
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import SuccessModal from '../components/SuccessModal.vue'

  const router = useRouter()

  const API_BASE = import.meta.env.VITE_API_BASE_URL

  const seats = Array.from({ length: 30 }, (_, i) => i + 1)
  const selectedSeats = ref(new Set())
  const selectedList = computed(() => [...selectedSeats.value].sort((a, b) => a - b))

  const modalOpen = ref(false)
  const loading = ref(false)
  const error = ref('')
  const count = computed(() => selectedSeats.value.size)

  function toggleSeat(seat) {
    const next = new Set(selectedSeats.value)
    if (next.has(seat)) next.delete(seat)
    else next.add(seat)
    selectedSeats.value = next
  }

  function goHome() {
    router.push('/')
  }

  function onCloseModal() {
    modalOpen.value = false
    router.push('/') // 원하면 '/reservations'로 보내도 됨
  }

  function getAuthUser() {
    try {
      const raw = localStorage.getItem('auth_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  /**
   * ✅ 예매하기: POST /tickets
   * body: { userId, eventId, eventAt, seatNumbers }
   */
  async function reserveTicket() {
    if (loading.value) return
    error.value = ''

    // 1) 좌석 선택 체크
    if (selectedList.value.length === 0) {
      alert('좌석을 선택해 주세요.')
      return
    }

    // 2) 로그인 체크 (여기에서!)
    const raw = localStorage.getItem('auth_user')
    const user = raw ? JSON.parse(raw) : null
    const userId = user?.id

    /* 로그인 체크 주석 처리 (누구나 예매 가능)
    if (!userId) {
      alert('로그인한 사용자만 예매가 가능합니다. (대기열 체험은 가능)')
      return
    }
    */

    // 3) eventId / eventAt 가져오기
    const eventId = Number(localStorage.getItem('eventId'))
    const eventAt = (localStorage.getItem('eventAt') || '').trim()

    if (!eventId) {
      alert('이벤트 정보가 없습니다. 홈에서 공연을 다시 선택해 주세요.')
      router.push('/')
      return
    }
    if (!eventAt) {
      alert('공연 일시(eventAt)가 없습니다. (데모용) eventAt 값을 세팅해 주세요.')
      return
    }

    loading.value = true

    try {
      const resp = await fetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          eventId,
          eventAt,                // 예: "2026-02-23T19:00:00+09:00"
          seatNumbers: selectedList.value,
        }),
      })

      const data = await resp.json().catch(() => ({}))

      if (!resp.ok) {
        if (resp.status === 409 && data?.error === 'seat_already_reserved') {
          alert('선택한 좌석 중 이미 예매된 좌석이 있습니다. 다른 좌석을 선택해 주세요.')
          return
        }
        if (resp.status === 404 && data?.error === 'event_not_found') {
          alert('이벤트를 찾을 수 없습니다. 홈에서 다시 선택해 주세요.')
          router.push('/')
          return
        }
        alert('예매에 실패했습니다.')
        error.value = data?.error ? String(data.error) : 'reserve_failed'
        return
      }

      // 성공: 필요하면 예매 결과 저장
      localStorage.setItem('last_reserved_tickets', JSON.stringify(data.tickets || []))

      // 선택 초기화 + 성공 모달
      selectedSeats.value = new Set()
      modalOpen.value = true
    } catch (e) {
      console.error(e)
      alert('서버 연결에 실패했습니다.')
      error.value = 'network_error'
    } finally {
      loading.value = false
    }
  }
</script>


<style scoped src="../assets/styles/BookingPage.css"></style>
