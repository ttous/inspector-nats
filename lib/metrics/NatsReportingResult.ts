import "source-map-support/register";

import { Message } from "Nats-ts";

export interface NatsReportingResult {
  routingKey: string | undefined;
  message: Message | null;
}
