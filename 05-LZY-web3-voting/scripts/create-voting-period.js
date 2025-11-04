#!/usr/bin/env node

const { ethers } = require("hardhat");

async function createVotingPeriod() {
  console.log("🔧 创建新的投票期...\n");

  try {
    const votingContractAddress = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d";
    const VotingContract = await ethers.getContractFactory("VotingContract");
    const votingContract = VotingContract.attach(votingContractAddress);

    // 获取部署者账户
    const [deployer] = await ethers.getSigners();
    console.log(`👤 使用账户: ${deployer.address}`);

    // 检查是否为合约所有者
    const owner = await votingContract.owner();
    if (deployer.address.toLowerCase() !== owner.toLowerCase()) {
      console.log(`❌ 错误: 当前账户不是合约所有者`);
      console.log(`   当前账户: ${deployer.address}`);
      console.log(`   合约所有者: ${owner}`);
      return;
    }

    console.log("✅ 账户验证通过\n");

    // 设置投票期持续时间（例如：365天）
    const duration = 365 * 24 * 60 * 60; // 365天
    console.log(`📅 创建投票期，持续时间: ${duration}秒 (${365}天)`);

    // 创建新的投票期
    console.log("⏳ 正在创建投票期...");
    const tx = await votingContract.createVotingPeriod(duration);
    console.log(`   交易哈希: ${tx.hash}`);

    console.log("⏳ 等待交易确认...");
    const receipt = await tx.wait();
    console.log(`✅ 交易确认成功! Gas使用: ${receipt.gasUsed.toString()}`);

    // 获取新的投票期信息
    const newPeriodId = await votingContract.currentVotingPeriodId();
    console.log(`\n📊 新投票期信息:`);
    console.log(`   投票期ID: ${newPeriodId.toString()}`);

    const newPeriod = await votingContract.votingPeriods(newPeriodId);
    const currentTime = Math.floor(Date.now() / 1000);

    console.log(
      `   开始时间: ${new Date(Number(newPeriod.startTime) * 1000).toLocaleString()}`,
    );
    console.log(
      `   结束时间: ${new Date(Number(newPeriod.endTime) * 1000).toLocaleString()}`,
    );
    console.log(`   是否激活: ${newPeriod.active}`);
    console.log(`   是否已解决: ${newPeriod.resolved}`);

    console.log("\n🎉 新投票期创建成功!");
  } catch (error) {
    console.error("❌ 创建失败:", error.message);
    if (error.message.includes("Only owner can call this function")) {
      console.log("💡 提示: 只有合约所有者可以创建新的投票期");
    }
  }
}

createVotingPeriod()
  .then(() => {
    console.log("\n✅ 脚本执行完成!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 脚本执行错误:", error);
    process.exit(1);
  });
