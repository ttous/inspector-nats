import { Event } from "inspector-metrics";
import { NatsMetricReporter } from "../metrics";

// instance the Nats reporter
const reporter: NatsMetricReporter = new NatsMetricReporter({
  clusterId: "test-cluster",
  clientId: "test",
  // clientOptions: {
  //   url: "localhost:4222"
  // }
});

// start reporter
reporter.start()
  .then((readyReporter) => {
    const event = new Event<{}>("test")
      .setValue({
        int: 123,
        string: "toto",
      });

    // send event
    readyReporter.reportEvent(event).catch((reason) => {
      console.error("Could report the event via NATS reporter.", reason);
    });
  })
  .catch((reason) => {
    console.error("Could not start the NATS reporter.", reason);
  });

