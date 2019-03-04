import { Event } from "inspector-metrics";
import { NatsMetricReporter } from "../metrics";

// instance the Nats reporter
const reporter: NatsMetricReporter = new NatsMetricReporter({
  clusterId: "test-cluster",
  clientId: "test",
  clientOptions: {
    url: "localhost:4222"
  }
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
