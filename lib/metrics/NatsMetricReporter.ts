import "source-map-support/register";

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

import * as NATS from "node-nats-streaming";
import { ICounterValue } from "./ICounterValue";
import { IGaugeValue } from "./IGaugeValue";
import { IHistogramValue } from "./IHistogramValue";
import { IMeterValue } from "./IMeterValue";
import { ITimerValue } from "./ITimerValue";
import { MetricMessageBuilder } from "./MetricMessageBuilder";
import { NatsMetricReporterOptions } from "./NatsMetricReporterOptions";
import { NatsReportingResult } from "./NatsReportingResult";

export class NatsMetricReporter extends ScheduledMetricReporter<NatsMetricReporterOptions, NatsReportingResult> {
  /**
   * Returns a {@link MetricMessageBuilder} that builds a string for a metric.
   *
   * @static
   * @returns {MetricMessageBuilder}
   * @memberof NatsMetricReporter
   */
  public static defaultMessageBuilder(withBuckets: boolean): MetricMessageBuilder {
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
        return null;
      }

      if (!values) {
        return null;
      }

      const name = metric.getName();
      const group = metric.getGroup();

      return JSON.stringify({ name, group, timestamp, type, tags, values });
    };
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
   * Nats client used to do reporting.
   *
   * @private
   * @type {NATS.Stan}
   * @memberof NatsMetricReporter
   */
  private client: NATS.Stan;

  /**
   * Creates an instance of NatsMetricReporter.
   */
  public constructor(
    {
      clusterId,
      clientId,
      clientOptions = {},
      clock = new StdClock(),
      log = console,
      metricMessageBuilder = NatsMetricReporter.defaultMessageBuilder(true),
      minReportingTimeout = 1,
      reportInterval = 1000,
      scheduler = setInterval,
      tags = new Map(),
      unit = MILLISECOND,
    }: {
      /**
       * The ID of the cluster to connect to.
       * @type {string}
       */
      clusterId: string,
      /**
       * The ID of the client to connect to.
       * @type {string}
       */
      clientId: string,
      /**
       * Used to build the nats client.
       * @type {NATS.StanOptions}
       */
      clientOptions?: NATS.StanOptions,
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
       * Used to build the nats message for a metric.
       * @type {MetricMessageBuilder}
       */
      metricMessageBuilder?: MetricMessageBuilder,
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
      clientId,
      clientOptions,
      clock,
      clusterId,
      log,
      metricMessageBuilder,
      minReportingTimeout,
      reportInterval,
      scheduler,
      tags,
      unit,
    });
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
   * Does nothing.
   *
   * @returns {Promise<void>}
   * @memberof NatsMetricReporter
   */
  public async flushEvents(): Promise<void> {
  }

  /**
   * Starts the client.
   *
   * @memberof NatsMetricReporter
   */
  public async start(): Promise<this> {
    this.client = NATS.connect(this.options.clusterId, this.options.clientId, this.options.clientOptions);
    return new Promise((resolve, reject) => {
      this.client.on("connect", () => resolve(this));
      this.client.on("error", (reason) => reject(reason));
    });
  }

  /**
   * Stops the client.
   *
   * @memberof NatsMetricReporter
   */
  public async stop(): Promise<this> {
    await this.client.close();
    return this;
  }

  /**
   * Reports an {@link Event}.
   *
   * @param {Event} event
   * @param {string} subject
   * @param {NATS.AckHandlerCallback} callback
   * @returns {Promise<TEvent>}
   * @memberof NatsMetricReporter
   */
  public async reportEvent<TEventData, TEvent extends Event<TEventData>>(event: TEvent, subject?: string): Promise<TEvent> {
    const result = this.reportGauge(
      event,
      {
        date: event.getTime(),
        metrics: [],
        overallCtx: null,
        registry: null,
        type: "gauge",
      },
      subject,
    );

    if (result) {
      await this.handleResults(
        null,
        null,
        event.getTime(),
        "gauge",
        [{
          metric: event,
          result,
        }],
      );
    }

    return event;
  }

  /**
   * Send the messages to the Nats server.
   *
   * @protected
   * @param {MetricRegistry} registry
   * @param {Date} date
   * @param {MetricType} type
   * @param {Array<ReportingResult<any, NatsReportingResult>>} results
   * @returns {Promise<void>}
   * @memberof NatsMetricReporter
   */
  protected async handleResults(
    ctx: OverallReportContext,
    registry: MetricRegistry,
    date: Date,
    type: MetricType,
    results: Array<ReportingResult<any, NatsReportingResult>>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create a Promise for each result publication
      const promises: Array<PromiseLike<void>> = results.map((result) => {
        return new Promise((resolve, reject) => {
          this.client.publish(result.result.subject, result.result.message, (err, guid) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });

      // Once they are all resolved, return the resolution
      Promise.all(promises)
        .then(() => resolve())
        .catch((reason) => reject(reason));
    });
  }

  /**
   * Generalized reporting method of all types of metric instances.
   *
   * @protected
   * @param {Metric} metric
   * @param {ReportingContext<Metric>} ctx
   * @param {string} subject
   * @param {NATS.AckHandlerCallback} callback
   * @returns {{}}
   * @memberof NatsMetricReporter
   */
  protected reportMetric(metric: Metric, ctx: MetricSetReportContext<Metric>, subject?: string): NatsReportingResult {
    subject = subject || "DEFAULT_NATS_SUBJECT";
    const tags = this.buildTags(ctx.registry, metric);
    const message = this.options.metricMessageBuilder(ctx.registry, metric, ctx.type, ctx.date, tags);
    return { subject, message };
  }

  /**
   * Calls {@link #reportMetric} with the specified arguments.
   *
   * @protected
   * @param {(MonotoneCounter | Counter)} counter
   * @param {(ReportingContext<MonotoneCounter | Counter>)} ctx
   * @param {string} subject
   * @param {NATS.AckHandlerCallback} callback
   * @returns {{}}
   * @memberof NatsMetricReporter
   */
  protected reportCounter(counter: MonotoneCounter | Counter, ctx: MetricSetReportContext<MonotoneCounter | Counter>, subject?: string): NatsReportingResult {
    return this.reportMetric(counter, ctx, subject);
  }

  /**
   * Calls {@link #reportMetric} with the specified arguments.
   *
   * @protected
   * @param {Gauge<any>} gauge
   * @param {ReportingContext<Gauge<any>>} ctx
   * @param {string} subject
   * @param {NATS.AckHandlerCallback} callback
   * @returns {{}}
   * @memberof NatsMetricReporter
   */
  protected reportGauge(gauge: Gauge<any>, ctx: MetricSetReportContext<Gauge<any>>, subject?: string): NatsReportingResult {
    return this.reportMetric(gauge, ctx, subject);
  }

  /**
   * Calls {@link #reportMetric} with the specified arguments.
   *
   * @protected
   * @param {Histogram} histogram
   * @param {ReportingContext<Histogram>} ctx
   * @param {string} subject
   * @param {NATS.AckHandlerCallback} callback
   * @returns {{}}
   * @memberof NatsMetricReporter
   */
  protected reportHistogram(histogram: Histogram, ctx: MetricSetReportContext<Histogram>, subject?: string): NatsReportingResult {
    return this.reportMetric(histogram, ctx, subject);
  }

  /**
   * Calls {@link #reportMetric} with the specified arguments.
   *
   * @protected
   * @param {Meter} meter
   * @param {ReportingContext<Meter>} ctx
   * @param {string} subject
   * @param {NATS.AckHandlerCallback} callback
   * @returns {{}}
   * @memberof NatsMetricReporter
   */
  protected reportMeter(meter: Meter, ctx: MetricSetReportContext<Meter>, subject?: string): NatsReportingResult {
    return this.reportMetric(meter, ctx, subject);
  }

  /**
   * Calls {@link #reportMetric} with the specified arguments.
   *
   * @protected
   * @param {Timer} timer
   * @param {ReportingContext<Timer>} ctx
   * @param {string} subject
   * @param {NATS.AckHandlerCallback} callback
   * @returns {{}}
   * @memberof NatsMetricReporter
   */
  protected reportTimer(timer: Timer, ctx: MetricSetReportContext<Timer>, subject?: string): NatsReportingResult {
    return this.reportMetric(timer, ctx, subject);
  }
}
