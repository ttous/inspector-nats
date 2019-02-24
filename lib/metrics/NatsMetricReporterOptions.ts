import "source-map-support/register";

import { Logger, ScheduledMetricReporterOptions } from "inspector-metrics";

import { NatsDataExtractor } from "./NatsDataExtractor";
import { NatsSubjectDeterminator } from "./NatsSubjectDeterminator";

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
   * Used to build the data for a given metric.
   * @type {NatsDataExtractor}
   */
  dataExtractor: NatsDataExtractor;

  /**
   * Used to determine the subject for a given metric.
   * @type {NatsSubjectDeterminator}
   */
  subjectDeterminator: NatsSubjectDeterminator;
}
