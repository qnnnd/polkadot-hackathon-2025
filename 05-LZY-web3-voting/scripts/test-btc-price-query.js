const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 测试 BTC 价格查询功能...");

  // 获取合约实例
  const btcOracleAddress = "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1";
  const BTCOracle = await ethers.getContractAt("BTCOracle", btcOracleAddress);

  try {
    // 测试 getBTCPrice 函数
    console.log("📞 调用 getBTCPrice() 函数...");
    const price = await BTCOracle.getBTCPrice();
    console.log("✅ BTC 价格查询成功!");
    console.log(`💰 价格: ${ethers.formatUnits(price, 8)} USD`);
    console.log(`📊 原始数据: ${price.toString()}`);

    // 计算市值
    const btcSupply = 19500000;
    const priceFloat = parseFloat(ethers.formatUnits(price, 8));
    const marketCap = ((priceFloat * btcSupply) / 1e9).toFixed(2);
    console.log(`🏦 市值: $${marketCap}B`);

    // 检查价格是否合理
    if (priceFloat > 1000 && priceFloat < 200000) {
      console.log("✅ 价格数据看起来合理");
    } else {
      console.log("⚠️  价格数据可能异常");
    }
  } catch (error) {
    console.error("❌ BTC 价格查询失败:", error.message);

    if (error.message.includes("call revert")) {
      console.log("💡 可能的原因:");
      console.log("   1. BTCOracle 合约未正确部署");
      console.log("   2. Chainlink 价格源地址配置错误");
      console.log("   3. 本地网络没有 mock Chainlink 数据");
      console.log("   4. 合约地址不正确");
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
