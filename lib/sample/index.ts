import { Event } from "inspector-metrics";
import { connect } from "ts-nats";
import { NatsMetricReporter } from "../metrics";

connect({ servers: ["nats://demo.nats.io:4222", "tls://demo.nats.io:4443"] })
  .then((client) => {
    // instanciate the Nats reporter
    const reporter = new NatsMetricReporter({ client });

    // start reporter
    reporter.start().then((r) => {
      // create an event
      const event = new Event<{}>("test")
        .setValue({
          int: 123,
          string: "toto",
        });

      // report event through the reporter
      r.reportEvent(event);
    });
  });
