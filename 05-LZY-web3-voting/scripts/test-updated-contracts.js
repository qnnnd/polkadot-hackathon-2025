const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 测试更新后的合约配置...");

  // 新的合约地址
  const contracts = {
    vDOT: "0xBEc49fA140aCaA83533fB00A2BB19bDdd0290f25",
    StakingContract: "0xfbC22278A96299D91d41C453234d97b4F5Eb9B2d",
    VotingTicket: "0x4EE6eCAD1c2Dae9f525404De8555724e3c35d07B",
    VotingContract: "0xD84379CEae14AA33C123Af12424A37803F885889",
    VotingNFTReward: "0x172076E0166D1F9Cc711C77Adf8488051744980C",
    BTCOracle: "0xf4B146FbA71F41E0592668ffbF264F1D186b2Ca8",
  };

  console.log("📋 测试合约连接性...\n");

  for (const [name, address] of Object.entries(contracts)) {
    try {
      console.log(`🔗 测试 ${name}:`);
      console.log(`   地址: ${address}`);

      // 尝试获取合约实例
      const contract = await ethers.getContractAt(name, address);

      // 测试基本查询
      if (name === "BTCOracle") {
        const currentPeriod = await contract.currentVotingPeriod();
        const canTakeSnapshot = await contract.canTakeSnapshot(1);
        const competitorCount = await contract.competitorCount();

        console.log(`   ✅ 当前投票期: ${currentPeriod}`);
        console.log(`   ✅ 可拍摄快照: ${canTakeSnapshot ? "是" : "否"}`);
        console.log(`   ✅ 竞争链数量: ${competitorCount}`);

        // 测试新的函数接口
        try {
          const snapshotCount = await contract.getSnapshotCount(1);
          console.log(`   ✅ 快照数量: ${snapshotCount}`);
        } catch (error) {
          console.log(`   ⚠️  快照数量查询失败: ${error.message}`);
        }
      } else if (name === "VotingContract") {
        const votingPeriods = await contract.votingPeriods(1);
        console.log(
          `   ✅ 投票期1信息: 开始=${votingPeriods[0]}, 结束=${votingPeriods[1]}, 激活=${votingPeriods[2]}, 已解决=${votingPeriods[3]}`,
        );
      } else if (name === "vDOT") {
        const totalSupply = await contract.totalSupply();
        console.log(`   ✅ 总供应量: ${ethers.formatEther(totalSupply)} vDOT`);
      } else if (name === "VotingTicket") {
        const totalSupply = await contract.totalSupply();
        console.log(`   ✅ 总供应量: ${ethers.formatEther(totalSupply)} 票`);
      } else if (name === "StakingContract") {
        const totalStaked = await contract.totalStaked();
        console.log(`   ✅ 总质押量: ${ethers.formatEther(totalStaked)} ETH`);
      } else if (name === "VotingNFTReward") {
        const owner = await contract.owner();
        console.log(`   ✅ 合约所有者: ${owner}`);
      }

      console.log(`   ✅ 连接成功\n`);
    } catch (error) {
      console.log(`   ❌ 连接失败: ${error.message}\n`);
    }
  }

  // 特别测试 BTCOracle 的新功能
  console.log("🎯 特别测试 BTCOracle 新功能...");
  try {
    const BTCOracle = await ethers.getContractAt(
      "BTCOracle",
      contracts.BTCOracle,
    );

    // 测试 canTakeSnapshot 函数（应该始终返回 true，只要阈值激活）
    const canTakeSnapshot = await BTCOracle.canTakeSnapshot(1);
    console.log(
      `📸 快照可用性检查: ${canTakeSnapshot ? "✅ 可以拍摄" : "❌ 不能拍摄"}`,
    );

    // 测试阈值设置
    const threshold = await BTCOracle.thresholds(1);
    console.log(
      `⚖️  投票期1阈值: BTC=${(Number(threshold[0]) / 1e9).toFixed(2)}B, 竞争链=${(Number(threshold[1]) / 1e9).toFixed(2)}B, 激活=${threshold[2]}`,
    );

    // 测试新的函数接口
    try {
      const snapshotCount = await BTCOracle.getSnapshotCount(1);
      console.log(`📊 当前快照数量: ${snapshotCount}`);

      if (snapshotCount > 0) {
        const latestSnapshotInfo = await BTCOracle.getLatestSnapshotInfo(1);
        console.log(`📋 最新快照信息:`);
        console.log(
          `   时间戳: ${new Date(Number(latestSnapshotInfo[0]) * 1000).toLocaleString()}`,
        );
        console.log(
          `   BTC市值: $${(Number(latestSnapshotInfo[1]) / 1e9).toFixed(2)}B`,
        );
        console.log(
          `   最高竞争链市值: $${(Number(latestSnapshotInfo[2]) / 1e9).toFixed(2)}B`,
        );
        console.log(`   获胜竞争链ID: ${latestSnapshotInfo[3]}`);
        console.log(
          `   结果: ${latestSnapshotInfo[4] === 0 ? "BTC_DOMINANT" : latestSnapshotInfo[4] === 1 ? "COMPETITOR_WIN" : "PENDING"}`,
        );
      }
    } catch (error) {
      console.log(`⚠️  新函数接口测试失败: ${error.message}`);
    }
  } catch (error) {
    console.error(`❌ BTCOracle 测试失败: ${error.message}`);
  }

  console.log("\n✅ 合约配置测试完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 脚本执行失败:", error);
    process.exit(1);
  });
