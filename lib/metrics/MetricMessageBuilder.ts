import "source-map-support/register";

// import { Message } from "ts-nats";

import {
  Metric,
  MetricRegistry,
  MetricType,
  Tags,
} from "inspector-metrics";

/**
 * Interface for building a message for a metric.
 */
export type MetricMessageBuilder = (registry: MetricRegistry, metric: Metric, type: MetricType, date: Date, tags: Tags) => Promise<any | null>;
