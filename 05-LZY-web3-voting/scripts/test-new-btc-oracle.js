import { createPublicClient, http } from "viem";

// Moonbase Alpha configuration
const moonbaseAlpha = {
  id: 1287,
  name: "Moonbase Alpha",
  rpcUrls: {
    default: {
      http: ["https://rpc.api.moonbase.moonbeam.network"],
    },
  },
};

// New contract addresses
const NEW_BTC_ORACLE_ADDRESS = "0x0bc48e6406C91448D8BE6c00AD77Cad8FaE4Fb2b";
const MOCK_PRICE_FEED_ADDRESS = "0xF856f753AEB0eF14c28a27Af585d1B54b9447Bbc";

// BTCOracle ABI (basic functions)
const btcOracleAbi = [
  {
    inputs: [
      { internalType: "uint256", name: "votingPeriodId", type: "uint256" },
    ],
    name: "getSnapshotCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "votingPeriodId", type: "uint256" },
    ],
    name: "lastSnapshotTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "votingPeriodId", type: "uint256" },
    ],
    name: "canTakeSnapshot",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "currentVotingPeriod",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "competitorCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

// MockPriceFeed ABI (basic functions)
const mockPriceFeedAbi = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
];

async function testNewBTCOracle() {
  console.log("🔧 测试新的 BTCOracle 合约...\n");

  const publicClient = createPublicClient({
    chain: moonbaseAlpha,
    transport: http(),
  });

  try {
    // Test network connection
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`✅ 连接到 Moonbase Alpha. 当前区块: ${blockNumber}\n`);

    // 1. 测试新的 BTCOracle 合约
    console.log("1️⃣ 测试新的 BTCOracle 合约...");
    console.log(`   地址: ${NEW_BTC_ORACLE_ADDRESS}`);

    try {
      const currentPeriod = await publicClient.readContract({
        address: NEW_BTC_ORACLE_ADDRESS,
        abi: btcOracleAbi,
        functionName: "currentVotingPeriod",
      });
      console.log(`   ✅ 当前投票期: ${currentPeriod}`);

      const competitorCount = await publicClient.readContract({
        address: NEW_BTC_ORACLE_ADDRESS,
        abi: btcOracleAbi,
        functionName: "competitorCount",
      });
      console.log(`   ✅ 竞争链数量: ${competitorCount}`);

      const snapshotCount = await publicClient.readContract({
        address: NEW_BTC_ORACLE_ADDRESS,
        abi: btcOracleAbi,
        functionName: "getSnapshotCount",
        args: [1n],
      });
      console.log(`   ✅ 快照次数: ${snapshotCount}`);

      const canTakeSnapshot = await publicClient.readContract({
        address: NEW_BTC_ORACLE_ADDRESS,
        abi: btcOracleAbi,
        functionName: "canTakeSnapshot",
        args: [1n],
      });
      console.log(`   ✅ 可以快照: ${canTakeSnapshot}`);
    } catch (error) {
      console.log(`   ❌ BTCOracle 合约调用失败: ${error.message}`);
    }

    // 2. 测试 MockPriceFeed 合约
    console.log("\n2️⃣ 测试 MockPriceFeed 合约...");
    console.log(`   地址: ${MOCK_PRICE_FEED_ADDRESS}`);

    try {
      const decimals = await publicClient.readContract({
        address: MOCK_PRICE_FEED_ADDRESS,
        abi: mockPriceFeedAbi,
        functionName: "decimals",
      });
      console.log(`   ✅ 小数位数: ${decimals}`);

      const latestRoundData = await publicClient.readContract({
        address: MOCK_PRICE_FEED_ADDRESS,
        abi: mockPriceFeedAbi,
        functionName: "latestRoundData",
      });
      console.log(`   ✅ 最新价格数据:`);
      console.log(`     轮次ID: ${latestRoundData[0]}`);
      console.log(`     价格: ${latestRoundData[1].toString()}`);
      console.log(`     开始时间: ${latestRoundData[2]}`);
      console.log(`     更新时间: ${latestRoundData[3]}`);
    } catch (error) {
      console.log(`   ❌ MockPriceFeed 合约调用失败: ${error.message}`);
    }

    console.log("\n🎉 新合约测试完成！");
  } catch (error) {
    console.error("❌ 测试过程中出错:", error);
  }
}

// Run the test
testNewBTCOracle().catch(console.error);
