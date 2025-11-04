import { createPublicClient, http, formatEther } from "viem";

// Moonbase Alpha chain configuration
const moonbaseAlpha = {
  id: 1287,
  name: "Moonbase Alpha",
  network: "moonbase-alpha",
  nativeCurrency: {
    decimals: 18,
    name: "DEV",
    symbol: "DEV",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.api.moonbase.moonbeam.network"],
    },
    public: {
      http: ["https://rpc.api.moonbase.moonbeam.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Moonscan",
      url: "https://moonbase.moonscan.io",
    },
  },
  testnet: true,
};

// Moonbase Alpha contract addresses
const contracts = {
  vDOT: "0xD8e779Ca9D22E587f64f613dE9615c797095d225",
  StakingContract: "0xc0b279c4918F236e9d82f54DFd2e4A819c1Ce156",
  VotingTicket: "0x911896E86EC581cAD2D919247F5ae2f61F17849C",
  VotingContract: "0x0CeCa1B57D8f024c81223ABAE786C643BBBd3F8B",
  VotingNFTReward: "0xF7496a303D8D811f8A10203B5825fed9e6119b01",
  BTCOracle: "0x0072c64A3974497c946291A70827e09E7BC2aEbF",
};

// Simple ERC20 ABI for basic checks
const erc20Abi = [
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

async function testMoonbaseContracts() {
  console.log("🚀 Testing Moonbase Alpha Contract Connections...\n");

  // Create public client for Moonbase Alpha
  const publicClient = createPublicClient({
    chain: moonbaseAlpha,
    transport: http(),
  });

  try {
    // Test network connection
    console.log("📡 Testing network connection...");
    const blockNumber = await publicClient.getBlockNumber();
    console.log(
      `✅ Connected to Moonbase Alpha. Current block: ${blockNumber}\n`,
    );

    // Test each contract
    for (const [contractName, address] of Object.entries(contracts)) {
      console.log(`🔍 Testing ${contractName} at ${address}...`);

      try {
        // Try to get contract name
        const name = await publicClient.readContract({
          address,
          abi: erc20Abi,
          functionName: "name",
        });
        console.log(`  ✅ Contract name: ${name}`);
      } catch (error) {
        console.log(`  ⚠️  Could not read name: ${error.message}`);
      }

      try {
        // Try to get contract owner
        const owner = await publicClient.readContract({
          address,
          abi: erc20Abi,
          functionName: "owner",
        });
        console.log(`  ✅ Owner: ${owner}`);
      } catch (error) {
        console.log(`  ⚠️  Could not read owner: ${error.message}`);
      }

      try {
        // Try to get total supply (for ERC20 contracts)
        const totalSupply = await publicClient.readContract({
          address,
          abi: erc20Abi,
          functionName: "totalSupply",
        });
        console.log(`  ✅ Total supply: ${formatEther(totalSupply)} tokens`);
      } catch (error) {
        console.log(`  ⚠️  Could not read total supply: ${error.message}`);
      }

      console.log("");
    }

    console.log("🎉 Moonbase Alpha contract testing completed!");
  } catch (error) {
    console.error("❌ Error testing contracts:", error);
  }
}

// Run the test
testMoonbaseContracts().catch(console.error);
