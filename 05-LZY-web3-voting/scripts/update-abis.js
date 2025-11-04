import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// 映射 artifact 文件到对应的 ABI 文件
const abiMapping = [
  {
    artifact: "DeployMoonbaseModule#BTCOracle.json",
    abi: "BTCOracle.json",
  },
  {
    artifact: "DeployMoonbaseModule#StakingContract.json",
    abi: "StakingContract.json",
  },
  {
    artifact: "DeployMoonbaseModule#vDOT.json",
    abi: "vDOT.json",
  },
  {
    artifact: "DeployMoonbaseModule#VotingContract.json",
    abi: "VotingContract.json",
  },
  {
    artifact: "DeployMoonbaseModule#VotingNFTReward.json",
    abi: "VotingNFTReward.json",
  },
  {
    artifact: "DeployMoonbaseModule#VotingTicket.json",
    abi: "VotingTicket.json",
  },
];

async function updateABIs() {
  console.log("🔄 更新 ABI 文件...\n");

  for (const mapping of abiMapping) {
    try {
      console.log(`📝 处理 ${mapping.artifact} -> ${mapping.abi}`);

      // 读取 artifact 文件
      const artifactPath = join(process.cwd(), "artifacts", mapping.artifact);
      const artifactContent = readFileSync(artifactPath, "utf8");
      const artifact = JSON.parse(artifactContent);

      // 提取 ABI 数组
      const abi = artifact.abi;
      if (!Array.isArray(abi)) {
        console.log(`❌ ${mapping.artifact} 中没有找到有效的 ABI 数组`);
        continue;
      }

      // 写入 ABI 文件
      const abiPath = join(
        process.cwd(),
        "src",
        "contracts",
        "abis",
        mapping.abi,
      );
      writeFileSync(abiPath, JSON.stringify(abi, null, 2));

      console.log(`✅ 成功更新 ${mapping.abi} (${abi.length} 个函数)`);
    } catch (error) {
      console.error(`❌ 处理 ${mapping.artifact} 时出错:`, error.message);
    }
  }

  console.log("\n🎉 ABI 文件更新完成！");
}

// Run the update
updateABIs().catch(console.error);
