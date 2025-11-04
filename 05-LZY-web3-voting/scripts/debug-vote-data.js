#!/usr/bin/env node

import { createPublicClient, http } from "viem";
import { hardhat } from "viem/chains";

// 合约地址
const VOTING_CONTRACT_ADDRESS = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d";
const TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// VotingContract ABI (简化版)
const VOTING_CONTRACT_ABI = [
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserVoteCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "index", type: "uint256" },
    ],
    name: "getUserVote",
    outputs: [
      { internalType: "uint256", name: "predictedYear", type: "uint256" },
      { internalType: "uint256", name: "ticketsUsed", type: "uint256" },
      { internalType: "uint256", name: "votingPeriodId", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "claimed", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

async function debugVoteData() {
  console.log("🔍 调试投票数据...\n");

  try {
    // 创建客户端
    const publicClient = createPublicClient({
      chain: hardhat,
      transport: http("http://localhost:8545"),
    });

    console.log(`👤 测试账户: ${TEST_ADDRESS}`);

    // 获取用户投票数量
    const voteCount = await publicClient.readContract({
      address: VOTING_CONTRACT_ADDRESS,
      abi: VOTING_CONTRACT_ABI,
      functionName: "getUserVoteCount",
      args: [TEST_ADDRESS],
    });

    console.log(`📊 用户投票数量: ${voteCount.toString()}`);

    if (Number(voteCount) === 0) {
      console.log("❌ 用户没有投票记录");
      return;
    }

    // 获取第一个投票记录
    console.log("\n📝 获取第一个投票记录:");
    const vote = await publicClient.readContract({
      address: VOTING_CONTRACT_ADDRESS,
      abi: VOTING_CONTRACT_ABI,
      functionName: "getUserVote",
      args: [TEST_ADDRESS, 0n],
    });

    console.log("Raw vote data:");
    console.log(
      JSON.stringify(
        vote,
        (key, value) => {
          if (typeof value === "bigint") {
            return value.toString();
          }
          return value;
        },
        2,
      ),
    );

    console.log("\n🎉 调试完成!");
  } catch (error) {
    console.error("❌ 调试失败:", error.message);
    console.error("Stack:", error.stack);
  }
}

debugVoteData()
  .then(() => {
    console.log("\n✅ 脚本执行完成!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 脚本执行错误:", error);
    process.exit(1);
  });
