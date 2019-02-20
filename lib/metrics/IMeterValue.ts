import "source-map-support/register";

/**
 * Interface used when extracting values from a {@link Meter}.
 */
export interface IMeterValue {
  count: number;
  m15_rate: number;
  m1_rate: number;
  m5_rate: number;
  mean_rate: number;
}
