/**
 * 测试脚本: 直接查询 Mantle Sepolia 链上的车位数据
 * 运行: node test-contract.js
 */

const { createPublicClient, http } = require('viem');

// Mantle Sepolia 配置
const mantleSepolia = {
  id: 5003,
  name: 'Mantle Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
    public: { http: ['https://rpc.sepolia.mantle.xyz'] },
  },
  testnet: true,
};

// 合约地址
const CONTRACT_ADDRESS = '0x32cE53dEd16b49d4528FeF7324Df1a77E7a64b55';

// 合约 ABI (简化版，只包含 getAllParkingSpots)
const ABI = require('./app/abi/ParkingLot.json');

// 创建客户端
const publicClient = createPublicClient({
  chain: mantleSepolia,
  transport: http(),
});

async function testContract() {
  console.log('='.repeat(60));
  console.log('🔍 测试 Mantle Sepolia 链上数据查询');
  console.log('='.repeat(60));
  console.log('合约地址:', CONTRACT_ADDRESS);
  console.log('RPC URL:', mantleSepolia.rpcUrls.default.http[0]);
  console.log('链 ID:', mantleSepolia.id);
  console.log('');

  try {
    // 获取当前区块高度
    console.log('📡 连接 RPC...');
    const blockNumber = await publicClient.getBlockNumber();
    console.log('✅ RPC 连接成功!');
    console.log('当前区块高度:', blockNumber.toString());
    console.log('');

    // 读取合约数据
    console.log('📖 读取合约数据: getAllParkingSpots()');
    const data = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'getAllParkingSpots',
    });

    console.log('✅ 成功读取数据!');
    console.log('车位数量:', data.length);
    console.log('');

    if (data.length === 0) {
      console.log('⚠️  链上暂无车位数据');
      console.log('提示: 需要先调用 mintParkingSpot 创建车位');
    } else {
      console.log('='.repeat(60));
      console.log('📋 车位列表:');
      console.log('='.repeat(60));
      
      data.forEach((spot, index) => {
        const lat = Number(spot.latitude) / 1000000;
        const lng = Number(spot.longitude) / 1000000;
        const rentPrice = Number(spot.rent_price) / 1e18; // wei to MNT
        const isRented = spot.renter !== '0x0000000000000000000000000000000000000000';

        console.log(`\n【车位 ${index + 1}】`);
        console.log('  ID:', spot.id.toString());
        console.log('  名称:', spot.name);
        console.log('  位置:', spot.location);
        console.log('  坐标:', `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        console.log('  租金:', rentPrice, 'MNT/天');
        console.log('  车主:', spot.owner);
        console.log('  租客:', spot.renter);
        console.log('  状态:', isRented ? '🔴 已出租' : '🟢 可租用');
        console.log('  创建时间:', new Date(Number(spot.create_time) * 1000).toLocaleString('zh-CN'));
      });
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ 测试完成!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行测试
testContract();
