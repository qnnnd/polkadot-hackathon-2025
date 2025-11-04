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

// 测试账户
const TEST_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// VotingContract ABI (完整版)
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

// VotingTicket ABI (简化版)
const VOTING_TICKET_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

async function debugFrontendVotingHistory() {
  console.log("🔍 调试前端投票历史问题...\n");

  try {
    // 创建客户端
    const publicClient = createPublicClient({
      chain: hardhat,
      transport: http("http://localhost:8545"),
    });

    const account = privateKeyToAccount(TEST_PRIVATE_KEY);

    console.log(`👤 测试账户: ${account.address}`);

    // 1. 检查网络连接
    console.log("\n1️⃣ 检查网络连接:");
    try {
      const blockNumber = await publicClient.getBlockNumber();
      console.log(`✅ 网络连接正常，当前区块: ${blockNumber}`);
    } catch (error) {
      console.log(`❌ 网络连接失败: ${error.message}`);
      return;
    }

    // 2. 检查投票券余额
    console.log("\n2️⃣ 检查投票券余额:");
    const ticketBalance = await publicClient.readContract({
      address: VOTING_TICKET_ADDRESS,
      abi: VOTING_TICKET_ABI,
      functionName: "balanceOf",
      args: [account.address],
    });
    console.log(`✅ 投票券余额: ${formatEther(ticketBalance)} 张`);

    // 3. 检查投票数量
    console.log("\n3️⃣ 检查投票数量:");
    const voteCount = await publicClient.readContract({
      address: VOTING_CONTRACT_ADDRESS,
      abi: VOTING_CONTRACT_ABI,
      functionName: "getUserVoteCount",
      args: [account.address],
    });
    console.log(`✅ 用户投票数量: ${voteCount.toString()}`);

    if (Number(voteCount) === 0) {
      console.log("❌ 用户没有投票记录");
      return;
    }

    // 4. 模拟前端逻辑 - 获取投票历史
    console.log("\n4️⃣ 模拟前端获取投票历史:");
    const history = [];

    for (let i = 0; i < Number(voteCount); i++) {
      try {
        console.log(`  获取投票记录 ${i + 1}...`);

        const vote = await publicClient.readContract({
          address: VOTING_CONTRACT_ADDRESS,
          abi: VOTING_CONTRACT_ABI,
          functionName: "getUserVote",
          args: [account.address, BigInt(i)],
        });

        console.log(`  投票数据:`, vote);

        // Get voting period info
        const period = await publicClient.readContract({
          address: VOTING_CONTRACT_ADDRESS,
          abi: VOTING_CONTRACT_ABI,
          functionName: "votingPeriods",
          args: [vote[2]], // votingPeriodId
        });

        console.log(`  投票期数据:`, period);

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

        console.log(`  格式化后的投票数据:`, voteData);
        history.push(voteData);
      } catch (error) {
        console.error(`❌ 获取投票 ${i} 失败:`, error.message);
      }
    }

    // Sort by timestamp (newest first)
    const sortedHistory = history.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    console.log(`\n✅ 成功获取 ${sortedHistory.length} 条投票记录`);

    // 5. 检查前端可能的问题
    console.log("\n5️⃣ 前端问题排查:");
    console.log("如果UI显示'暂无投票记录'，可能的原因:");
    console.log("1. 钱包未连接 - 检查浏览器钱包连接状态");
    console.log("2. 网络不匹配 - 确保连接到 Hardhat (Chain ID: 31337)");
    console.log("3. 账户地址不匹配 - 确保使用正确的测试账户");
    console.log("4. 合约地址错误 - 检查合约地址配置");
    console.log("5. ABI不匹配 - 检查ABI文件是否正确");

    console.log("\n🔧 调试步骤:");
    console.log("1. 打开浏览器开发者工具 (F12)");
    console.log("2. 查看 Console 标签页的调试日志");
    console.log("3. 查看 Network 标签页的网络请求");
    console.log("4. 确认钱包连接状态");
    console.log("5. 确认网络连接状态");

    console.log("\n📊 当前测试账户信息:");
    console.log(`   地址: ${account.address}`);
    console.log(`   投票券余额: ${formatEther(ticketBalance)} 张`);
    console.log(`   投票记录数: ${voteCount.toString()}`);
    console.log(`   合约地址: ${VOTING_CONTRACT_ADDRESS}`);
  } catch (error) {
    console.error("❌ 调试失败:", error.message);
  }
}

debugFrontendVotingHistory()
  .then(() => {
    console.log("\n✅ 调试完成!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 脚本执行错误:", error);
    process.exit(1);
  });
