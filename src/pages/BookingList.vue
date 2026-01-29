<template>
  <section class="booking">
    <div class="sectionTitle">예매내역</div>

    <div v-if="loading" class="hint">불러오는 중...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="tickets.length === 0" class="empty">
      아직 예매내역이 없어요.
    </div>

    <div v-else class="list">
      <article v-for="t in tickets" :key="t.ticket_id" class="item">
        <div class="row">
          <div class="eventName" translate="no">{{ t.event?.name }}</div>
          <div class="seat">좌석 {{ t.seat_number }}</div>
        </div>

        <div class="meta" translate="no">
          <div>장소: {{ t.event?.venue_name }} ({{ t.event?.hall_code }})</div>
          <div>공연일: {{ formatDateTime(t.event_at) }}</div>
          <div>예매일: {{ formatDateTime(t.booked_at) }}</div>
          <div v-if="t.canceled_at" class="canceled">취소됨: {{ formatDateTime(t.canceled_at) }}</div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  userId: { type: String, default: '' },
})

const API_BASE = import.meta.env.VITE_API_BASE_URL

const tickets = ref([])
const loading = ref(false)
const error = ref('')

function formatDateTime(v) {
  if (!v) return ''
  // 간단 데모용 포맷 (KST 보이게)
  try {
    const d = new Date(v)
    return d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  } catch {
    return String(v)
  }
}

async function fetchTickets(userId) {
  if (!userId) return
  loading.value = true
  error.value = ''
  try {
    const resp = await fetch(`${API_BASE}/tickets?userId=${encodeURIComponent(userId)}`)
    const data = await resp.json().catch(() => ({}))

    if (!resp.ok) {
      error.value = data?.error ? String(data.error) : 'failed_to_load'
      tickets.value = []
      return
    }

    tickets.value = Array.isArray(data?.tickets) ? data.tickets : []
  } catch (e) {
    console.error(e)
    error.value = 'network_error'
    tickets.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (props.userId) fetchTickets(props.userId)
})

watch(
  () => props.userId,
  (v) => {
    if (v) fetchTickets(v)
  }
)
</script>

<style scoped>
.booking { margin-top: 16px; }
.sectionTitle { font-weight: 700; margin-bottom: 10px; }
.hint, .empty { opacity: 0.8; padding: 12px 0; }
.error { color: crimson; padding: 12px 0; }
.list { display: grid; gap: 10px; }
.item { border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 12px; }
.row { display: flex; justify-content: space-between; gap: 12px; }
.eventName { font-weight: 700; }
.seat { font-weight: 600; }
.meta { margin-top: 8px; font-size: 13px; line-height: 1.45; opacity: 0.9; }
.canceled { color: crimson; font-weight: 600; }
</style>
