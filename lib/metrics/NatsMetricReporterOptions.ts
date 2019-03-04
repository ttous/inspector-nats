import "source-map-support/register";

import { Logger, ScheduledMetricReporterOptions } from "inspector-metrics";
import { MetricMessageBuilder } from "./MetricMessageBuilder";

import { StanOptions } from "node-nats-streaming";

/**
 * Options for {@link NatsMetricReporter}.
 *
 * @export
 * @interface NatsMetricReporterOptions
 * @extends {ScheduledMetricReporterOptions}
 */
export interface NatsMetricReporterOptions extends ScheduledMetricReporterOptions {
  /**
   * Nats cluster ID.
   *
   * @type {string}
   * @memberof ElasticsearchMetricReporterOption
   */
  readonly clusterId: string;
  /**
   * Nats client ID.
   *
   * @type {string}
   * @memberof ElasticsearchMetricReporterOption
   */
  readonly clientId: string;
  /**
   * Nats client options.
   *
   * @type {StanOptions}
   * @memberof ElasticsearchMetricReporterOption
   */
  readonly clientOptions: StanOptions;
  /**
   * Logger instance used to report errors.
   *
   * @type {Logger}
   * @memberof NatsMetricReporterOptions
   */
  log: Logger;

  /**
   * Used to build the nats message for a metric.
   * @type {MetricMessageBuilder}
   */
  metricMessageBuilder: MetricMessageBuilder;
}
