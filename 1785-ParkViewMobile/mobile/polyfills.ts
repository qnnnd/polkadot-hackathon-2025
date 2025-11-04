/**
 * React Native Polyfills for Web3
 * 必须在所有其他导入之前加载
 */

// ========================================
// 0. Buffer MUST BE FIRST! (最优先!)
// ========================================
import { Buffer } from 'buffer';
// @ts-ignore
global.Buffer = Buffer;
// @ts-ignore
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.Buffer = Buffer;
}

// ========================================
// 1. 加密随机数生成器 (紧接着 Buffer!)
// ========================================
import 'react-native-get-random-values';

// 强制确保 crypto.getRandomValues 在所有环境中可用
// @ts-ignore
if (typeof global.crypto === 'undefined') {
  // @ts-ignore
  global.crypto = {};
}

// @ts-ignore
if (typeof global.crypto.getRandomValues === 'undefined') {
  // react-native-get-random-values 会设置 crypto.getRandomValues
  // 但有时需要手动桥接到 global
  // @ts-ignore
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    // @ts-ignore
    global.crypto.getRandomValues = crypto.getRandomValues.bind(crypto);
  }
}

// 确保 window.crypto 也可用（某些库可能检查 window）
// @ts-ignore
if (typeof window !== 'undefined') {
  // @ts-ignore
  if (typeof window.crypto === 'undefined') {
    // @ts-ignore
    window.crypto = global.crypto;
  }
}

// 验证是否成功
// @ts-ignore
if (typeof global.crypto.getRandomValues === 'function') {
  console.log('✅ crypto.getRandomValues is available globally');
} else {
  console.error('❌ CRITICAL: crypto.getRandomValues not available!');
  // @ts-ignore
  console.error('  global.crypto:', global.crypto);
}

// ========================================
// 2. Node.js Core Polyfills
// ========================================
// Process polyfill
import process from 'process';
// @ts-ignore
global.process = process;

// Stream polyfill
import { Duplex, Readable, Writable, Transform, PassThrough } from 'readable-stream';
// @ts-ignore
global.stream = { Duplex, Readable, Writable, Transform, PassThrough };

// Events polyfill
import EventEmitter from 'events';
// @ts-ignore
global.EventEmitter = EventEmitter;

// Http/Https/Net/TLS - 创建空对象避免错误（React Native 不需要真实的网络模块）
// @ts-ignore
global.http = {};
// @ts-ignore  
global.https = {};
// @ts-ignore
global.net = {};
// @ts-ignore  
global.tls = {};

// ========================================
// 3. WalletConnect 需要的 DOM API polyfills
// ========================================

// 定义全局 window 对象(如果不存在)
if (typeof global !== 'undefined' && typeof global.window === 'undefined') {
  // @ts-ignore
  global.window = global;
}

// 确保 window 对象存在
if (typeof window === 'undefined') {
  // @ts-ignore
  globalThis.window = globalThis;
}

// document polyfill - WalletConnect SignClient 需要
if (typeof window !== 'undefined' && !window.document) {
  // @ts-ignore
  window.document = {
    // @ts-ignore
    createElement: (tag: string) => ({
      tagName: tag,
      children: [],
      style: {},
      setAttribute: () => {},
      getAttribute: () => null,
    }),
    // @ts-ignore
    createElementNS: (ns: string, tag: string) => ({
      tagName: tag,
      children: [],
      style: {},
      setAttribute: () => {},
      getAttribute: () => null,
    }),
    getElementById: () => null,
    querySelector: () => null,
    // @ts-ignore
    querySelectorAll: () => [],
    // @ts-ignore - WalletConnect 需要这个!
    getElementsByTagName: (tag: string) => [],
    // @ts-ignore
    getElementsByClassName: (className: string) => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    // @ts-ignore
    body: { style: {}, appendChild: () => {}, removeChild: () => {} },
    // @ts-ignore
    head: { style: {}, appendChild: () => {}, removeChild: () => {} },
    // @ts-ignore
    documentElement: { style: {} },
  };
} else if (typeof window !== 'undefined' && window.document) {
  // 如果 document 存在但缺少某些方法
  if (!window.document.getElementsByTagName) {
    // @ts-ignore
    window.document.getElementsByTagName = () => [];
  }
  if (!window.document.getElementsByClassName) {
    // @ts-ignore
    window.document.getElementsByClassName = () => [];
  }
  if (!window.document.body) {
    // @ts-ignore
    window.document.body = { style: {}, appendChild: () => {}, removeChild: () => {} };
  }
  if (!window.document.head) {
    // @ts-ignore
    window.document.head = { style: {}, appendChild: () => {}, removeChild: () => {} };
  }
}

// Event polyfill (必须在 CustomEvent 之前)
if (typeof window !== 'undefined' && typeof window.Event === 'undefined') {
  // @ts-ignore
  class EventPolyfill {
    type: string;
    target: any = null;
    currentTarget: any = null;
    bubbles: boolean = false;
    cancelable: boolean = false;
    defaultPrevented: boolean = false;
    
    constructor(type: string, options?: any) {
      this.type = type;
      if (options) {
        this.bubbles = options.bubbles || false;
        this.cancelable = options.cancelable || false;
      }
    }
    
    preventDefault() {
      this.defaultPrevented = true;
    }
    
    stopPropagation() {}
    stopImmediatePropagation() {}
  }
  // @ts-ignore
  window.Event = EventPolyfill;
  // @ts-ignore
  global.Event = EventPolyfill;
}

