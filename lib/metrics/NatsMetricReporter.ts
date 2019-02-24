import "source-map-support/register";

import { Client } from "ts-nats";

import {
  Clock,
  Counter,
  Event,
  Gauge,
  Histogram,
  Logger,
  Meter,
  Metric,
  MetricRegistry,
  MetricSetReportContext,
  MetricType,
  MILLISECOND,
  MonotoneCounter,
  OverallReportContext,
  ReportingResult,
  ScheduledMetricReporter,
  Scheduler,
  StdClock,
  Tags,
  Timer,
  TimeUnit,
} from "inspector-metrics";

import { ICounterValue } from "./ICounterValue";
import { IGaugeValue } from "./IGaugeValue";
import { IHistogramValue } from "./IHistogramValue";
import { IMeterValue } from "./IMeterValue";
import { ITimerValue } from "./ITimerValue";
import { NatsDataExtractor } from "./NatsDataExtractor";
import { NatsMetricReporterOptions } from "./NatsMetricReporterOptions";
import { NatsReportingResult } from "./NatsReportingResult";
import { NatsSubjectDeterminator } from "./NatsSubjectDeterminator";

export class NatsMetricReporter extends ScheduledMetricReporter<NatsMetricReporterOptions, NatsReportingResult> {
  /**
   * Returns a {@link MetricMessageBuilder} that builds an Nats.Message for a metric.
   *
   * @static
   * @returns {NatsDataExtractor}
   * @memberof NatsMetricReporter
   */
  public static defaultMessageBuilder(withBuckets: boolean): NatsDataExtractor {
    return (registry: MetricRegistry, metric: Metric, type: MetricType, timestamp: Date, tags: Tags) => {
      let values = null;

      if (metric instanceof MonotoneCounter) {
        values = NatsMetricReporter.getMonotoneCounterValue(metric);
      } else if (metric instanceof Counter) {
        values = NatsMetricReporter.getCounterValue(metric);
      } else if (metric instanceof Histogram) {
        values = NatsMetricReporter.getHistogramValue(metric, withBuckets);
      } else if (metric instanceof Meter) {
        values = NatsMetricReporter.getMeterValue(metric);
      } else if (metric instanceof Timer) {
        values = NatsMetricReporter.getTimerValue(metric, withBuckets);
      } else if (MetricRegistry.isGauge<any>(metric)) {
        values = NatsMetricReporter.getGaugeValue(metric);
      } else {
        return Promise.resolve(null);
      }

      if (!values) {
        return null;
      }

      const name = metric.getName();
      const group = metric.getGroup();

      return Promise.resolve({ name, group, timestamp, type, tags, values });
    };
  }

  /**
   * Returns a {@link RoutingKeyDeterminator} that determines the routing key for a given metric.
   *
   * @static
   * @returns {NatsSubjectDeterminator}
   * @memberof NatsMetricReporter
   */
  public static defaultSubjectDeterminator(): NatsSubjectDeterminator {
    return async (registry: MetricRegistry, metric: Metric, type: MetricType, timestamp: Date, tags: Tags) => "inspector-nats";
  }

  /**
   * Gets the values for the specified monotone counter metric.
   *
   * @static
   * @param {MonotoneCounter} counter
   * @returns {ICounterValue}
   * @memberof NatsMetricReporter
   */
  public static getMonotoneCounterValue(counter: MonotoneCounter): ICounterValue {
    const count = counter.getCount();

    return { count };
  }

  /**
   * Gets the values for the specified counter metric.
   *
   * @static
   * @param {Counter} counter
   * @returns {ICounterValue}
   * @memberof NatsMetricReporter
   */
  public static getCounterValue(counter: Counter): ICounterValue {
    const count = counter.getCount();

    return { count };
  }

  /**
   * Gets the values for the specified {Gauge} metric.
   *
   * @static
   * @param {Gauge<T>} gauge
   * @returns {IGaugeValue<T>}
   * @memberof NatsMetricReporter
   */
  public static getGaugeValue<T>(gauge: Gauge<T>): IGaugeValue<T> {
    const value = gauge.getValue();

    return { value };
  }

  /**
   * Gets the values for the specified {Histogram} metric.
   *
   * @static
   * @param {Histogram} histogram
   * @returns {IHistogramValue}
   * @memberof NatsMetricReporter
   */
  public static getHistogramValue(histogram: Histogram, withBuckets: boolean): IHistogramValue {
    const count = histogram.getCount();

    const snapshot = histogram.getSnapshot();

    return {
      buckets: withBuckets ? histogram.getBuckets() : undefined,
      buckets_counts: histogram.getCounts(),
      count,
      max: NatsMetricReporter.getNumber(snapshot.getMax()),
      mean: NatsMetricReporter.getNumber(snapshot.getMean()),
      min: NatsMetricReporter.getNumber(snapshot.getMin()),
      p50: NatsMetricReporter.getNumber(snapshot.getMedian()),
      p75: NatsMetricReporter.getNumber(snapshot.get75thPercentile()),
      p95: NatsMetricReporter.getNumber(snapshot.get95thPercentile()),
      p98: NatsMetricReporter.getNumber(snapshot.get98thPercentile()),
      p99: NatsMetricReporter.getNumber(snapshot.get99thPercentile()),
      p999: NatsMetricReporter.getNumber(snapshot.get999thPercentile()),
      stddev: NatsMetricReporter.getNumber(snapshot.getStdDev()),
    };
  }

