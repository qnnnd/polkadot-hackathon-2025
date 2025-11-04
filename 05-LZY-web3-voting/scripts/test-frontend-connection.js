#!/usr/bin/env node

import { createPublicClient, http } from "viem";
import { hardhat } from "viem/chains";

// 合约地址
const VOTING_CONTRACT_ADDRESS = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d";

// 测试地址 - 这些是常见的测试地址
const TEST_ADDRESSES = [
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Hardhat账户1
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat账户2
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Hardhat账户3
];

// VotingContract ABI (简化版)
const VOTING_CONTRACT_ABI = [
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserVoteCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

async function testFrontendConnection() {
  console.log("🧪 测试前端连接和投票数据...\n");

  try {
    // 创建客户端
    const publicClient = createPublicClient({
      chain: hardhat,
      transport: http("http://localhost:8545"),
    });

    console.log("🌐 连接到本地Hardhat网络...");

    // 检查每个测试地址的投票数量
    for (const address of TEST_ADDRESSES) {
      try {
        const voteCount = await publicClient.readContract({
          address: VOTING_CONTRACT_ADDRESS,
          abi: VOTING_CONTRACT_ABI,
          functionName: "getUserVoteCount",
          args: [address],
        });

        console.log(`👤 ${address}: ${voteCount.toString()} 票`);
      } catch (error) {
        console.log(`❌ ${address}: 错误 - ${error.message}`);
      }
    }

    console.log("\n💡 前端连接检查:");
    console.log("1. 确保前端连接到 localhost:8545");
    console.log("2. 确保钱包连接到 Hardhat 网络 (Chain ID: 31337)");
    console.log("3. 确保使用正确的测试账户地址");
    console.log("4. 检查浏览器控制台的调试日志");

    console.log("\n🔧 如果UI显示'暂无投票记录':");
    console.log("- 检查钱包是否已连接");
    console.log("- 检查网络是否匹配 (Hardhat)");
    console.log("- 检查账户地址是否在上述测试地址中");
    console.log("- 查看浏览器控制台的调试信息");
  } catch (error) {
    console.error("❌ 测试失败:", error.message);
  }
}

testFrontendConnection()
  .then(() => {
    console.log("\n✅ 测试完成!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 脚本执行错误:", error);
    process.exit(1);
  });
