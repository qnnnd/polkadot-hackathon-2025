#!/usr/bin/env node

const { ethers } = require("hardhat");

async function checkVotingPeriod() {
  console.log("🔍 检查投票期状态...\n");

  try {
    const votingContractAddress = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d";
    const VotingContract = await ethers.getContractFactory("VotingContract");
    const votingContract = VotingContract.attach(votingContractAddress);

    // 获取当前投票期ID
    const currentPeriodId = await votingContract.currentVotingPeriodId();
    console.log(`📅 当前投票期ID: ${currentPeriodId.toString()}`);

    // 获取投票期详细信息
    const votingPeriod = await votingContract.votingPeriods(currentPeriodId);
    const currentTime = Math.floor(Date.now() / 1000);

    console.log("\n📊 投票期详细信息:");
    console.log(
      `  开始时间: ${votingPeriod.startTime.toString()} (${new Date(Number(votingPeriod.startTime) * 1000).toLocaleString()})`,
    );
    console.log(
      `  结束时间: ${votingPeriod.endTime.toString()} (${new Date(Number(votingPeriod.endTime) * 1000).toLocaleString()})`,
    );
    console.log(
      `  当前时间: ${currentTime} (${new Date(currentTime * 1000).toLocaleString()})`,
    );
    console.log(`  是否激活: ${votingPeriod.active}`);
    console.log(`  是否已解决: ${votingPeriod.resolved}`);
    console.log(`  正确答案年份: ${votingPeriod.correctAnswerYear.toString()}`);

    // 计算状态
    const isStarted = currentTime >= Number(votingPeriod.startTime);
    const isEnded = currentTime > Number(votingPeriod.endTime);
    const isActive =
      votingPeriod.active && isStarted && !isEnded && !votingPeriod.resolved;

    console.log("\n🔍 状态分析:");
    console.log(`  投票期已开始: ${isStarted ? "✅" : "❌"}`);
    console.log(`  投票期已结束: ${isEnded ? "❌" : "✅"}`);
    console.log(`  投票期激活: ${votingPeriod.active ? "✅" : "❌"}`);
    console.log(`  投票期未解决: ${!votingPeriod.resolved ? "✅" : "❌"}`);
    console.log(`  总体状态: ${isActive ? "✅ 可以投票" : "❌ 无法投票"}`);

    if (!isActive) {
      console.log("\n⚠️  问题诊断:");
      if (!votingPeriod.active) console.log("  - 投票期未激活，需要管理员激活");
      if (!isStarted) console.log("  - 投票期未开始，等待开始时间");
      if (isEnded) console.log("  - 投票期已结束，需要创建新的投票期");
      if (votingPeriod.resolved)
        console.log("  - 投票期已解决，需要创建新的投票期");
    }

    // 计算剩余时间
    const timeRemaining = Number(votingPeriod.endTime) - currentTime;
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
  } catch (error) {
    console.error("❌ 检查失败:", error.message);
  }
}

checkVotingPeriod()
  .then(() => {
    console.log("\n🎉 检查完成!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 脚本执行错误:", error);
    process.exit(1);
  });
