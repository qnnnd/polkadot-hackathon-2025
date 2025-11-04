import { useState, useCallback, useEffect } from 'react';
import { parseEther, formatEther, type Address, encodeFunctionData } from 'viem';
import { CONTRACT_ADDRESS, publicClient } from '../config/wagmi';
import { useWallet } from '../contexts/WalletContext';
import ParkingLotABI from '@/app/abi/ParkingLot.json';

/**
 * 发送交易的辅助函数
 * 通过 WalletConnect 发送交易并等待确认
 */
async function sendTransaction(
  signClient: any,
  session: any,
  chainId: number,
  from: string,
  to: string,
  data: string,
  value: string = '0x0'
): Promise<string> {
  console.log('📝 准备发送交易请求到钱包...', {
    from,
    to,
    chainId,
    hasData: !!data,
    value,
    sessionTopic: session?.topic,
  });
  
  // 验证 session 的 namespace 配置
  console.log('🔍 检查 Session Namespaces:', {
    namespaces: session?.namespaces,
    eip155Chains: session?.namespaces?.eip155?.chains,
    accounts: session?.namespaces?.eip155?.accounts,
  });
  
  const chainIdString = `eip155:${chainId}`;
  console.log('📋 请求的 ChainId:', chainIdString);
  
  // 检查 session 是否支持该 chainId
  const supportedChains = session?.namespaces?.eip155?.chains || [];
  if (!supportedChains.includes(chainIdString)) {
    console.error('❌ Session 不支持该 ChainId!', {
      requested: chainIdString,
      supported: supportedChains,
    });
    throw new Error(
      '网络不匹配！\n' +
      '请在 MetaMask 中切换到 Mantle Sepolia 测试网络\n\n' +
      '网络信息：\n' +
      'Chain ID: 5003\n' +
      'RPC: https://rpc.sepolia.mantle.xyz\n' +
      '区块浏览器: https://sepolia.mantlescan.xyz'
    );
  }
  
  const tx = {
    from,
    to,
    data,
    value,
  };

  try {
    console.log('📱 调用 WalletConnect 请求钱包授权...', {
      topic: session.topic,
      chainId: chainIdString,
      method: 'eth_sendTransaction',
    });
    
    // 通过 WalletConnect 发送交易
    const txHash = await signClient.request({
      topic: session.topic,
      chainId: chainIdString,
      request: {
        method: 'eth_sendTransaction',
        params: [tx],
      },
    });

    console.log('✅ 交易已发送:', txHash);
    console.log('⏳ 等待交易确认...');

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    console.log('✅ 交易已确认!', {
      hash: txHash,
      blockNumber: receipt.blockNumber,
      status: receipt.status,
    });
    
    return txHash as string;
  } catch (error) {
    console.error('❌ 发送交易失败:', {
      error: error instanceof Error ? error.message : error,
      from,
      to,
      chainId,
    });
    throw error;
  }
}

/**
 * 车位数据类型
 */
export interface ParkingSpot {
  id: bigint;
  name: string;
  picture: string;
  location: string;
  owner: Address;
  renter: Address;
  rent_end_time: bigint;
  rent_price: bigint;
  latitude: bigint;
  longitude: bigint;
  create_time: bigint;
  update_time: bigint;
}

/**
 * 获取所有车位
 */
export function useAllParkingSpots() {
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchParkingSpots = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 开始从链上获取车位数据...');
      console.log('合约地址:', CONTRACT_ADDRESS);
      console.log('链 ID:', publicClient.chain?.id);
      console.log('RPC URL:', publicClient.chain?.rpcUrls?.default?.http?.[0]);
      
      const data = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ParkingLotABI,
        functionName: 'getAllParkingSpots',
      }) as ParkingSpot[];

      console.log('✅ 成功获取车位数据:', data?.length || 0, '个');
      if (data && data.length > 0) {
        console.log('第一个车位:', {
          id: data[0].id.toString(),
          name: data[0].name,
          location: data[0].location,
          latitude: (Number(data[0].latitude) / 1000000).toFixed(6),
          longitude: (Number(data[0].longitude) / 1000000).toFixed(6),
          owner: data[0].owner,
          renter: data[0].renter,
          rent_price: data[0].rent_price.toString(),
        });
      }

      setParkingSpots(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('❌ 获取车位数据失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParkingSpots();
  }, [fetchParkingSpots]);

  return {
    parkingSpots,
    isLoading,
    error,
    refetch: fetchParkingSpots,
  };
}

/**
 * 获取我的车位（我创建的）
 */
