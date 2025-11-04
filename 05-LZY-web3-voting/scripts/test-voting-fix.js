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
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// VotingContract ABI (简化版)
const VOTING_CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "predictedYear", type: "uint256" },
      { internalType: "uint256", name: "ticketsToUse", type: "uint256" },
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserVoteCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

async function testVotingFix() {
  console.log("🧪 测试投票修复...\n");

  try {
    // 创建客户端
    const publicClient = createPublicClient({
      chain: hardhat,
      transport: http("http://localhost:8545"),
    });

    const account = privateKeyToAccount(TEST_PRIVATE_KEY);
    const walletClient = createWalletClient({
      account,
      chain: hardhat,
      transport: http("http://localhost:8545"),
    });

    console.log(`👤 测试账户: ${account.address}`);

    // 检查初始余额
    const initialBalance = await publicClient.readContract({
      address: VOTING_TICKET_ADDRESS,
      abi: VOTING_TICKET_ABI,
      functionName: "balanceOf",
      args: [account.address],
    });

    console.log(`📊 初始投票券余额: ${formatEther(initialBalance)} 张`);

    // 检查授权额度
    const initialAllowance = await publicClient.readContract({
      address: VOTING_TICKET_ADDRESS,
      abi: VOTING_TICKET_ABI,
      functionName: "allowance",
      args: [account.address, VOTING_CONTRACT_ADDRESS],
    });

    console.log(`📊 初始授权额度: ${formatEther(initialAllowance)} 张`);

    // 检查初始投票记录数
    const initialVoteCount = await publicClient.readContract({
      address: VOTING_CONTRACT_ADDRESS,
      abi: VOTING_CONTRACT_ABI,
      functionName: "getUserVoteCount",
      args: [account.address],
    });

    console.log(`📊 初始投票记录数: ${initialVoteCount.toString()}\n`);

    // 如果授权不足，先授权
    const ticketsToUse = parseEther("1"); // 使用1张投票券
    if (initialAllowance < ticketsToUse) {
      console.log("🔐 授权投票券...");
      const approveTx = await walletClient.writeContract({
        address: VOTING_TICKET_ADDRESS,
        abi: VOTING_TICKET_ABI,
        functionName: "approve",
        args: [VOTING_CONTRACT_ADDRESS, ticketsToUse],
      });
      console.log(`   交易哈希: ${approveTx}`);

      // 等待授权确认
      const approveReceipt = await publicClient.waitForTransactionReceipt({
        hash: approveTx,
      });
      console.log(
        `✅ 授权确认成功! Gas使用: ${approveReceipt.gasUsed.toString()}\n`,
      );
    }

    // 执行投票
    console.log("🗳️  执行投票...");
    const voteTx = await walletClient.writeContract({
      address: VOTING_CONTRACT_ADDRESS,
      abi: VOTING_CONTRACT_ABI,
      functionName: "vote",
      args: [BigInt(2027), ticketsToUse], // 预测2027年，使用1张投票券
    });
    console.log(`   交易哈希: ${voteTx}`);

    // 等待投票确认
    const voteReceipt = await publicClient.waitForTransactionReceipt({
      hash: voteTx,
    });
    console.log(
      `✅ 投票确认成功! Gas使用: ${voteReceipt.gasUsed.toString()}\n`,
    );

    // 检查投票后的状态
    const finalBalance = await publicClient.readContract({
      address: VOTING_TICKET_ADDRESS,
      abi: VOTING_TICKET_ABI,
      functionName: "balanceOf",
      args: [account.address],
    });

    const finalVoteCount = await publicClient.readContract({
      address: VOTING_CONTRACT_ADDRESS,
      abi: VOTING_CONTRACT_ABI,
      functionName: "getUserVoteCount",
      args: [account.address],
    });

    console.log("📊 投票后状态:");
    console.log(`   投票券余额: ${formatEther(finalBalance)} 张`);
    console.log(`   投票记录数: ${finalVoteCount.toString()}`);

    // 验证结果
    const balanceDecreased = initialBalance > finalBalance;
    const voteCountIncreased =
      Number(finalVoteCount) > Number(initialVoteCount);

    console.log("\n🔍 验证结果:");
    console.log(`   投票券余额减少: ${balanceDecreased ? "✅" : "❌"}`);
    console.log(`   投票记录增加: ${voteCountIncreased ? "✅" : "❌"}`);

    if (balanceDecreased && voteCountIncreased) {
      console.log("\n🎉 投票修复成功！投票券被正确消耗，投票记录已创建。");
    } else {
      console.log("\n❌ 投票修复失败！请检查智能合约和前端代码。");
    }
  } catch (error) {
    console.error("❌ 测试失败:", error.message);
  }
}

testVotingFix()
  .then(() => {
    console.log("\n✅ 测试完成!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 脚本执行错误:", error);
    process.exit(1);
  });
