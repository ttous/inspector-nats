import "source-map-support/register";

// import { Message } from "Nats-ts";

export interface NatsReportingResult {
  subject: Promise<string>;
  data: Promise<any | undefined>;
}
