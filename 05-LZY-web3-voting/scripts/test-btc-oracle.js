const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing BTCOracle Multi-Chain Features...\n");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("📋 Using account:", deployer.address);
  console.log(
    "💰 Account balance:",
    ethers.formatEther(await deployer.provider.getBalance(deployer.address)),
    "ETH\n",
  );

  // 部署合约
  console.log("🚀 Deploying contracts...");

  // 部署 VotingTicket
  const VotingTicket = await ethers.getContractFactory("VotingTicket");
  const votingTicket = await VotingTicket.deploy();
  await votingTicket.waitForDeployment();
  console.log("✅ VotingTicket deployed to:", await votingTicket.getAddress());

  // 部署 VotingContract
  const VotingContract = await ethers.getContractFactory("VotingContract");
  const votingContract = await VotingContract.deploy(
    await votingTicket.getAddress(),
    deployer.address, // 临时设置为部署者为 oracle
  );
  await votingContract.waitForDeployment();
  console.log(
    "✅ VotingContract deployed to:",
    await votingContract.getAddress(),
  );

  // 部署 BTCOracle
  const BTCOracle = await ethers.getContractFactory("BTCOracle");
  const btcOracle = await BTCOracle.deploy(
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // BTC/USD price feed (mainnet)
    await votingContract.getAddress(),
  );
  await btcOracle.waitForDeployment();
  console.log("✅ BTCOracle deployed to:", await btcOracle.getAddress());

  // 更新 VotingContract 的 oracle 地址
  await votingContract.updateOracleContract(await btcOracle.getAddress());
  console.log("✅ Updated VotingContract oracle address\n");

  // 测试竞争链管理功能
  console.log("🔧 Testing competitor chain management...");

  // 添加以太坊竞争链
  const ethTx1 = await btcOracle.addCompetitor(
    "Ethereum",
    "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", // ETH/USD price feed (mainnet)
    ethers.parseEther("120000000"), // 1.2亿 ETH 流通量
  );
  await ethTx1.wait();
  console.log("✅ Added Ethereum competitor");

  // 添加 Solana 竞争链（使用 BNB 价格源作为示例）
  const solTx = await btcOracle.addCompetitor(
    "Solana",
    "0x14e613AC84a31f709eadbdFd89ac0C5C2f9b8b5", // BNB/USD price feed (mainnet)
    ethers.parseEther("550000000"), // 5.5亿 SOL 流通量
  );
  await solTx.wait();
  console.log("✅ Added Solana competitor");

  // 获取竞争链信息
  const ethInfo = await btcOracle.getCompetitorInfo(0);
  console.log("📊 Ethereum info:", {
    name: ethInfo.name,
    priceFeed: ethInfo.priceFeed,
    circulatingSupply: ethers.formatEther(ethInfo.circulatingSupply),
    isActive: ethInfo.isActive,
  });

  const allCompetitors = await btcOracle.getAllCompetitors();
  console.log("📋 Total competitors:", allCompetitors.length);

  // 测试供应量更新
  console.log("\n🔄 Testing supply updates...");
  const updateTx = await btcOracle.updateCompetitorSupply(
    0,
    ethers.parseEther("125000000"),
  );
  await updateTx.wait();
  console.log("✅ Updated Ethereum supply to 125M");

  const updatedEthInfo = await btcOracle.getCompetitorInfo(0);
  console.log(
    "📊 Updated Ethereum supply:",
    ethers.formatEther(updatedEthInfo.circulatingSupply),
  );

  // 测试 BTC 供应量更新
  const btcUpdateTx = await btcOracle.updateBTCSupply(
    ethers.parseEther("19500000"),
  );
  await btcUpdateTx.wait();
  console.log("✅ Updated BTC supply to 19.5M");

  // 测试市值计算
  console.log("\n💰 Testing market cap calculations...");
  try {
    const btcPrice = await btcOracle.getBTCPrice();
    console.log("📈 BTC Price:", ethers.formatUnits(btcPrice, 8), "USD");

    // 注意：在实际测试中，可能需要等待 Chainlink 价格源响应
    console.log("ℹ️  Note: Market cap calculations require live price feeds");
  } catch (error) {
    console.log(
      "⚠️  Price feed error (expected in local test):",
      error.message,
    );
  }

  // 测试投票期管理
  console.log("\n🗳️  Testing voting period management...");
  const votingPeriodInfo = await votingContract.votingPeriods(1);
  console.log("📅 Voting Period 1:", {
    startTime: new Date(
      Number(votingPeriodInfo.startTime) * 1000,
    ).toLocaleString(),
    endTime: new Date(Number(votingPeriodInfo.endTime) * 1000).toLocaleString(),
    active: votingPeriodInfo.active,
    resolved: votingPeriodInfo.resolved,
    correctAnswerYear: votingPeriodInfo.correctAnswerYear.toString(),
  });

  // 测试快照功能（需要等待间隔）
  console.log("\n📸 Testing snapshot functionality...");
  const canTakeSnapshot = await btcOracle.canTakeSnapshot(1);
  console.log("⏰ Can take snapshot:", canTakeSnapshot);

  if (!canTakeSnapshot) {
    console.log(
      "ℹ️  Need to wait for snapshot interval (24 hours) or modify for testing",
    );
  }

  console.log("\n🎉 BTCOracle multi-chain features test completed!");
  console.log("\n📋 Contract Addresses:");
  console.log("- VotingTicket:", await votingTicket.getAddress());
  console.log("- VotingContract:", await votingContract.getAddress());
  console.log("- BTCOracle:", await btcOracle.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
