import "source-map-support/register";

import { NatsTopologyBuilder } from "./NatsTopologyBuilder";

import { Connection } from "Nats-ts";

/**
 * Helper class for creating {@link NatsTopologyBuilder}.
 *
 * @export
 */
export class NatsTopologyHelper {
  /**
   * Returns a {@link NatsTopologyBuilder} that builds an Nats topology with a single queue.
   * The queue is returned as the target.
   *
   * @static
   * @returns {NatsTopologyBuilder}
   * @memberof NatsTopologyHelper
   */
  public static queue(connection: string, queue: string): NatsTopologyBuilder {
    return () => {
      const NatsConnection = new Connection(connection);
      const NatsQueue = NatsConnection.declareQueue(queue);

      return NatsQueue;
    };
  }

  /**
   * Returns a {@link NatsTopologyBuilder} that builds an Nats topology with a single queue and a single exchange bound together.
   * The exchange is returned as the target.
   *
   * @static
   * @returns {NatsTopologyBuilder}
   * @memberof NatsTopologyHelper
   */
  public static exchange(connection: string, queue: string, exchange: string): NatsTopologyBuilder {
    return () => {
      const NatsConnection = new Connection(connection);
      const NatsQueue = NatsConnection.declareQueue(queue);
      const NatsExchange = NatsConnection.declareExchange(exchange);

      NatsQueue.bind(NatsExchange);

      return NatsExchange;
    };
  }
}
