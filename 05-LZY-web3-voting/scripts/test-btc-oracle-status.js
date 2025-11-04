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

// Contract addresses
const BTC_ORACLE_ADDRESS = "0x0072c64A3974497c946291A70827e09E7BC2aEbF";

// BTCOracle ABI (relevant functions)
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
    inputs: [
      { internalType: "uint256", name: "votingPeriodId", type: "uint256" },
      { internalType: "uint256", name: "index", type: "uint256" },
    ],
    name: "getSnapshot",
    outputs: [
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "uint256", name: "btcMarketCap", type: "uint256" },
      {
        internalType: "uint256",
        name: "highestCompetitorCap",
        type: "uint256",
      },
      { internalType: "uint256", name: "winningCompetitorId", type: "uint256" },
      { internalType: "uint8", name: "result", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

async function testBTCOracleStatus() {
  console.log("🔍 检查 BTCOracle 合约状态...\n");

  const publicClient = createPublicClient({
    chain: moonbaseAlpha,
    transport: http(),
  });

  try {
    // Test network connection
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`✅ 连接到 Moonbase Alpha. 当前区块: ${blockNumber}\n`);

    // Get current voting period
    const currentPeriod = await publicClient.readContract({
      address: BTC_ORACLE_ADDRESS,
      abi: btcOracleAbi,
      functionName: "currentVotingPeriod",
    });
    console.log(`📊 当前投票期: ${currentPeriod}\n`);

    const votingPeriodId = Number(currentPeriod);

    // Check snapshot count
    const snapshotCount = await publicClient.readContract({
      address: BTC_ORACLE_ADDRESS,
      abi: btcOracleAbi,
      functionName: "getSnapshotCount",
      args: [BigInt(votingPeriodId)],
    });
    console.log(`📸 快照次数: ${snapshotCount}`);

    // Check last snapshot time
    const lastSnapshotTime = await publicClient.readContract({
      address: BTC_ORACLE_ADDRESS,
      abi: btcOracleAbi,
      functionName: "lastSnapshotTime",
      args: [BigInt(votingPeriodId)],
    });
    console.log(
      `⏰ 最后快照时间: ${lastSnapshotTime} (${lastSnapshotTime > 0 ? new Date(Number(lastSnapshotTime) * 1000).toLocaleString() : "无"})`,
    );

    // Check if can take snapshot
    const canTakeSnapshot = await publicClient.readContract({
      address: BTC_ORACLE_ADDRESS,
      abi: btcOracleAbi,
      functionName: "canTakeSnapshot",
      args: [BigInt(votingPeriodId)],
    });
    console.log(`🎯 是否可以快照: ${canTakeSnapshot}`);

    // If there are snapshots, get the latest one
    if (Number(snapshotCount) > 0) {
      console.log(`\n📋 获取最新快照数据...`);
      const latestSnapshot = await publicClient.readContract({
        address: BTC_ORACLE_ADDRESS,
        abi: btcOracleAbi,
        functionName: "getSnapshot",
        args: [BigInt(votingPeriodId), BigInt(Number(snapshotCount) - 1)],
      });

      console.log(
        `  时间戳: ${latestSnapshot[0]} (${new Date(Number(latestSnapshot[0]) * 1000).toLocaleString()})`,
      );
      console.log(`  BTC市值: ${latestSnapshot[1].toString()}`);
      console.log(`  最高竞争链市值: ${latestSnapshot[2].toString()}`);
      console.log(`  获胜竞争链ID: ${latestSnapshot[3].toString()}`);
      console.log(
        `  结果: ${latestSnapshot[4]} (0=BTC主导, 1=竞争链获胜, 2=待定)`,
      );
    }

    console.log(`\n💡 诊断结果:`);
    if (Number(snapshotCount) === 0) {
      console.log(`❌ 快照次数为0，可能的原因:`);
      console.log(`   1. 确实没有进行过快照操作`);
      console.log(`   2. takeMarketSnapshot() 调用失败`);
      console.log(`   3. 合约状态没有正确更新`);
    } else {
      console.log(`✅ 发现 ${snapshotCount} 次快照记录`);
    }

    if (Number(lastSnapshotTime) === 0) {
      console.log(`❌ 最后快照时间为0，说明没有快照记录`);
    }
  } catch (error) {
    console.error("❌ 检查 BTCOracle 状态时出错:", error);
  }
}

// Run the test
testBTCOracleStatus().catch(console.error);
