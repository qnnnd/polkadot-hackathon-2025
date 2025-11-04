const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Multi-Chain Oracle System...\n");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("📋 Using account:", deployer.address);
  console.log(
    "💰 Account balance:",
    ethers.formatEther(await deployer.provider.getBalance(deployer.address)),
    "ETH\n",
  );

  // Chainlink 价格源地址 (Mainnet)
  const PRICE_FEEDS = {
    BTC_USD: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // BTC/USD
    ETH_USD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", // ETH/USD
    BNB_USD: "0x14e613AC84a31f709eadbdFd89ac0C5C2f9b8b5", // BNB/USD (作为其他竞争链示例)
  };

  console.log("📊 Price Feed Addresses:");
  console.log("- BTC/USD:", PRICE_FEEDS.BTC_USD);
  console.log("- ETH/USD:", PRICE_FEEDS.ETH_USD);
  console.log("- BNB/USD:", PRICE_FEEDS.BNB_USD);
  console.log("");

  // 部署合约
  console.log("🔨 Deploying contracts...");

  // 1. 部署 vDOT 代币
  const VDOT = await ethers.getContractFactory("vDOT");
  const vDOT = await VDOT.deploy();
  await vDOT.waitForDeployment();
  const vDOTAddress = await vDOT.getAddress();
  console.log("✅ vDOT deployed to:", vDOTAddress);

  // 2. 部署 VotingTicket
  const VotingTicket = await ethers.getContractFactory("VotingTicket");
  const votingTicket = await VotingTicket.deploy();
  await votingTicket.waitForDeployment();
  const votingTicketAddress = await votingTicket.getAddress();
  console.log("✅ VotingTicket deployed to:", votingTicketAddress);

  // 3. 部署 VotingContract
  const VotingContract = await ethers.getContractFactory("VotingContract");
  const votingContract = await VotingContract.deploy(
    votingTicketAddress,
    deployer.address, // 临时设置为部署者为 oracle，稍后会更新
  );
  await votingContract.waitForDeployment();
  const votingContractAddress = await votingContract.getAddress();
  console.log("✅ VotingContract deployed to:", votingContractAddress);

  // 4. 部署 BTCOracle (Multi-Chain)
  const BTCOracle = await ethers.getContractFactory("BTCOracle");
  const btcOracle = await BTCOracle.deploy(
    PRICE_FEEDS.BTC_USD,
    votingContractAddress,
  );
  await btcOracle.waitForDeployment();
  const btcOracleAddress = await btcOracle.getAddress();
  console.log("✅ BTCOracle deployed to:", btcOracleAddress);

  // 5. 部署 StakingContract
  const StakingContract = await ethers.getContractFactory("StakingContract");
  const stakingContract = await StakingContract.deploy(
    vDOTAddress,
    votingTicketAddress,
    votingContractAddress,
  );
  await stakingContract.waitForDeployment();
  const stakingContractAddress = await stakingContract.getAddress();
  console.log("✅ StakingContract deployed to:", stakingContractAddress);

  // 6. 部署 VotingNFTReward
  const VotingNFTReward = await ethers.getContractFactory("VotingNFTReward");
  const votingNFTReward = await VotingNFTReward.deploy();
  await votingNFTReward.waitForDeployment();
  const votingNFTRewardAddress = await votingNFTReward.getAddress();
  console.log("✅ VotingNFTReward deployed to:", votingNFTRewardAddress);

  // 更新合约间的引用
  console.log("\n🔗 Updating contract references...");

  // 更新 VotingContract 的 oracle 地址
  const updateOracleTx =
    await votingContract.updateOracleContract(btcOracleAddress);
  await updateOracleTx.wait();
  console.log("✅ Updated VotingContract oracle address");

  // 配置 BTCOracle 的竞争链
  console.log("\n🌐 Configuring competitor chains...");

  // 添加以太坊
  const addEthTx = await btcOracle.addCompetitor(
    "Ethereum",
    PRICE_FEEDS.ETH_USD,
    ethers.parseEther("120000000"), // 1.2亿 ETH 流通量
  );
  await addEthTx.wait();
  console.log("✅ Added Ethereum competitor");

  // 添加 BNB (作为其他竞争链示例)
  const addBnbTx = await btcOracle.addCompetitor(
    "BNB Chain",
    PRICE_FEEDS.BNB_USD,
    ethers.parseEther("155000000"), // 1.55亿 BNB 流通量
  );
  await addBnbTx.wait();
  console.log("✅ Added BNB Chain competitor");

  // 更新 BTC 供应量
  const updateBtcSupplyTx = await btcOracle.updateBTCSupply(
    ethers.parseEther("19500000"),
  );
  await updateBtcSupplyTx.wait();
  console.log("✅ Updated BTC circulating supply to 19.5M");

  // 设置投票期阈值
  const setThresholdTx = await btcOracle.setThreshold(
    1, // 投票期ID
    ethers.parseEther("1000000000000"), // BTC 市值阈值：1万亿美元
    ethers.parseEther("500000000000"), // 竞争链市值阈值：5000亿美元
  );
  await setThresholdTx.wait();
  console.log("✅ Set voting period thresholds");

  // 生成部署信息
  const deploymentInfo = {
    network: "hardhat", // 可以根据需要修改
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      vDOT: vDOTAddress,
      VotingTicket: votingTicketAddress,
      VotingContract: votingContractAddress,
      BTCOracle: btcOracleAddress,
      StakingContract: stakingContractAddress,
      VotingNFTReward: votingNFTRewardAddress,
    },
    priceFeeds: PRICE_FEEDS,
    competitors: [
      {
        id: 0,
        name: "Ethereum",
        priceFeed: PRICE_FEEDS.ETH_USD,
        circulatingSupply: "120000000",
      },
      {
        id: 1,
        name: "BNB Chain",
        priceFeed: PRICE_FEEDS.BNB_USD,
        circulatingSupply: "155000000",
      },
    ],
    btcCirculatingSupply: "19500000",
    thresholds: {
      btcMarketCap: "1000000000000",
      competitorCap: "500000000000",
    },
  };

  // 保存部署信息
  const deploymentPath = path.join(
    __dirname,
    "..",
    "deployments",
    "multi-chain-oracle.json",
  );
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentPath);

  // 验证部署
  console.log("\n🔍 Verifying deployment...");

  const competitorCount = await btcOracle.competitorCount();
  console.log("📊 Competitor count:", competitorCount.toString());

  const allCompetitors = await btcOracle.getAllCompetitors();
  console.log("🌐 Configured competitors:");
  allCompetitors.forEach((competitor, index) => {
    console.log(`  ${index}: ${competitor.name} (${competitor.priceFeed})`);
  });

  const btcSupply = await btcOracle.btcCirculatingSupply();
  console.log("₿ BTC supply:", ethers.formatEther(btcSupply));

  console.log("\n🎉 Multi-Chain Oracle System deployed successfully!");
  console.log("\n📋 Contract Addresses:");
  Object.entries(deploymentInfo.contracts).forEach(([name, address]) => {
    console.log(`- ${name}: ${address}`);
  });

  console.log("\n📖 Next Steps:");
  console.log("1. Update frontend contract addresses");
  console.log("2. Test market cap calculations with live price feeds");
  console.log("3. Set up Chainlink Automation for periodic snapshots");
  console.log("4. Configure additional competitor chains as needed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
