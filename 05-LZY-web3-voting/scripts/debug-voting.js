#!/usr/bin/env node

const { ethers } = require("hardhat");

async function debugVotingIssue() {
  console.log("🔍 开始排查投票问题...\n");

  try {
    // 获取合约实例
    const votingContractAddress = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d";
    const votingTicketAddress = "0x68B1D87F95878fE05B998F19b66F4baba5De1aed";

    const VotingContract = await ethers.getContractFactory("VotingContract");
    const VotingTicket = await ethers.getContractFactory("VotingTicket");

    const votingContract = VotingContract.attach(votingContractAddress);
    const votingTicket = VotingTicket.attach(votingTicketAddress);

    console.log("📋 合约地址:");
    console.log(`  VotingContract: ${votingContractAddress}`);
    console.log(`  VotingTicket: ${votingTicketAddress}\n`);

    // 获取当前投票期信息
    console.log("📅 投票期状态检查:");
    const currentPeriodId = await votingContract.currentVotingPeriodId();
    console.log(`  当前投票期ID: ${currentPeriodId.toString()}`);

    const votingPeriod = await votingContract.votingPeriods(currentPeriodId);
    const currentTime = Math.floor(Date.now() / 1000);

    console.log(
      `  投票期开始时间: ${new Date(Number(votingPeriod.startTime) * 1000).toLocaleString()}`,
    );
    console.log(
      `  投票期结束时间: ${new Date(Number(votingPeriod.endTime) * 1000).toLocaleString()}`,
    );
    console.log(`  当前时间: ${new Date(currentTime * 1000).toLocaleString()}`);
    console.log(`  投票期是否激活: ${votingPeriod.active}`);
    console.log(`  投票期是否已解决: ${votingPeriod.resolved}`);
    console.log(
      `  投票期是否已开始: ${currentTime >= Number(votingPeriod.startTime)}`,
    );
    console.log(
      `  投票期是否已结束: ${currentTime > Number(votingPeriod.endTime)}\n`,
    );

    // 检查投票期状态
    const isVotingActive =
      votingPeriod.active &&
      currentTime >= Number(votingPeriod.startTime) &&
      currentTime <= Number(votingPeriod.endTime) &&
      !votingPeriod.resolved;

    if (!isVotingActive) {
      console.log("❌ 投票期状态异常!");
      if (!votingPeriod.active) console.log("   - 投票期未激活");
      if (currentTime < Number(votingPeriod.startTime))
        console.log("   - 投票期未开始");
      if (currentTime > Number(votingPeriod.endTime))
        console.log("   - 投票期已结束");
      if (votingPeriod.resolved) console.log("   - 投票期已解决");
      console.log();
    } else {
      console.log("✅ 投票期状态正常\n");
    }

    // 获取测试账户
    const [deployer, user1] = await ethers.getSigners();
    console.log("👤 测试账户:");
    console.log(`  部署者: ${deployer.address}`);
    console.log(`  用户1: ${user1.address}\n`);

    // 检查用户投票券余额
    console.log("🎫 投票券余额检查:");
    const userBalance = await votingTicket.balanceOf(user1.address);
    console.log(`  用户1余额: ${ethers.utils.formatEther(userBalance)} 张`);

    // 检查授权额度
    const allowance = await votingTicket.allowance(
      user1.address,
      votingContractAddress,
    );
    console.log(`  授权额度: ${ethers.utils.formatEther(allowance)} 张\n`);

    // 获取合约内的投票券余额
    const contractBalance = await votingTicket.balanceOf(votingContractAddress);
    console.log("📦 合约状态:");
    console.log(
      `  合约内投票券余额: ${ethers.utils.formatEther(contractBalance)} 张`,
    );

    // 检查用户的投票记录
    const userVoteCount = await votingContract.getUserVoteCount(user1.address);
    console.log(`  用户投票记录数: ${userVoteCount.toString()}\n`);

    if (userVoteCount > 0) {
      console.log("📝 用户投票记录:");
      for (let i = 0; i < userVoteCount; i++) {
        const vote = await votingContract.getUserVote(user1.address, i);
        console.log(`  投票 ${i + 1}:`);
        console.log(`    预测年份: ${vote.predictedYear.toString()}`);
        console.log(
          `    使用投票券: ${ethers.utils.formatEther(vote.ticketsUsed)} 张`,
        );
        console.log(
          `    投票时间: ${new Date(Number(vote.timestamp) * 1000).toLocaleString()}`,
        );
        console.log(`    已领取奖励: ${vote.claimed}`);
        console.log(`    投票期ID: ${vote.votingPeriodId.toString()}\n`);
      }
    }

    // 检查投票统计
    console.log("📊 投票统计:");
    const totalTickets = await votingContract.getVoteStats(
      currentPeriodId,
      2027,
    ); // 检查2027年选项
    console.log(
      `  2027年选项投票券数: ${ethers.utils.formatEther(totalTickets)} 张\n`,
    );

    // 模拟投票测试
    if (userBalance.gt(0) && isVotingActive) {
      console.log("🧪 准备测试投票...");

      // 检查是否需要授权
      if (allowance.lt(ethers.utils.parseEther("1"))) {
        console.log("  需要先授权投票券...");
        const approveTx = await votingTicket
          .connect(user1)
          .approve(votingContractAddress, ethers.utils.parseEther("1"));
        await approveTx.wait();
        console.log("  ✅ 授权成功");
      }

      // 尝试投票
      console.log("  尝试投票...");
      try {
        const voteTx = await votingContract
          .connect(user1)
          .vote(2027, ethers.utils.parseEther("0.1"));
        await voteTx.wait();
        console.log("  ✅ 投票成功!");

        // 检查投票后的余额
        const newBalance = await votingTicket.balanceOf(user1.address);
        console.log(`  投票后余额: ${ethers.utils.formatEther(newBalance)} 张`);
      } catch (error) {
        console.log("  ❌ 投票失败:");
        console.log(`    错误信息: ${error.message}`);
      }
    } else {
      console.log("⚠️  无法进行投票测试:");
      if (userBalance.eq(0)) console.log("  - 用户投票券余额为0");
      if (!isVotingActive) console.log("  - 投票期状态异常");
    }
  } catch (error) {
    console.error("❌ 脚本执行失败:", error.message);
  }
}

// 运行调试脚本
debugVotingIssue()
  .then(() => {
    console.log("\n🎉 调试完成!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 脚本执行错误:", error);
    process.exit(1);
  });