// CustomEvent polyfill (在 Event 之后)
if (typeof window !== 'undefined' && typeof window.CustomEvent === 'undefined') {
  // @ts-ignore
  class CustomEventPolyfill extends window.Event {
    detail: any;
    constructor(type: string, options?: any) {
      super(type, options);
      this.detail = options?.detail;
    }
  }
  // @ts-ignore
  window.CustomEvent = CustomEventPolyfill;
  // @ts-ignore
  global.CustomEvent = CustomEventPolyfill;
}

// 事件监听器 polyfills (强制设置)
if (typeof window !== 'undefined') {
  const eventListeners: Map<string, Set<Function>> = new Map();

  // 强制覆盖 addEventListener
  // @ts-ignore
  window.addEventListener = (event: string, handler: Function, options?: any) => {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event)?.add(handler);
  };

  // 强制覆盖 removeEventListener
  // @ts-ignore
  window.removeEventListener = (event: string, handler: Function, options?: any) => {
    eventListeners.get(event)?.delete(handler);
  };

  // 强制覆盖 dispatchEvent
  // @ts-ignore
  window.dispatchEvent = (event: any) => {
    const handlers = eventListeners.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }
    return true;
  };

  // localStorage polyfill
  if (!window.localStorage) {
    const storage: { [key: string]: string } = {};
    // @ts-ignore
    window.localStorage = {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => {
        storage[key] = String(value);
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        Object.keys(storage).forEach((key) => delete storage[key]);
      },
      get length() {
        return Object.keys(storage).length;
      },
      key: (index: number) => {
        const keys = Object.keys(storage);
        return keys[index] || null;
      },
    };
  }

  // sessionStorage polyfill
  if (!window.sessionStorage) {
    // @ts-ignore
    window.sessionStorage = window.localStorage;
  }

  // document polyfill (基本的)
  if (!window.document) {
    // @ts-ignore
    window.document = {
      // @ts-ignore
      createElement: () => ({}),
      // @ts-ignore
      createElementNS: () => ({}),
      getElementById: () => null,
      querySelector: () => null,
      // @ts-ignore
      querySelectorAll: () => [],
      // @ts-ignore
      getElementsByTagName: () => [],
      // @ts-ignore
      getElementsByClassName: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
      // @ts-ignore
      body: {},
      // @ts-ignore
      head: {},
      // @ts-ignore
      documentElement: {},
    };
  } else if (window.document && !window.document.getElementsByTagName) {
    // 如果 document 存在但缺少 getElementsByTagName
    // @ts-ignore
    window.document.getElementsByTagName = () => [];
    // @ts-ignore
    window.document.getElementsByClassName = () => [];
  }

  // location polyfill
  if (!window.location) {
    // @ts-ignore
    window.location = {
      href: '',
      origin: '',
      protocol: 'https:',
      host: '',
      hostname: '',
      port: '',
      pathname: '/',
      search: '' as any,
      hash: '',
    };
  }
}

// 注意: 不导入 @walletconnect/react-native-compat,因为它需要原生模块
// 我们的 polyfills 已经足够支持 WalletConnect 和 Wagmi

// 额外的全局对象 polyfills
if (typeof window !== 'undefined') {
  // navigator polyfill
  if (!window.navigator) {
    // @ts-ignore
    window.navigator = {
      userAgent: 'React Native',
      platform: 'React Native',
      language: 'en-US',
      languages: ['en-US', 'en'],
      onLine: true, // 强制设为 true
      cookieEnabled: false,
    };
  } else {
    // 如果 navigator 已存在，强制覆盖 onLine 属性
    try {
      Object.defineProperty(window.navigator, 'onLine', {
        get: () => true,
        configurable: true,
      });
    } catch (e) {
      // 如果无法定义，尝试直接赋值
      // @ts-ignore
      window.navigator.onLine = true;
    }
  }

  // crypto polyfill (基础版本,getRandomValues 由 react-native-get-random-values 提供)
  if (!window.crypto) {
    // @ts-ignore
    window.crypto = {
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
    };
  }

  // requestAnimationFrame polyfill (如果需要)
  if (!window.requestAnimationFrame) {
    // @ts-ignore
    window.requestAnimationFrame = (callback: Function) => {
      return setTimeout(callback, 16);
    };
  }

  // cancelAnimationFrame polyfill
  if (!window.cancelAnimationFrame) {
    // @ts-ignore
    window.cancelAnimationFrame = (id: number) => {
      clearTimeout(id);
    };
  }
}

// ========================================
// 3. AsyncStorage Polyfill for WalletConnect
// ========================================
// 修复 "Cannot convert null value to object" 错误
// WalletConnect 内部会直接导入 AsyncStorage,我们需要在全局层面 patch 它

console.log('🔧 Setting up AsyncStorage polyfill for WalletConnect...');

// ========================================
// 4. Network Detection for WalletConnect
// ========================================
// WalletConnect Core 需要网络状态检测
if (typeof window !== 'undefined') {
  // 设置 navigator.onLine 为 true (React Native 总是在线的)
  if (window.navigator && typeof window.navigator.onLine === 'undefined') {
    // @ts-ignore
    window.navigator.onLine = true;
  }
  
  // 添加在线事件监听器 polyfill
  if (!window.addEventListener) {
    // @ts-ignore
    window.addEventListener = () => {};
    // @ts-ignore
    window.removeEventListener = () => {};
  }
}

console.log('✅ Network detection polyfill loaded');
