const { ethers } = require("hardhat");

async function main() {
  console.log("📸 测试市场快照拍摄功能...");

  // 获取合约实例
  const btcOracleAddress = "0xf4B146FbA71F41E0592668ffbF264F1D186b2Ca8";
  const BTCOracle = await ethers.getContractAt("BTCOracle", btcOracleAddress);

  try {
    // 测试 takeMarketSnapshot 函数
    console.log("📞 调用 takeMarketSnapshot(1) 函数...");
    const tx = await BTCOracle.takeMarketSnapshot(1);
    console.log("⏳ 等待交易确认...");
    const receipt = await tx.wait();

    console.log("✅ 市场快照拍摄成功!");
    console.log(`📋 交易哈希: ${tx.hash}`);
    console.log(`⛽ Gas 使用量: ${receipt.gasUsed.toString()}`);
    console.log(`💰 Gas 价格: ${tx.gasPrice?.toString() || "N/A"} wei`);

    // 检查快照数量
    const snapshotCount = await BTCOracle.getSnapshotCount(1);
    console.log(`📊 当前快照数量: ${snapshotCount}`);

    // 获取最新快照信息
    if (snapshotCount > 0) {
      const latestSnapshot = await BTCOracle.getSnapshot(1, snapshotCount - 1);
      console.log("\n📋 最新快照信息:");
      console.log(
        `🕒 时间戳: ${new Date(Number(latestSnapshot[0]) * 1000).toLocaleString()}`,
      );
      console.log(
        `💰 BTC 市值: $${(Number(latestSnapshot[1]) / 1e9).toFixed(2)}B`,
      );
      console.log(
        `🏆 最高竞争链市值: $${(Number(latestSnapshot[2]) / 1e9).toFixed(2)}B`,
      );
      console.log(`🥇 获胜竞争链ID: ${latestSnapshot[3]}`);
      console.log(
        `📊 结果: ${latestSnapshot[4] === 0 ? "BTC_DOMINANT" : latestSnapshot[4] === 1 ? "COMPETITOR_WIN" : "PENDING"}`,
      );
    }

    // 检查是否可以再次拍摄快照（已移除时间限制）
    const canTakeSnapshot = await BTCOracle.canTakeSnapshot(1);
    console.log(
      `\n⏰ 是否可以拍摄新快照: ${canTakeSnapshot ? "是（无时间限制）" : "否"}`,
    );
  } catch (error) {
    console.error("❌ 市场快照拍摄失败:", error.message);

    if (error.message.includes("Snapshot interval not reached")) {
      console.log("💡 原因: 距离上次快照拍摄不足24小时");
      console.log("💡 解决方案: 等待24小时后再次尝试，或检查合约时间设置");
    } else if (error.message.includes("Threshold not set")) {
      console.log("💡 原因: 投票期阈值未设置");
      console.log("💡 解决方案: 调用 setThreshold 函数设置阈值");
    } else if (error.message.includes("Invalid BTC price")) {
      console.log("💡 原因: BTC 价格数据无效");
      console.log("💡 解决方案: 检查 Chainlink 价格源配置");
    }
  }

  // 检查合约基本信息
  try {
    console.log("\n📋 检查合约基本信息...");
    const owner = await BTCOracle.owner();
    console.log(`👤 合约所有者: ${owner}`);

    const currentPeriod = await BTCOracle.currentVotingPeriod();
    console.log(`🗓️  当前投票期: ${currentPeriod}`);

    const competitorCount = await BTCOracle.competitorCount();
    console.log(`🔗 竞争链数量: ${competitorCount}`);

    // 检查阈值设置
    const threshold = await BTCOracle.thresholds(1);
    console.log(
      `⚖️  投票期1阈值: BTC=${(Number(threshold[0]) / 1e9).toFixed(2)}B, 竞争链=${(Number(threshold[1]) / 1e9).toFixed(2)}B, 激活=${threshold[2]}`,
    );
  } catch (error) {
    console.error("❌ 获取合约信息失败:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 脚本执行失败:", error);
    process.exit(1);
  });
