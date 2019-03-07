import { Event } from "inspector-metrics";
import { NatsMetricReporter } from "../metrics";

// instanciate the Nats reporter
const reporter: NatsMetricReporter = new NatsMetricReporter({
  clientId: "test",
  clusterId: "test-cluster",
});

// start reporter
reporter.start()
  .then((connectedReporter) => { // "start()" returns the same reporter instance, after the connection was made
    const event = new Event<{}>("test")
      .setValue({
        int: 123,
        string: "toto",
      });

    // send event
    connectedReporter.reportEvent(event)
      .then((returnedEvent) => {

        // perhaps do more things here

        // stop reporter
        connectedReporter.stop().catch((reason) => {
          // stop connection error handling
        });
      })
      .catch((reason) => {
        // report error handling
      });
  })
  .catch((reason) => {
    // start connection error handling
  });
