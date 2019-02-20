import "source-map-support/register";

import { Exchange, Queue } from "Nats-ts";

/**
 * Interface for building the underlying Nats topology.
 */
export type NatsTopologyBuilder = () => Queue | Exchange;
