#!/usr/bin/env node

import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
} from "viem";
import { hardhat } from "viem/chains";

// 合约地址
const VOTING_CONTRACT_ADDRESS = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d";
const VOTING_TICKET_ADDRESS = "0x68B1D87F95878fE05B998F19b66F4baba5De1aed";

// VotingContract ABI (简化版，只包含需要的函数)
const VOTING_CONTRACT_ABI = [
  {
    inputs: [],
    name: "currentVotingPeriodId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
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

// VotingTicket ABI (简化版)
const VOTING_TICKET_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

async function debugVotingIssue() {
  console.log("🔍 开始排查投票问题...\n");

  try {
    // 创建客户端
    const publicClient = createPublicClient({
      chain: hardhat,
      transport: http("http://localhost:8545"),
    });

    console.log("📋 合约地址:");
    console.log(`  VotingContract: ${VOTING_CONTRACT_ADDRESS}`);
    console.log(`  VotingTicket: ${VOTING_TICKET_ADDRESS}\n`);

    // 检查网络连接
    try {
      const blockNumber = await publicClient.getBlockNumber();
      console.log(`🌐 网络连接正常，当前区块: ${blockNumber}\n`);
    } catch (error) {
      console.log("❌ 无法连接到本地网络，请确保Hardhat节点正在运行");
      console.log("   启动命令: npx hardhat node\n");
      return;
    }

    // 获取当前投票期ID
    const currentPeriodId = await publicClient.readContract({
      address: VOTING_CONTRACT_ADDRESS,
      abi: VOTING_CONTRACT_ABI,
      functionName: "currentVotingPeriodId",
    });

    console.log(`📅 当前投票期ID: ${currentPeriodId.toString()}`);

    // 获取投票期详细信息
    let votingPeriod;
    try {
      votingPeriod = await publicClient.readContract({
        address: VOTING_CONTRACT_ADDRESS,
        abi: VOTING_CONTRACT_ABI,
        functionName: "votingPeriods",
        args: [currentPeriodId],
      });
    } catch (error) {
      console.log("❌ 无法读取投票期信息:", error.message);
      return;
    }

    const currentTime = Math.floor(Date.now() / 1000);

    console.log("\n📊 投票期详细信息:");
    console.log(
      `  开始时间: ${votingPeriod[0].toString()} (${new Date(Number(votingPeriod[0]) * 1000).toLocaleString()})`,
    );
    console.log(
      `  结束时间: ${votingPeriod[1].toString()} (${new Date(Number(votingPeriod[1]) * 1000).toLocaleString()})`,
    );
    console.log(
      `  当前时间: ${currentTime} (${new Date(currentTime * 1000).toLocaleString()})`,
    );
    console.log(`  是否激活: ${votingPeriod[2]}`);
    console.log(`  是否已解决: ${votingPeriod[3]}`);
    console.log(`  正确答案年份: ${votingPeriod[4].toString()}`);

    // 计算状态
    const isStarted = currentTime >= Number(votingPeriod[0]);
    const isEnded = currentTime > Number(votingPeriod[1]);
    const isActive =
      votingPeriod[2] && isStarted && !isEnded && !votingPeriod[3];

    console.log("\n🔍 状态分析:");
    console.log(`  投票期已开始: ${isStarted ? "✅" : "❌"}`);
    console.log(`  投票期已结束: ${isEnded ? "❌" : "✅"}`);
    console.log(`  投票期激活: ${votingPeriod[2] ? "✅" : "❌"}`);
    console.log(`  投票期未解决: ${!votingPeriod[3] ? "✅" : "❌"}`);
    console.log(`  总体状态: ${isActive ? "✅ 可以投票" : "❌ 无法投票"}`);

    if (!isActive) {
      console.log("\n⚠️  问题诊断:");
      if (!votingPeriod[2]) console.log("  - 投票期未激活，需要管理员激活");
      if (!isStarted) console.log("  - 投票期未开始，等待开始时间");
      if (isEnded) console.log("  - 投票期已结束，需要创建新的投票期");
      if (votingPeriod[3]) console.log("  - 投票期已解决，需要创建新的投票期");
    }

    // 计算剩余时间
    const timeRemaining = Number(votingPeriod[1]) - currentTime;
    if (timeRemaining > 0) {
      const days = Math.floor(timeRemaining / 86400);
      const hours = Math.floor((timeRemaining % 86400) / 3600);
      console.log(`\n⏰ 剩余时间: ${days}天 ${hours}小时`);
    } else {
      const overdue = Math.abs(timeRemaining);
      const days = Math.floor(overdue / 86400);
      const hours = Math.floor((overdue % 86400) / 3600);
      console.log(`\n⏰ 已过期: ${days}天 ${hours}小时`);
    }

    // 检查测试账户的投票券余额
    const testAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Hardhat第一个账户
    console.log(`\n👤 检查测试账户: ${testAddress}`);

    const balance = await publicClient.readContract({
      address: VOTING_TICKET_ADDRESS,
      abi: VOTING_TICKET_ABI,
      functionName: "balanceOf",
      args: [testAddress],
    });

    const allowance = await publicClient.readContract({
      address: VOTING_TICKET_ADDRESS,
      abi: VOTING_TICKET_ABI,
      functionName: "allowance",
      args: [testAddress, VOTING_CONTRACT_ADDRESS],
    });

    console.log(`  投票券余额: ${formatEther(balance)} 张`);
    console.log(`  授权额度: ${formatEther(allowance)} 张`);

    // 检查用户的投票记录
    const voteCount = await publicClient.readContract({
      address: VOTING_CONTRACT_ADDRESS,
      abi: VOTING_CONTRACT_ABI,
      functionName: "getUserVoteCount",
      args: [testAddress],
    });

    console.log(`  投票记录数: ${voteCount.toString()}`);

    if (voteCount > 0) {
      console.log("\n📝 投票记录:");
      for (let i = 0; i < Number(voteCount); i++) {
        const vote = await publicClient.readContract({
          address: VOTING_CONTRACT_ADDRESS,
          abi: VOTING_CONTRACT_ABI,
          functionName: "getUserVote",
          args: [testAddress, BigInt(i)],
        });

        console.log(`  投票 ${i + 1}:`);
        console.log(`    预测年份: ${vote.predictedYear.toString()}`);
        console.log(`    使用投票券: ${formatEther(vote.ticketsUsed)} 张`);
        console.log(
          `    投票时间: ${new Date(Number(vote.timestamp) * 1000).toLocaleString()}`,
        );
        console.log(`    已领取奖励: ${vote.claimed}`);
      }
    }

    console.log("\n🎉 调试完成!");
  } catch (error) {
    console.error("❌ 调试失败:", error.message);
  }
}

debugVotingIssue()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 脚本执行错误:", error);
    process.exit(1);
  });
