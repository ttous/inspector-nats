import "source-map-support/register";

import { Logger, ScheduledMetricReporterOptions } from "inspector-metrics";

import { MetricMessageBuilder } from "./MetricMessageBuilder";
import { RoutingKeyDeterminator } from "./RoutingKeyDeterminator";

/**
 * Options for {@link NatsMetricReporter}.
 *
 * @export
 * @interface NatsMetricReporterOptions
 * @extends {ScheduledMetricReporterOptions}
 */
export interface NatsMetricReporterOptions extends ScheduledMetricReporterOptions {
  /**
   * Logger instance used to report errors.
   *
   * @type {Logger}
   * @memberof NatsMetricReporterOptions
   */
  log: Logger;

  /**
   * Used to build the Nats message for a metric.
   * @type {MetricMessageBuilder}
   */
  metricMessageBuilder: MetricMessageBuilder;

  /**
   * Used to determine the routing key for a given metric.
   * @type {RoutingKeyDeterminator}
   */
  routingKeyDeterminator: RoutingKeyDeterminator;
}
