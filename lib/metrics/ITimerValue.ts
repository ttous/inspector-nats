import "source-map-support/register";

import { Buckets } from "inspector-metrics";

/**
 * Interface used when extracting values from a {@link Timer}.
 */
export interface ITimerValue {
  buckets?: Buckets;
  buckets_counts: Map<number, number>;
  count: number;
  m15_rate: number;
  m1_rate: number;
  m5_rate: number;
  max: number;
  mean: number;
  mean_rate: number;
  min: number;
  p50: number;
  p75: number;
  p95: number;
  p98: number;
  p99: number;
  p999: number;
  stddev: number;
}
