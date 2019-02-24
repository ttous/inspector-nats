import "source-map-support/register";

import { Metric, MetricRegistry, MetricType, Tags } from "inspector-metrics";

/**
 * Interface for determining Nats subject from a given metric.
 */
export type NatsSubjectDeterminator = (registry: MetricRegistry, metric: Metric, type: MetricType, date: Date, tags: Tags) => Promise<string>;
