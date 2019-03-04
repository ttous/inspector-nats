import "source-map-support/register";

import { Buckets } from "inspector-metrics";

/**
 * Interface used when extracting values from a {@link Histogram}.
 */
export interface IHistogramValue {
  buckets?: Buckets;
  buckets_counts: Map<number, number>;
  count: number;
  max: number;
  mean: number;
  min: number;
  p50: number;
  p75: number;
  p95: number;
  p98: number;
  p99: number;
  p999: number;
  stddev: number;
}
