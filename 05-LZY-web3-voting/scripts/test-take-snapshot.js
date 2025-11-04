import {
  createPublicClient,
  http,
  createWalletClient,
  formatEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Moonbase Alpha configuration
const moonbaseAlpha = {
  id: 1287,
  name: "Moonbase Alpha",
  rpcUrls: {
    default: {
      http: ["https://rpc.api.moonbase.moonbeam.network"],
    },
  },
  nativeCurrency: {
    decimals: 18,
    name: "DEV",
    symbol: "DEV",
  },
};

// Contract addresses
const BTC_ORACLE_ADDRESS = "0x0072c64A3974497c946291A70827e09E7BC2aEbF";

// BTCOracle ABI
const btcOracleAbi = [
  {
    inputs: [
      { internalType: "uint256", name: "votingPeriodId", type: "uint256" },
    ],
    name: "takeMarketSnapshot",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
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
];

async function testTakeSnapshot() {
  console.log("🧪 测试 takeMarketSnapshot 函数调用...\n");

  // 注意：这里需要一个有效的私钥来测试
  // 在实际环境中，用户会通过 MetaMask 签名交易
  console.log("⚠️  注意：这个测试需要有效的私钥和足够的 DEV 代币");
  console.log("   在实际使用中，用户通过 MetaMask 签名交易\n");

  const publicClient = createPublicClient({
    chain: moonbaseAlpha,
    transport: http(),
  });

  try {
    // 1. 检查当前状态
    console.log("1️⃣ 检查当前状态...");

    const snapshotCountBefore = await publicClient.readContract({
      address: BTC_ORACLE_ADDRESS,
      abi: btcOracleAbi,
      functionName: "getSnapshotCount",
      args: [1n],
    });

    const canTakeSnapshot = await publicClient.readContract({
      address: BTC_ORACLE_ADDRESS,
      abi: btcOracleAbi,
      functionName: "canTakeSnapshot",
      args: [1n],
    });

    console.log(`   快照次数（调用前）: ${snapshotCountBefore}`);
    console.log(`   是否可以快照: ${canTakeSnapshot}`);

    if (!canTakeSnapshot) {
      console.log("❌ 当前不能拍摄快照，可能的原因:");
      console.log("   1. 投票期未激活");
      console.log("   2. 投票期已结束");
      console.log("   3. 竞争链数据未配置");
      console.log("   4. 其他合约限制");
      return;
    }

    // 2. 模拟交易（不实际执行，只检查交易构建）
    console.log("\n2️⃣ 检查交易构建...");

    try {
      const { request } = await publicClient.simulateContract({
        address: BTC_ORACLE_ADDRESS,
        abi: btcOracleAbi,
        functionName: "takeMarketSnapshot",
        args: [1n],
        account: "0x5ca3207BA9182A4Afda578f31564DaC377863447", // 使用合约拥有者地址
      });

      console.log(`   交易请求构建成功`);
      console.log(`   预估 Gas: ${request.gas?.toString() || "未知"}`);
    } catch (simulationError) {
      console.log("❌ 交易模拟失败:");
      console.log(`   错误: ${simulationError.message}`);

      if (simulationError.message.includes("revert")) {
        console.log("\n💡 可能的解决方案:");
        console.log("   1. 检查 BTCOracle 合约的竞争链配置");
        console.log("   2. 确保 Chainlink 价格源正常工作");
        console.log("   3. 检查合约的权限设置");
      }
    }

    console.log("\n3️⃣ 建议的调试步骤:");
    console.log("   1. 在前端点击'查询BTC价格'按钮");
    console.log("   2. 检查浏览器控制台的错误信息");
    console.log("   3. 检查 MetaMask 的交易状态");
    console.log("   4. 确认交易是否被确认（不是仅仅提交）");
  } catch (error) {
    console.error("❌ 测试过程中出错:", error);
  }
}

// Run the test
testTakeSnapshot().catch(console.error);