  /**
   * Gets the values for the specified {Meter} metric.
   *
   * @static
   * @param {Meter} meter
   * @returns {IMeterValue}
   * @memberof NatsMetricReporter
   */
  public static getMeterValue(meter: Meter): IMeterValue {
    const count = meter.getCount();

    return {
      count,
      m15_rate: NatsMetricReporter.getNumber(meter.get15MinuteRate()),
      m1_rate: NatsMetricReporter.getNumber(meter.get1MinuteRate()),
      m5_rate: NatsMetricReporter.getNumber(meter.get5MinuteRate()),
      mean_rate: NatsMetricReporter.getNumber(meter.getMeanRate()),
    };
  }

  /**
   * Gets the values for the specified {Timer} metric.
   *
   * @static
   * @param {Timer} timer
   * @returns {ITimerValue}
   * @memberof NatsMetricReporter
   */
  public static getTimerValue(timer: Timer, withBuckets: boolean): ITimerValue {
    const count = timer.getCount();

    const snapshot = timer.getSnapshot();

    return {
      buckets: withBuckets ? timer.getBuckets() : undefined,
      buckets_counts: timer.getCounts(),
      count,
      m15_rate: NatsMetricReporter.getNumber(timer.get15MinuteRate()),
      m1_rate: NatsMetricReporter.getNumber(timer.get1MinuteRate()),
      m5_rate: NatsMetricReporter.getNumber(timer.get5MinuteRate()),
      max: NatsMetricReporter.getNumber(snapshot.getMax()),
      mean: NatsMetricReporter.getNumber(snapshot.getMean()),
      mean_rate: NatsMetricReporter.getNumber(timer.getMeanRate()),
      min: NatsMetricReporter.getNumber(snapshot.getMin()),
      p50: NatsMetricReporter.getNumber(snapshot.getMedian()),
      p75: NatsMetricReporter.getNumber(snapshot.get75thPercentile()),
      p95: NatsMetricReporter.getNumber(snapshot.get95thPercentile()),
      p98: NatsMetricReporter.getNumber(snapshot.get98thPercentile()),
      p99: NatsMetricReporter.getNumber(snapshot.get99thPercentile()),
      p999: NatsMetricReporter.getNumber(snapshot.get999thPercentile()),
      stddev: NatsMetricReporter.getNumber(snapshot.getStdDev()),
    };
  }

  /**
   * Either gets 0 or the specifed value.
   *
   * @private
   * @param {number} value
   * @returns {number}
   * @memberof NatsMetricReporter
   */
  private static getNumber(value: number): number {
    if (isNaN(value)) {
      return 0;
    }
    return value;
  }

  /**
   * Nats target used to do reporting.
   *
   * @private
   * @type {Nats.Queue | Nats.Exchange}
   * @memberof NatsMetricReporter
   */
  private client: Client;

  /**
   * Creates an instance of NatsMetricReporter.
   */
  public constructor(
    {
      client,
      clock = new StdClock(),
      log = console,
      metricMessageBuilder = NatsMetricReporter.defaultMessageBuilder(true),
      minReportingTimeout = 1,
      reportInterval = 1000,
      subjectDeterminator = NatsMetricReporter.defaultSubjectDeterminator(),
      scheduler = setInterval,
      tags = new Map(),
      unit = MILLISECOND,
    }: {
      /**
       * Underlying NATS client.
       * @type {Client}
       */
      client: Client;
      /**
       * The clock instance used determine the current time.
       * @type {Clock}
       */
      clock?: Clock;
      /**
       * The logger instance used to report metrics.
       * @type {Logger}
       */
      log?: Logger,
      /**
       * Used to build the Nats message for a metric.
       * @type {NatsDataExtractor}
       */
      metricMessageBuilder?: NatsDataExtractor,
      /**
       * The timeout in which a metrics gets reported wether it's value has changed or not.
       * @type {number}
       */
      minReportingTimeout?: number;
      /**
       * Reporting interval in the time-unit of {@link #unit}.
       * @type {number}
       */
      reportInterval?: number;
      /**
       * The scheduler function used to trigger reporting.
       * @type {Scheduler}
       */
      scheduler?: Scheduler;
      /**
       * Used to determine the subject for a given metric.
       * @type {NatsSubjectDeterminator}
       */
      subjectDeterminator?: NatsSubjectDeterminator,
      /**
       * Common tags for this reporter instance.
       * @type {Map<string, string>}
       */
      tags?: Map<string, string>;
      /**
       * The time-unit of the reporting interval.
       * @type {TimeUnit}
       */
      unit?: TimeUnit;
    }) {
    super({
      clock,
      log,
      metricMessageBuilder,
      minReportingTimeout,
      reportInterval,
      scheduler,
      subjectDeterminator,
      tags,
      unit,
    });

    this.client = client;
  }

