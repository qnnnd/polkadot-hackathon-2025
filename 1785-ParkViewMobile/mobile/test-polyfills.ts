/**
 * Polyfills 测试
 * 验证浏览器 API 是否正确加载
 */

import '@/mobile/polyfills';

console.log('=== Polyfills Test ===');
console.log('window exists:', typeof window !== 'undefined');
console.log('window.addEventListener:', typeof window?.addEventListener);
console.log('window.removeEventListener:', typeof window?.removeEventListener);
console.log('window.dispatchEvent:', typeof window?.dispatchEvent);
console.log('window.Event:', typeof window?.Event);
console.log('window.CustomEvent:', typeof window?.CustomEvent);
console.log('window.localStorage:', typeof window?.localStorage);
console.log('window.navigator:', typeof window?.navigator);

// 测试事件监听器
if (typeof window !== 'undefined' && window.addEventListener) {
  try {
    let eventFired = false;
    window.addEventListener('test-event', () => {
      eventFired = true;
      console.log('✅ Event listener works!');
    });
    
    const event = new (window as any).CustomEvent('test-event', { detail: 'test' });
    window.dispatchEvent(event);
    
    if (eventFired) {
      console.log('✅ All polyfills working correctly!');
    } else {
      console.log('❌ Event not fired');
    }
  } catch (error) {
    console.error('❌ Polyfills test failed:', error);
  }
} else {
  console.error('❌ window.addEventListener is not defined!');
}

export {};
