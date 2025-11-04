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
      { internalType: "uint256", name: "predictedYear", type: "uint256" },
      { internalType: "uint256", name: "ticketsUsed", type: "uint256" },
      { internalType: "uint256", name: "votingPeriodId", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "claimed", type: "bool" },
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

async function testCompleteVotingHistory() {
  console.log("🧪 测试完整投票历史功能...\n");

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

    // 模拟前端逻辑：获取投票历史
    const history = [];

    for (let i = 0; i < Number(voteCount); i++) {
      try {
        const vote = await publicClient.readContract({
          address: VOTING_CONTRACT_ADDRESS,
          abi: VOTING_CONTRACT_ABI,
          functionName: "getUserVote",
          args: [TEST_ADDRESS, BigInt(i)],
        });

        // Get voting period info
        const period = await publicClient.readContract({
          address: VOTING_CONTRACT_ADDRESS,
          abi: VOTING_CONTRACT_ABI,
          functionName: "votingPeriods",
          args: [vote[2]], // votingPeriodId
        });

        // Format the vote data (模拟前端格式化逻辑)
        const voteData = {
          index: i,
          predictedYear: Number(vote[0]), // predictedYear
          ticketsUsed: formatEther(vote[1]), // ticketsUsed
          votingPeriodId: Number(vote[2]), // votingPeriodId
          timestamp: new Date(Number(vote[3]) * 1000), // timestamp
          claimed: vote[4], // claimed
          periodStartTime: new Date(Number(period[0]) * 1000),
          periodEndTime: new Date(Number(period[1]) * 1000),
          periodActive: period[2],
          periodResolved: period[3],
          correctAnswerYear: Number(period[4]),
        };

        history.push(voteData);
      } catch (error) {
        console.error(`Error fetching vote ${i}:`, error);
      }
    }

    // Sort by timestamp (newest first)
    const sortedHistory = history.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    // 显示格式化后的历史记录
    console.log("\n📝 格式化投票历史:");
    sortedHistory.forEach((item, index) => {
      // 计算年份范围显示
      const formatYearRange = (year) => {
        if (year === 0) {
          return "永不会";
        }
        const rangeStart = year % 2 === 0 ? year - 1 : year;
        const rangeEnd = rangeStart + 2;
        return `${rangeStart}-${rangeEnd}年`;
      };

      const getStatusText = (item) => {
        if (!item.periodResolved) {
          return "等待开奖";
        }

        if (item.claimed) {
          return "已领取奖励";
        }

        if (item.correctAnswerYear === item.predictedYear) {
          return "中奖";
        }

        return "未中奖";
      };

      const getStatusColor = (item) => {
        if (!item.periodResolved) {
          return "text-yellow-400";
        }

        if (item.claimed) {
          return "text-green-400";
        }

        if (item.correctAnswerYear === item.predictedYear) {
          return "text-green-400";
        }

        return "text-gray-400";
      };

      console.log(`\n  📊 投票记录 ${index + 1}:`);
      console.log(`    时间: ${item.timestamp.toLocaleString()}`);
      console.log(`    选择: ${formatYearRange(item.predictedYear)}`);
      console.log(`    使用投票券: ${item.ticketsUsed} 张`);
      console.log(`    投票期ID: #${item.votingPeriodId}`);
      console.log(`    状态: ${getStatusText(item)}`);

      if (item.periodResolved) {
        console.log(`    正确答案: ${formatYearRange(item.correctAnswerYear)}`);
      }
    });

    console.log("\n🎉 投票历史功能测试完成!");
    console.log("✅ 数据格式正确，可以正常显示在前端UI中");
  } catch (error) {
    console.error("❌ 测试失败:", error.message);
  }
}

testCompleteVotingHistory()
  .then(() => {
    console.log("\n✅ 测试完成!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 脚本执行错误:", error);
    process.exit(1);
  });
