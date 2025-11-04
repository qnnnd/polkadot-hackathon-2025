const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 重新部署 BTCOracle 合约（移除时间限制）...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("📝 部署者账户:", deployer.address);

  // 部署参数（需要根据实际网络配置）
  const BTC_PRICE_FEED = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"; // BTC/USD 主网地址（测试时可能需要mock）
  const VOTING_CONTRACT = "0x0000000000000000000000000000000000000000"; // 暂时设为0地址

  console.log("🏗️  开始部署 BTCOracle...");

  try {
    // 部署 BTCOracle 合约
    const BTCOracle = await ethers.getContractFactory("BTCOracle");
    const btcOracle = await BTCOracle.deploy(BTC_PRICE_FEED, VOTING_CONTRACT);

    await btcOracle.waitForDeployment();
    const oracleAddress = await btcOracle.getAddress();

    console.log("✅ BTCOracle 部署成功!");
    console.log(`📍 合约地址: ${oracleAddress}`);
    console.log(`🔗 交易哈希: ${btcOracle.deploymentTransaction().hash}`);

    // 验证合约状态
    console.log("\n🔍 验证合约状态...");
    const currentPeriod = await btcOracle.currentVotingPeriod();
    console.log(`📊 当前投票期: ${currentPeriod}`);

    const canTakeSnapshot = await btcOracle.canTakeSnapshot(1);
    console.log(
      `⏰ 是否可以拍摄快照: ${canTakeSnapshot ? "是（无时间限制）" : "否"}`,
    );

    const threshold = await btcOracle.thresholds(1);
    console.log(`⚖️  投票期1阈值已设置: ${threshold[2] ? "是" : "否"}`);

    // 保存部署信息
    const deploymentInfo = {
      network: "hardhat",
      btcOracle: {
        address: oracleAddress,
        btcPriceFeed: BTC_PRICE_FEED,
        votingContract: VOTING_CONTRACT,
        deploymentTime: new Date().toISOString(),
        features: [
          "无快照时间限制",
          "支持多竞争链",
          "自动开奖",
          "优化函数接口",
        ],
      },
    };

    console.log("\n📋 部署信息:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    console.log("\n💡 下一步:");
    console.log("1. 更新 src/config/contracts.ts 中的 btcOracleAddress");
    console.log("2. 更新前端合约地址配置");
    console.log("3. 测试快照功能");
  } catch (error) {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 脚本执行失败:", error);
    process.exit(1);
  });