export function useMyParkingSpots() {
  const { address } = useWallet();
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMyParkingSpots = useCallback(async () => {
    if (!address) {
      setParkingSpots([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 获取我的车位,地址:', address);
      
      // 获取所有车位,然后筛选出当前用户创建的
      const allSpots = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ParkingLotABI,
        functionName: 'getAllParkingSpots',
      }) as ParkingSpot[];

      // 筛选出 owner 是当前地址的车位
      const mySpots = allSpots.filter(spot => 
        spot.owner.toLowerCase() === address.toLowerCase()
      );

      console.log('✅ 我的车位数量:', mySpots.length);
      setParkingSpots(mySpots);
    } catch (err) {
      setError(err as Error);
      console.error('❌ Failed to fetch my parking spots:', err);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchMyParkingSpots();
  }, [fetchMyParkingSpots]);

  return {
    parkingSpots,
    isLoading,
    error,
    refetch: fetchMyParkingSpots,
  };
}

/**
 * 铸造车位 NFT (真实写入链上)
 */
export function useMintParkingSpot() {
  const { address, signClient, session, chainId } = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const mintParkingSpot = useCallback(async (
    name: string,
    picture: string,
    location: string,
    rentPrice: string, // ETH 单位
    longitude: number,
    latitude: number
  ) => {
    if (!address) {
      throw new Error('请先连接钱包');
    }

    if (!signClient || !session) {
      throw new Error('WalletConnect 未连接');
    }

    try {
      setIsPending(true);
      setIsSuccess(false);
      setHash(null);
      setError(null);

      console.log('🚀 开始铸造车位 NFT:', {
        name,
        picture,
        location,
        rentPrice,
        longitude,
        latitude,
        address,
      });

      // 转换参数格式
      const rentPriceWei = parseEther(rentPrice);
      const longitudeScaled = BigInt(Math.round(longitude * 1000000)); // 精度 6 位小数
      const latitudeScaled = BigInt(Math.round(latitude * 1000000));

      // 编码函数调用
      const data = encodeFunctionData({
        abi: ParkingLotABI,
        functionName: 'mintParkingSpot',
        args: [name, picture, location, rentPriceWei, longitudeScaled, latitudeScaled],
      });

      // 发送真实交易
      const txHash = await sendTransaction(
        signClient,
        session,
        chainId,
        address,
        CONTRACT_ADDRESS,
        data
      );
      
      setHash(txHash);
      setIsSuccess(true);
      
      console.log('✅ 车位创建成功!');

      return txHash;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('❌ 铸造车位失败:', error);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [address, signClient, session, chainId]);

  return {
    mintParkingSpot,
    isPending,
    isSuccess,
    hash,
    error,
  };
}

/**
 * 租用车位 (真实写入链上)
 */
export function useRentParkingSpot() {
  const { address, signClient, session, chainId } = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const rentParkingSpot = useCallback(async (
    spotId: bigint,
    endTime: bigint
  ) => {
    if (!address) {
      throw new Error('请先连接钱包');
    }

    if (!signClient || !session) {
      throw new Error('WalletConnect 未连接');
    }

    try {
      setIsPending(true);
      setIsSuccess(false);
      setHash(null);
      setError(null);

      console.log('🚗 开始租用车位:', { spotId: spotId.toString(), endTime: endTime.toString() });

      // 获取车位信息以计算租金
      const spot = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ParkingLotABI,
        functionName: 'getParkingSpot',
        args: [spotId],
      }) as ParkingSpot;

      const rentValue = spot.rent_price;

      console.log('💰 租金:', formatEther(rentValue), 'MNT');

      // 编码函数调用
      const data = encodeFunctionData({
        abi: ParkingLotABI,
        functionName: 'rentParkingSpot',
        args: [spotId, endTime],
      });

      // 发送真实交易 (包含支付的租金)
      const txHash = await sendTransaction(
        signClient,
        session,
        chainId,
        address,
        CONTRACT_ADDRESS,
        data,
        `0x${rentValue.toString(16)}` // 租金作为 value
      );
      
      setHash(txHash);
      setIsSuccess(true);
      
      console.log('✅ 租用成功!');

      return txHash;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('❌ 租用车位失败:', error);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [address, signClient, session, chainId]);

  return {
    rentParkingSpot,
    isPending,
    isSuccess,
    hash,
    error,
  };
}

/**
 * 终止租赁 (实际写入链上)
 */
export function useTerminateRental() {
  const { address, signClient, session, chainId } = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const terminateRental = useCallback(async (spotId: bigint) => {
    if (!address) {
      throw new Error('请先连接钱包');
    }

    if (!signClient || !session) {
      throw new Error('WalletConnect 未连接');
    }

    try {
      setIsPending(true);
      setIsSuccess(false);
      setHash(null);
      setError(null);

      console.log('🛑 开始终止租赁:', { spotId: spotId.toString() });

      // 编码函数调用
      const data = encodeFunctionData({
        abi: ParkingLotABI,
        functionName: 'terminateRental',
        args: [spotId],
      });

      // 发送真实交易
      const txHash = await sendTransaction(
        signClient,
        session,
        chainId,
        address,
        CONTRACT_ADDRESS,
        data
      );
      
      setHash(txHash);
      setIsSuccess(true);
      
      console.log('✅ 终止租赁成功!');

      return txHash;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('❌ 终止租赁失败:', error);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [address, signClient, session, chainId]);

  return {
    terminateRental,
    isPending,
    isSuccess,
    hash,
    error,
  };
}

/**
 * 更新车位信息
 */
export function useUpdateParkingSpot() {
  const { address, signClient, session, chainId } = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const updateParkingSpot = useCallback(async (
    tokenId: string,
    name: string,
    picture: string,
    location: string,
    rentPrice: string,
    longitude: number,
    latitude: number
  ) => {
    if (!address) {
      throw new Error('请先连接钱包');
    }

    if (!signClient || !session) {
      throw new Error('WalletConnect 未连接');
    }

    try {
      setIsPending(true);
      setIsSuccess(false);
      setHash(null);
      setError(null);

      console.log('🔄 更新车位信息:', {
        tokenId,
        name,
        location,
        rentPrice,
        longitude,
        latitude,
      });

      // 转换租金价格为 wei
      const rentPriceInWei = parseEther(rentPrice);

      // 转换经纬度为合约所需格式 (乘以 1,000,000)
      const longitudeScaled = BigInt(Math.round(longitude * 1000000));
      const latitudeScaled = BigInt(Math.round(latitude * 1000000));

      // 编码函数调用
      const data = encodeFunctionData({
        abi: ParkingLotABI,
        functionName: 'updateParkingSpot',
        args: [
          BigInt(tokenId),
          name,
          picture,
          location,
          rentPriceInWei,
          longitudeScaled,
          latitudeScaled,
        ],
      });

      // 发送真实交易
      const txHash = await sendTransaction(
        signClient,
        session,
        chainId,
        address,
        CONTRACT_ADDRESS,
        data
      );
      
      setHash(txHash);
      setIsSuccess(true);
      
      console.log('✅ 车位更新成功!');

      return txHash;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('❌ 更新车位失败:', error);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [address, signClient, session, chainId]);

  return {
    updateParkingSpot,
    isPending,
    isSuccess,
    hash,
    error,
  };
}

/**
 * 销毁车位 NFT
 */
export function useBurnParkingSpot() {
  const { address, signClient, session, chainId } = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const burnParkingSpot = useCallback(async (spotId: string) => {
    if (!address) {
      throw new Error('请先连接钱包');
    }

    if (!signClient || !session) {
      console.error('❌ WalletConnect 状态检查失败:', {
        hasSignClient: !!signClient,
        hasSession: !!session,
        sessionTopic: session?.topic,
      });
      throw new Error('WalletConnect 未连接');
    }

    try {
      setIsPending(true);
      setIsSuccess(false);
      setHash(null);
      setError(null);

      console.log('🔥 准备销毁车位:', {
        spotId,
        address,
        hasSignClient: !!signClient,
        hasSession: !!session,
        chainId,
      });

      // 编码函数调用
      const data = encodeFunctionData({
        abi: ParkingLotABI,
        functionName: 'burnParkingSpot',
        args: [BigInt(spotId)],
      });

      console.log('📝 已编码交易数据:', {
        to: CONTRACT_ADDRESS,
        from: address,
        data,
        functionName: 'burnParkingSpot',
      });

      // 发送真实交易
      console.log('🚀 开始发送交易到钱包...');
      const txHash = await sendTransaction(
        signClient,
        session,
        chainId,
        address,
        CONTRACT_ADDRESS,
        data
      );
      
      setHash(txHash);
      setIsSuccess(true);
      
      console.log('✅ 车位销毁成功! TxHash:', txHash);

      return txHash;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('❌ 销毁车位失败:', {
        error: error.message,
        stack: error.stack,
        spotId,
      });
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [address, signClient, session, chainId]);

  return {
    burnParkingSpot,
    isPending,
    isSuccess,
    hash,
    error,
  };
}
