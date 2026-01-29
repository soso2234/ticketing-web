import { createRouter, createWebHistory } from 'vue-router'

import HomePage from '../pages/HomePage.vue'
import LoginPage from '../pages/LoginPage.vue'
import QueuePage from '../pages/QueuePage.vue'
import BookingPage from '../pages/BookingPage.vue'
import MyPage from '../pages/MyPage.vue'
import SignupPage from '../pages/SignupPage.vue'
import EmailLoginPage from '../pages/EmailLoginPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/login', component: LoginPage },
    { path: '/signup', component: SignupPage },
    { path: '/email-login', component: EmailLoginPage },

    // 로그인 필요 페이지
    { path: '/queue', component: QueuePage },
    { path: '/booking', component: BookingPage },
    { path: '/mypage', component: MyPage },
  ],
})

/**
 * 🔐 전역 로그인 가드
 */
router.beforeEach((to, from, next) => {
  let isLoggedIn = false

  try {
    const raw = localStorage.getItem('auth_user')
    const parsed = raw ? JSON.parse(raw) : null
    isLoggedIn = !!parsed?.id
  } catch {
    isLoggedIn = false
  }

  /* 로그인 필요할 때 사용 예정, 지금은 아님! 
  const requiresAuth = ['/queue', '/booking', '/mypage'].includes(to.path)

  if (requiresAuth && !isLoggedIn) {
    alert('로그인이 필요합니다.')
    return next('/login')
  }
  */

  next()
})

export default router
