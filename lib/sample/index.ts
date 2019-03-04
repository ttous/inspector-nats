import { Event } from "inspector-metrics";
import { NatsMetricReporter } from "../metrics";

// instanciate the Nats reporter
const reporter: NatsMetricReporter = new NatsMetricReporter({
  clusterId: "test-cluster",
  clientId: "test"
});

// start reporter
reporter.start()
  .then((reporter) => { // "start()" returns the same reporter instance, after the connection was made
    const event = new Event<{}>("test")
      .setValue({
        int: 123,
        string: "toto",
      });

    // send event
    reporter.reportEvent(event).catch((reason) => {
      console.error("Could report the event via NATS reporter.", reason);
    });

    // stop reporter
    reporter.stop().catch((reason) => {
      console.error("Could not stop the NATS reporter.", reason);
    });
  })
  .catch((reason) => {
    console.error("Could not start the NATS reporter.", reason);
  });
