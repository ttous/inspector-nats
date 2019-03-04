import "source-map-support/register";

/**
 * Interface used when extracting values from a {@link Gauge}.
 */
export interface IGaugeValue<T> {
  value: T;
}
