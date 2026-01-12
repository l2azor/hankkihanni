// 한끼했니 Service Worker - PWA 푸시 알림 지원

const CACHE_NAME = 'hankkihanni-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🍳 한끼했니 캐시 열기');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 오래된 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch 이벤트 - 네트워크 우선, 캐시 폴백
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  console.log('📬 푸시 알림 수신:', event);
  
  let data = {
    title: '한끼했니? 🍳',
    body: '오늘 밥은 먹었니? 안부를 알려줘!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'check-in-reminder',
    requireInteraction: true,
    actions: [
      { action: 'ate', title: '먹었어 🍚' },
      { action: 'not-ate', title: '아직... 🍳' }
    ],
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      requireInteraction: data.requireInteraction,
      actions: data.actions,
      data: data.data,
      vibrate: [200, 100, 200]
    })
  );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 알림 클릭:', event.action);
  event.notification.close();

  const action = event.action;
  let url = '/';

  // 액션에 따른 URL 설정
  if (action === 'ate' || action === 'not-ate') {
    url = `/?action=${action}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열린 창이 있으면 포커스
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICK', action });
            return client.focus();
          }
        }
        // 없으면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// 백그라운드 동기화 (오프라인 응답 저장용)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-checkin') {
    event.waitUntil(syncCheckIn());
  }
});

async function syncCheckIn() {
  // IndexedDB에서 대기 중인 체크인 데이터 가져와서 서버로 전송
  console.log('🔄 오프라인 체크인 동기화');
}
