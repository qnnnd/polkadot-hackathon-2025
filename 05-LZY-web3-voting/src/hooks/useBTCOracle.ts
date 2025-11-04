import { useReadContract, useAccount } from "wagmi";
import { formatEther, formatUnits } from "viem";
import { btcOracleAddress, btcOracleAbi } from "@/config/contracts";
import { votingContractAddress, votingContractAbi } from "@/config/contracts";

export interface CompetitorChain {
  name: string;
  priceFeed: string;
  circulatingSupply: string;
  isActive: boolean;
  lastUpdatedTime: number;
}

export interface MarketSnapshot {
  timestamp: number;
  btcMarketCap: string;
  highestCompetitorCap: string;
  winningCompetitorId: number;
  result: number; // 0: BTC_DOMINANT, 1: COMPETITOR_WIN, 2: PENDING
}

export interface VotingPeriodInfo {
  startTime: number;
  endTime: number;
  active: boolean;
  resolved: boolean;
  correctAnswerYear: number;
}

export function useBTCOracle(votingPeriodId = 1) {
  const { address } = useAccount();

  // 轮询间隔：30秒（降低查询频率）
  const POLLING_INTERVAL = 30000;

  // Get current voting period（不需要频繁刷新）
  const { data: currentPeriod } = useReadContract({
    address: btcOracleAddress,
    abi: btcOracleAbi,
    functionName: "currentVotingPeriod",
    query: {
      refetchInterval: false, // 禁用自动刷新
    },
  });

  // Get competitor count（静态数据，不需要频繁刷新）
  const { data: competitorCount } = useReadContract({
    address: btcOracleAddress,
    abi: btcOracleAbi,
    functionName: "competitorCount",
    query: {
      refetchInterval: false, // 禁用自动刷新
    },
  });

  // Get all competitors（静态数据，不需要频繁刷新）
  const { data: competitors } = useReadContract({
    address: btcOracleAddress,
    abi: btcOracleAbi,
    functionName: "getAllCompetitors",
    query: {
      refetchInterval: false, // 禁用自动刷新
    },
  });

  // Get snapshot count for voting period（每30秒刷新一次）
  const { data: snapshotCount } = useReadContract({
    address: btcOracleAddress,
    abi: btcOracleAbi,
    functionName: "getSnapshotCount",
    args: [BigInt(votingPeriodId)],
    query: {
      refetchInterval: POLLING_INTERVAL,
    },
  });

  // Get latest snapshot（每30秒刷新一次）
  const { data: latestSnapshotData } = useReadContract({
    address: btcOracleAddress,
    abi: btcOracleAbi,
    functionName: "getSnapshot",
    args: [
      BigInt(votingPeriodId),
      snapshotCount ? (snapshotCount as bigint) - 1n : 0n,
    ],
    query: {
      enabled: !!snapshotCount && (snapshotCount as bigint) > 0n,
      refetchInterval: POLLING_INTERVAL,
    },
  });

  // Get voting period info（每30秒刷新一次）
  const { data: votingPeriodInfo } = useReadContract({
    address: votingContractAddress,
    abi: votingContractAbi,
    functionName: "votingPeriods",
    args: [BigInt(votingPeriodId)],
    query: {
      refetchInterval: POLLING_INTERVAL,
    },
  });

  // Get last snapshot time（每30秒刷新一次）
  const { data: lastSnapshotTime } = useReadContract({
    address: btcOracleAddress,
    abi: btcOracleAbi,
    functionName: "lastSnapshotTime",
    args: [BigInt(votingPeriodId)],
    query: {
      refetchInterval: POLLING_INTERVAL,
    },
  });

  // Get BTC price（每60秒刷新一次，价格变化不需要太频繁）
  const { data: btcPrice } = useReadContract({
    address: btcOracleAddress,
    abi: btcOracleAbi,
    functionName: "getBTCPrice",
    query: {
      refetchInterval: 60000, // 60秒
    },
  });

  // Can take snapshot（每30秒刷新一次）
  const { data: canTakeSnapshot } = useReadContract({
    address: btcOracleAddress,
    abi: btcOracleAbi,
    functionName: "canTakeSnapshot",
    args: [BigInt(votingPeriodId)],
    query: {
      refetchInterval: POLLING_INTERVAL,
    },
  });

  // Parse competitors data
  const parsedCompetitors: CompetitorChain[] = competitors
    ? (competitors as unknown[]).map((comp: unknown) => {
        const c = comp as {
          name: string;
          priceFeed: string;
          circulatingSupply: bigint;
          isActive: boolean;
          lastUpdatedTime: bigint;
        };
        return {
          name: c.name,
          priceFeed: c.priceFeed,
          circulatingSupply: formatEther(c.circulatingSupply),
          isActive: c.isActive,
          lastUpdatedTime: Number(c.lastUpdatedTime),
        };
      })
    : [];

  // Parse latest snapshot
  const parsedSnapshot: MarketSnapshot | null = latestSnapshotData
    ? (() => {
        const snapshot = latestSnapshotData as unknown as [
          bigint,
          bigint,
          bigint,
          bigint,
          number,
        ];
        return {
          timestamp: Number(snapshot[0]),
          btcMarketCap: formatEther(snapshot[1]),
          highestCompetitorCap: formatEther(snapshot[2]),
          winningCompetitorId: Number(snapshot[3]),
          result: snapshot[4],
        };
      })()
    : null;

  // Parse voting period info
  const parsedVotingPeriod: VotingPeriodInfo | null = votingPeriodInfo
    ? (() => {
        const period = votingPeriodInfo as unknown as [
          bigint,
          bigint,
          boolean,
          boolean,
          bigint,
        ];
        return {
          startTime: Number(period[0]),
          endTime: Number(period[1]),
          active: period[2],
          resolved: period[3],
          correctAnswerYear: Number(period[4]),
        };
      })()
    : null;

  // Calculate next snapshot time
  const nextSnapshotTime = lastSnapshotTime
    ? Number(lastSnapshotTime as bigint) + 24 * 60 * 60
    : null;

  return {
    currentPeriod: currentPeriod ? Number(currentPeriod as bigint) : null,
    competitorCount: competitorCount ? Number(competitorCount as bigint) : 0,
    competitors: parsedCompetitors,
    snapshotCount: snapshotCount ? Number(snapshotCount as bigint) : 0,
    latestSnapshot: parsedSnapshot,
    votingPeriod: parsedVotingPeriod,
    lastSnapshotTime: lastSnapshotTime
      ? Number(lastSnapshotTime as bigint)
      : null,
    nextSnapshotTime,
    btcPrice: btcPrice ? formatUnits(btcPrice as bigint, 8) : null,
    canTakeSnapshot: !!canTakeSnapshot,
    isConnected: !!address,
  };
}
