#!/usr/bin/env node

import { createPublicClient, http, formatEther } from "viem";
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
      {
        components: [
          { internalType: "uint256", name: "predictedYear", type: "uint256" },
          { internalType: "uint256", name: "ticketsUsed", type: "uint256" },
          { internalType: "uint256", name: "votingPeriodId", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bool", name: "claimed", type: "bool" },
        ],
        internalType: "struct VotingContract.UserVote",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "votingPeriods",
    outputs: [
      { internalType: "uint256", name: "startTime", type: "uint256" },
      { internalType: "uint256", name: "endTime", type: "uint256" },
      { internalType: "bool", name: "active", type: "bool" },
      { internalType: "bool", name: "resolved", type: "bool" },
      { internalType: "uint256", name: "correctAnswerYear", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

async function testStructVotingHistory() {
  console.log("🧪 测试结构体投票历史...\n");

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

    // 模拟前端逻辑 - 获取投票历史（使用结构体格式）
    console.log("\n📝 模拟前端获取投票历史:");
    const history = [];

    for (let i = 0; i < Number(voteCount); i++) {
      try {
        console.log(`  获取投票记录 ${i + 1}...`);

        const vote = await publicClient.readContract({
          address: VOTING_CONTRACT_ADDRESS,
          abi: VOTING_CONTRACT_ABI,
          functionName: "getUserVote",
          args: [TEST_ADDRESS, BigInt(i)],
        });

        console.log(`  投票数据 (结构体):`, vote);
        console.log(`  投票数据类型:`, typeof vote);
        console.log(`  投票数据键:`, Object.keys(vote));

        // Check if vote data is valid (结构体格式)
        if (!vote || typeof vote !== "object" || !vote.predictedYear) {
          console.error(`❌ 投票数据无效 (索引 ${i}):`, vote);
          continue;
        }

        const votingPeriodId = vote.votingPeriodId;
        if (!votingPeriodId) {
          console.error(`❌ 没有投票期ID (索引 ${i}):`, vote);
          continue;
        }

        console.log(`  投票期ID: ${votingPeriodId}`);

        // Get voting period info
        const period = await publicClient.readContract({
          address: VOTING_CONTRACT_ADDRESS,
          abi: VOTING_CONTRACT_ABI,
          functionName: "votingPeriods",
          args: [votingPeriodId],
        });

        console.log(`  投票期数据:`, period);

        // Check if period data is valid
        if (!period || period.length < 5) {
          console.error(
            `❌ 投票期数据无效 (投票期ID ${votingPeriodId}):`,
            period,
          );
          continue;
        }

        // Format the vote data (使用结构体字段访问)
        const voteData = {
          index: i,
          predictedYear: Number(vote.predictedYear), // 使用结构体字段
          ticketsUsed: formatEther(vote.ticketsUsed), // 使用结构体字段
          votingPeriodId: Number(vote.votingPeriodId), // 使用结构体字段
          timestamp: new Date(Number(vote.timestamp) * 1000), // 使用结构体字段
          claimed: vote.claimed, // 使用结构体字段
          periodStartTime: new Date(Number(period[0]) * 1000),
          periodEndTime: new Date(Number(period[1]) * 1000),
          periodActive: period[2],
          periodResolved: period[3],
          correctAnswerYear: Number(period[4]),
        };

        console.log(`  ✅ 成功格式化投票数据:`, voteData);
        history.push(voteData);
      } catch (error) {
        console.error(`❌ 获取投票 ${i} 失败:`, error.message);
      }
    }

    console.log(`\n✅ 成功获取 ${history.length} 条投票记录`);

    if (history.length > 0) {
      console.log("\n📊 投票历史摘要:");
      history.forEach((item, index) => {
        const formatYearRange = (year) => {
          if (year === 0) {
            return "永不会";
          }
          const rangeStart = year % 2 === 0 ? year - 1 : year;
          const rangeEnd = rangeStart + 2;
          return `${rangeStart}-${rangeEnd}年`;
        };

        console.log(
          `  ${index + 1}. ${formatYearRange(item.predictedYear)} - ${item.ticketsUsed} 张投票券`,
        );
      });
    }

    console.log("\n🎉 结构体投票历史测试完成!");
    console.log("✅ 使用结构体字段访问，数据可以正常获取和格式化");
  } catch (error) {
    console.error("❌ 测试失败:", error.message);
  }
}

testStructVotingHistory()
  .then(() => {
    console.log("\n✅ 测试完成!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 脚本执行错误:", error);
    process.exit(1);
  });
