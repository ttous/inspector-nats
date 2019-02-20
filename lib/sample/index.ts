import { Event } from "inspector-metrics";
import { NatsMetricReporter, NatsTopologyHelper } from "../metrics";

// instance the Nats reporter
const reporter: NatsMetricReporter = new NatsMetricReporter({
  NatsTopologyBuilder: NatsTopologyHelper.queue("Nats://localhost", "queue"),
});

// start reporter
reporter.start().then((r) => {
  const event = new Event<{}>("test")
    .setValue({
      int: 123,
      string: "toto",
    });

  // send event
  r.reportEvent(event);
});
