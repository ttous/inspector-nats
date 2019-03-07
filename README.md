# inspector-nats

Typescript [Metrics Reporter](https://github.com/rstiller/inspector-metrics/blob/master/lib/metrics/reporter/metric-reporter.ts) for [NATS](https://nats.io/).

<p align="center">
    <a href="https://www.npmjs.org/package/inspector-nats">
        <img src="https://img.shields.io/npm/v/inspector-nats.svg" alt="NPM Version">
    </a>
    <a href="https://www.npmjs.org/package/inspector-nats">
        <img src="https://img.shields.io/npm/l/inspector-nats.svg" alt="License">
    </a>
    <a href="https://travis-ci.org/ttous/inspector-nats">
        <img src="http://img.shields.io/travis/ttous/inspector-nats/master.svg" alt="Build Status">
    </a>
    <a href="https://david-dm.org/ttous/inspector-nats">
        <img src="https://img.shields.io/david/ttous/inspector-nats.svg" alt="Dependencies Status">
    </a>
</p>

This library is made for [inspector-metrics](https://github.com/ttous/inspector-metrics) node module and is meant to be used with `typescript` / `nodejs`.

It uses [node-nats-streaming](https://github.com/nats-io/node-nats-streaming) as NATS client.

## Install

`npm install --save inspector-nats`

## Basic usage

If no `subject` is given as parameter for the `reportX` methods (`reportEvent` in the following example), it will default to `"DEFAULT_NATS_SUBJECT"`
```typescript
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
      .then((event) => {
        
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

```

## Running NATS Streaming Server locally

Refer to the [Official NATS Streaming Server documentation](https://nats.io/documentation/streaming/nats-streaming-intro/) (you can also directly go to the [installing part](https://nats.io/documentation/streaming/nats-streaming-install/)).

## Releasing / publish docs / publish package

```text
# check functionality
npm i
npm run build

# release
git commit -am "release of a.b.c"
git push
git tag va.b.c
git push --tags

# publish docs
rm -fr docs/
git branch -D gh-pages
git worktree prune
git worktree list
git worktree add -b gh-pages docs origin/gh-pages
npm run publishDocs

# publish package
npm publish
```

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
