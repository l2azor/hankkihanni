// 푸시 알림 관련 유틸리티

// VAPID 공개키 (Supabase 또는 자체 서버에서 생성)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

// Service Worker 등록
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker를 지원하지 않는 브라우저입니다.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    console.log('🍳 Service Worker 등록 성공:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker 등록 실패:', error);
    return null;
  }
}

// 푸시 알림 권한 요청
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('이 브라우저는 알림을 지원하지 않습니다.');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('알림 권한:', permission);
  return permission;
}

// 푸시 구독
export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    // 기존 구독 확인
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('기존 푸시 구독 사용');
      return subscription;
    }

    // 새 구독 생성
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('새 푸시 구독 생성:', subscription);
    return subscription;
  } catch (error) {
    console.error('푸시 구독 실패:', error);
    return null;
  }
}

// 푸시 구독 정보를 서버에 저장
export async function savePushSubscription(
  userId: string,
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        subscription: subscription.toJSON()
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('푸시 구독 저장 실패:', error);
    return false;
  }
}

// Base64 URL을 Uint8Array로 변환 (VAPID 키 변환용)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 로컬 알림 표시 (테스트용)
export function showLocalNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...options
    });
  }
}

// 알림 권한 상태 확인
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}
