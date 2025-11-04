#!/usr/bin/env node

import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";

// 合约地址
const VOTING_CONTRACT_ADDRESS = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d";
const VOTING_TICKET_ADDRESS = "0x68B1D87F95878fE05B998F19b66F4baba5De1aed";

// 测试账户私钥 (Hardhat第一个账户)
const TEST_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

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

async function testVotingHistory() {
  console.log("🧪 测试投票历史功能...\n");

  try {
    // 创建客户端
    const publicClient = createPublicClient({
      chain: hardhat,
      transport: http("http://localhost:8545"),
    });

    const account = privateKeyToAccount(TEST_PRIVATE_KEY);

    console.log(`👤 测试账户: ${account.address}`);

    // 获取用户投票数量
    const voteCount = await publicClient.readContract({
      address: VOTING_CONTRACT_ADDRESS,
      abi: VOTING_CONTRACT_ABI,
      functionName: "getUserVoteCount",
      args: [account.address],
    });

    console.log(`📊 用户投票数量: ${voteCount.toString()}`);

    if (Number(voteCount) === 0) {
      console.log("❌ 用户没有投票记录");
      return;
    }

    // 获取投票历史
    console.log("\n📝 投票历史:");
    for (let i = 0; i < Number(voteCount); i++) {
      const vote = await publicClient.readContract({
        address: VOTING_CONTRACT_ADDRESS,
        abi: VOTING_CONTRACT_ABI,
        functionName: "getUserVote",
        args: [account.address, BigInt(i)],
      });

      // 获取投票期信息
      const period = await publicClient.readContract({
        address: VOTING_CONTRACT_ADDRESS,
        abi: VOTING_CONTRACT_ABI,
        functionName: "votingPeriods",
        args: [vote.votingPeriodId],
      });

      console.log(`    Raw vote data:`, vote);
      console.log(`    Raw period data:`, period);

      console.log(`\n  投票 ${i + 1}:`);
      console.log(`    预测年份: ${vote.predictedYear.toString()}`);
      console.log(`    使用投票券: ${formatEther(vote.ticketsUsed)} 张`);
      console.log(
        `    投票时间: ${new Date(Number(vote.timestamp) * 1000).toLocaleString()}`,
      );
      console.log(`    投票期ID: ${vote.votingPeriodId.toString()}`);
      console.log(`    已领取奖励: ${vote.claimed}`);

      console.log(`    投票期信息:`);
      console.log(
        `      开始时间: ${new Date(Number(period[0]) * 1000).toLocaleString()}`,
      );
      console.log(
        `      结束时间: ${new Date(Number(period[1]) * 1000).toLocaleString()}`,
      );
      console.log(`      是否激活: ${period[2]}`);
      console.log(`      是否已解决: ${period[3]}`);
      console.log(`      正确答案年份: ${period[4].toString()}`);

      // 计算年份范围显示
      const formatYearRange = (year) => {
        if (year === 0n) {
          return "永不会";
        }
        const yearNum = Number(year);
        const rangeStart = yearNum % 2 === 0 ? yearNum - 1 : yearNum;
        const rangeEnd = rangeStart + 2;
        return `${rangeStart}-${rangeEnd}年`;
      };

      console.log(`    显示格式:`);
      console.log(`      预测: ${formatYearRange(vote.predictedYear)}`);
      console.log(`      正确答案: ${formatYearRange(period[4])}`);

      // 计算状态
      let status = "等待开奖";
      if (period[3]) {
        // resolved
        if (vote.claimed) {
          status = "已领取奖励";
        } else if (period[4] === vote.predictedYear) {
          status = "中奖";
        } else {
          status = "未中奖";
        }
      }
      console.log(`      状态: ${status}`);
    }

    console.log("\n🎉 投票历史测试完成!");
  } catch (error) {
    console.error("❌ 测试失败:", error.message);
  }
}

testVotingHistory()
  .then(() => {
    console.log("\n✅ 测试完成!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 脚本执行错误:", error);
    process.exit(1);
  });
