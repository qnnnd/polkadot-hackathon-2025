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

// BTCOracle ABI
const btcOracleAbi = [
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "thresholds",
    outputs: [
      { internalType: "uint256", name: "btcMarketCap", type: "uint256" },
      { internalType: "uint256", name: "competitorCap", type: "uint256" },
      { internalType: "bool", name: "isActive", type: "bool" },
    ],
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
  {
    inputs: [{ internalType: "uint256", name: "index", type: "uint256" }],
    name: "competitors",
    outputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "address", name: "priceFeed", type: "address" },
      { internalType: "uint256", name: "circulatingSupply", type: "uint256" },
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "uint256", name: "lastUpdatedTime", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "btcPriceFeed",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

async function checkOracleConfig() {
  console.log("🔍 检查 BTCOracle 合约配置...\n");

  const publicClient = createPublicClient({
    chain: moonbaseAlpha,
    transport: http(),
  });

  try {
    // Test network connection
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`✅ 连接到 Moonbase Alpha. 当前区块: ${blockNumber}\n`);

    // 1. 检查阈值配置
    console.log("1️⃣ 检查阈值配置...");
    const threshold = await publicClient.readContract({
      address: BTC_ORACLE_ADDRESS,
      abi: btcOracleAbi,
      functionName: "thresholds",
      args: [1n], // 投票期ID 1
    });

    console.log(`   投票期 1 阈值配置:`);
    console.log(`   btcMarketCap: ${threshold[0].toString()}`);
    console.log(`   competitorCap: ${threshold[1].toString()}`);
    console.log(`   isActive: ${threshold[2]}`);

    if (!threshold[2]) {
      console.log("❌ 问题发现：投票期 1 的阈值未激活！");
      console.log("   这就是 takeMarketSnapshot 失败的原因");
    }

    // 2. 检查竞争链配置
    console.log("\n2️⃣ 检查竞争链配置...");
    const competitorCount = await publicClient.readContract({
      address: BTC_ORACLE_ADDRESS,
      abi: btcOracleAbi,
      functionName: "competitorCount",
    });

    console.log(`   竞争链数量: ${competitorCount}`);

    if (Number(competitorCount) > 0) {
      for (let i = 0; i < Number(competitorCount); i++) {
        const competitor = await publicClient.readContract({
          address: BTC_ORACLE_ADDRESS,
          abi: btcOracleAbi,
          functionName: "competitors",
          args: [BigInt(i)],
        });

        console.log(`   竞争链 ${i}:`);
        console.log(`     名称: ${competitor[0]}`);
        console.log(`     价格源: ${competitor[1]}`);
        console.log(`     流通供应量: ${competitor[2].toString()}`);
        console.log(`     激活状态: ${competitor[3]}`);
        console.log(`     最后更新时间: ${competitor[4].toString()}`);
      }
    } else {
      console.log("   ⚠️  没有配置竞争链");
    }

    // 3. 检查 BTC 价格源配置
    console.log("\n3️⃣ 检查 BTC 价格源配置...");
    const btcPriceFeed = await publicClient.readContract({
      address: BTC_ORACLE_ADDRESS,
      abi: btcOracleAbi,
      functionName: "btcPriceFeed",
    });

    console.log(`   BTC 价格源地址: ${btcPriceFeed}`);

    // 4. 诊断结果
    console.log("\n4️⃣ 诊断结果:");
    if (!threshold[2]) {
      console.log("❌ 主要问题：投票期阈值未激活");
      console.log(
        "   解决方案：需要调用 setThreshold() 函数激活投票期 1 的阈值",
      );
    }

    if (Number(competitorCount) === 0) {
      console.log("❌ 次要问题：没有配置竞争链");
      console.log("   解决方案：需要调用 addCompetitor() 函数添加竞争链");
    }

    if (btcPriceFeed === "0x0000000000000000000000000000000000000000") {
      console.log("❌ 次要问题：BTC 价格源未配置");
      console.log(
        "   解决方案：需要调用 setBTCPriceFeed() 函数设置 BTC 价格源",
      );
    }

    if (
      threshold[2] &&
      Number(competitorCount) > 0 &&
      btcPriceFeed !== "0x0000000000000000000000000000000000000000"
    ) {
      console.log("✅ 配置看起来正常，问题可能在其他地方");
    }
  } catch (error) {
    console.error("❌ 检查配置时出错:", error);
  }
}

// Run the check
checkOracleConfig().catch(console.error);
