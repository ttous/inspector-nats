import "source-map-support/register";

import { Metric, MetricRegistry, MetricType, Tags } from "inspector-metrics";

/**
 * Interface for determining Nats routing key from a given metric.
 */
export type RoutingKeyDeterminator = (registry: MetricRegistry, metric: Metric, type: MetricType, date: Date, tags: Tags) => string | undefined;