  /**
   * Gets the logger instance.
   *
   * @returns {Logger}
   * @memberof NatsMetricReporter
   */
  public getLog(): Logger {
    return this.options.log;
  }

  /**
   * Sets the logger instance.
   *
   * @param {Logger} log
   * @memberof NatsMetricReporter
   */
  public setLog(log: Logger): void {
    this.options.log = log;
  }

  /**
   * Reports an {@link Event}.
   *
   * @param {Event} event
   * @returns {Promise<TEvent>}
   * @memberof NatsMetricReporter
   */
  public async reportEvent<TEventData, TEvent extends Event<TEventData>>(event: TEvent): Promise<TEvent> {
    const result = this.reportGauge(event, {
      date: event.getTime(),
      metrics: [],
      overallCtx: null,
      registry: null,
      type: "gauge",
    });

    if (result) {
      await this.handleResults(null, null, event.getTime(), "gauge", [{
        metric: event,
        result,
      }]);
    }

    return event;
  }

  /**
   * Does nothing
   *
   * @returns {Promise<void>}
   * @memberof NatsMetricReporter
   */
  public async flushEvents(): Promise<void> {
  }

  /**
   * Send the messages in the target Nats exchange.
   *
   * @protected
   * @param {MetricRegistry} registry
   * @param {Date} date
   * @param {MetricType} type
   * @param {Array<ReportingResult<any, any[]>>} results
   * @returns {Promise<void>}
   * @memberof NatsMetricReporter
   */
  protected handleResults(ctx: OverallReportContext, registry: MetricRegistry, date: Date, type: MetricType, results: Array<ReportingResult<any, NatsReportingResult>>): Promise<void> {
    return Promise.all(
      results
        .map((result) => {
          return Promise.all([result.result.data, result.result.subject])
            .then((message) => {
              this.client.publish(message[1], message[0]);
            });
        }))
      .then(() => { });
  }

  /**
   * Generalized reporting method of all types of metric instances.
   * Builds the index configuration document and the metric document.
   *
   * @protected
   * @param {Metric} metric
   * @param {ReportingContext<Metric>} ctx
   * @returns {{}}
   * @memberof NatsMetricReporter
   */
  protected reportMetric(metric: Metric, ctx: MetricSetReportContext<Metric>): NatsReportingResult {
    const tags = this.buildTags(ctx.registry, metric);
    const subject = this.options.subjectDeterminator(ctx.registry, metric, ctx.type, ctx.date, tags);
    const data = this.options.metricMessageBuilder(ctx.registry, metric, ctx.type, ctx.date, tags);

    return { subject, data };
  }

  /**
   * Calls {@link #reportMetric} with the specified arguments.
   *
   * @protected
   * @param {(MonotoneCounter | Counter)} counter
   * @param {(ReportingContext<MonotoneCounter | Counter>)} ctx
   * @returns {{}}
   * @memberof NatsMetricReporter
   */
  protected reportCounter(counter: MonotoneCounter | Counter, ctx: MetricSetReportContext<MonotoneCounter | Counter>): NatsReportingResult {
    return this.reportMetric(counter, ctx);
  }

  /**
   * Calls {@link #reportMetric} with the specified arguments.
   *
   * @protected
   * @param {Gauge<T>} gauge
   * @param {ReportingContext<Gauge<T>>} ctx
   * @returns {{}}
   * @memberof NatsMetricReporter
   */
  protected reportGauge<T>(gauge: Gauge<T>, ctx: MetricSetReportContext<Gauge<T>>): NatsReportingResult {
    return this.reportMetric(gauge, ctx);
  }

  /**
   * Calls {@link #reportMetric} with the specified arguments.
   *
   * @protected
   * @param {Histogram} histogram
   * @param {ReportingContext<Histogram>} ctx
   * @returns {{}}
   * @memberof NatsMetricReporter
   */
  protected reportHistogram(histogram: Histogram, ctx: MetricSetReportContext<Histogram>): NatsReportingResult {
    return this.reportMetric(histogram, ctx);
  }

  /**
   * Calls {@link #reportMetric} with the specified arguments.
   *
   * @protected
   * @param {Meter} meter
   * @param {ReportingContext<Meter>} ctx
   * @returns {{}}
   * @memberof NatsMetricReporter
   */
  protected reportMeter(meter: Meter, ctx: MetricSetReportContext<Meter>): NatsReportingResult {
    return this.reportMetric(meter, ctx);
  }

  /**
   * Calls {@link #reportMetric} with the specified arguments.
   *
   * @protected
   * @param {Timer} timer
   * @param {ReportingContext<Timer>} ctx
   * @returns {{}}
   * @memberof NatsMetricReporter
   */
  protected reportTimer(timer: Timer, ctx: MetricSetReportContext<Timer>): NatsReportingResult {
    return this.reportMetric(timer, ctx);
  }
}
