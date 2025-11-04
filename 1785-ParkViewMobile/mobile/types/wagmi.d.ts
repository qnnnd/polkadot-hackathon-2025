// 为 React Native 环境声明 Wagmi 模块
declare module 'wagmi' {
  export * from 'wagmi/dist';
}

declare module '@wagmi/core' {
  export * from '@wagmi/core/dist';
}

declare module '@wagmi/connectors' {
  export * from '@wagmi/connectors/dist';
}

declare module '@web3modal/wagmi-react-native' {
  export * from '@web3modal/wagmi-react-native/lib/commonjs';
}
