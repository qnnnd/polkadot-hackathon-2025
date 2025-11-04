import { createPublicClient, http } from "viem";

// Moonbase Alpha configuration
const moonbaseAlpha = {
  id: 1287,
  name: "Moonbase Alpha",
  rpcUrls: {
    default: {
      http: ["https://rpc.api.moonbase.moonbeam.network"],
    },
  },
};

// Contract addresses
const VOTING_CONTRACT_ADDRESS = "0x0CeCa1B57D8f024c81223ABAE786C643BBBd3F8B";
const VOTING_TICKET_ADDRESS = "0x911896E86EC581cAD2D919247F5ae2f61F17849C";

// Simple ABI for testing
const votingContractAbi = [
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserVoteCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "index", type: "uint256" },
    ],
    name: "getUserVote",
    outputs: [
      { internalType: "uint256", name: "predictedYear", type: "uint256" },
      { internalType: "uint256", name: "ticketsUsed", type: "uint256" },
      { internalType: "uint256", name: "votingPeriodId", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "claimed", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

async function testVotingHistoryFix() {
  console.log("🔧 Testing voting history fix on Moonbase Alpha...\n");

  // Create public client for Moonbase Alpha
  const publicClient = createPublicClient({
    chain: moonbaseAlpha,
    transport: http(),
  });

  try {
    // Test network connection
    const blockNumber = await publicClient.getBlockNumber();
    console.log(
      `✅ Connected to Moonbase Alpha. Current block: ${blockNumber}\n`,
    );

    // Test with a sample address (you can replace this with your actual address)
    const testAddress = "0x5ca3207BA9182A4Afda578f31564DaC377863447"; // Contract owner

    console.log(`🔍 Testing voting history for address: ${testAddress}`);

    // Get user vote count
    const voteCount = await publicClient.readContract({
      address: VOTING_CONTRACT_ADDRESS,
      abi: votingContractAbi,
      functionName: "getUserVoteCount",
      args: [testAddress],
    });

    console.log(`📊 Vote count: ${voteCount}`);

    if (Number(voteCount) > 0) {
      console.log(`\n📋 Fetching ${Number(voteCount)} voting records...`);

      for (let i = 0; i < Number(voteCount); i++) {
        try {
          const vote = await publicClient.readContract({
            address: VOTING_CONTRACT_ADDRESS,
            abi: votingContractAbi,
            functionName: "getUserVote",
            args: [testAddress, BigInt(i)],
          });

          console.log(`  Vote ${i + 1}:`, {
            predictedYear: Number(vote[0]),
            ticketsUsed: vote[1].toString(),
            votingPeriodId: Number(vote[2]),
            timestamp: new Date(Number(vote[3]) * 1000).toLocaleString(),
            claimed: vote[4],
          });
        } catch (error) {
          console.error(`  ❌ Error fetching vote ${i}:`, error.message);
        }
      }
    } else {
      console.log("ℹ️  No voting records found for this address");
    }

    console.log("\n✅ Voting history test completed!");
    console.log("\n💡 If you see voting records above, the fix is working!");
    console.log(
      "   If you see 'No voting records', that's normal if the address hasn't voted yet.",
    );
  } catch (error) {
    console.error("❌ Error testing voting history:", error);
  }
}

// Run the test
testVotingHistoryFix().catch(console.error);
