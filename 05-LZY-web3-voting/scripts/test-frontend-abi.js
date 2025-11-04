import { readFileSync } from "fs";
import { join } from "path";

// 测试前端 ABI 文件是否正确
function testFrontendABIs() {
  console.log("🧪 测试前端 ABI 文件...\n");

  const abiFiles = [
    "BTCOracle.json",
    "StakingContract.json",
    "vDOT.json",
    "VotingContract.json",
    "VotingNFTReward.json",
    "VotingTicket.json",
  ];

  for (const abiFile of abiFiles) {
    try {
      console.log(`📝 检查 ${abiFile}...`);

      const abiPath = join(process.cwd(), "src", "contracts", "abis", abiFile);
      const abiContent = readFileSync(abiPath, "utf8");
      const abi = JSON.parse(abiContent);

      // 检查是否是数组
      if (!Array.isArray(abi)) {
        console.log(`❌ ${abiFile} 不是数组格式`);
        continue;
      }

      // 检查是否有函数定义
      const functions = abi.filter((item) => item.type === "function");
      console.log(`   ✅ 格式正确，包含 ${functions.length} 个函数`);

      // 检查是否有构造函数
      const constructors = abi.filter((item) => item.type === "constructor");
      if (constructors.length > 0) {
        console.log(`   ✅ 包含构造函数`);
      }

      // 检查是否有事件
      const events = abi.filter((item) => item.type === "event");
      console.log(`   ✅ 包含 ${events.length} 个事件`);
    } catch (error) {
      console.error(`❌ 检查 ${abiFile} 时出错:`, error.message);
    }
  }

  console.log("\n🎉 ABI 文件检查完成！");
}

// Run the test
testFrontendABIs();
