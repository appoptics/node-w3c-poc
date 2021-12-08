# ![Node](./images/nodejs-logo.png) Node W3C Trace Context - PoC Server Setup

The PoC server setup creates a stack of 60 instrumented servers inside a docker container. 

A third of the servers are instrumented with the  "Legacy" AppOptics Node Agent (L), a third of the servers are instrumented with the W3C Trace Context enabled AppOptics Node Agent (A) and a third are instrumented using the Open Telemetry Node Agent (O). The AppOptics agents report to the AppOptics backend while the Open Telemetry agent reports to a local Zipkin instance. 

The setup allows to interactively bounce requests between the servers using the request path to create complex tracing scenarios.

## Setup

1. Clone the repo
2. Create a `.env` file at the root of the project with the following keys:

  * required: `APPOPTICS_SERVICE_KEY={api-key}:{service-name}`
  * optional: `APPOPTICS_COLLECTOR=collector-stg.appoptics.com` or any other collector.
  * optional (example): `APPOPTICS_TRUSTEDPATH=__cert/star.my.domain.tld.issuer-crt`

3. From the root of the project ` ./start.sh` - this will start the servers and open a shell prompt to the container.


## Use

Chains of requests are defined using the path and the three Letters `A`, `O`, `L`, `S`.

Chains originating at port 3000 must start with 'A'.

Chains originating at port 3100 must start with 'O'.

Chains originating at port 3200 must start with 'L'.

Chains originating at port 3300 must start with 'S'.

### From Command Line

```
curl -i -X GET http://localhost:3000/AAA
curl -i -X GET http://localhost:3100/OAO
curl -i -X GET http://localhost:3200/LAOAL
```

### From Browser

```
http://localhost:3000/AAA
http://localhost:3100/OAO
http://localhost:3200/LAOAL
http://localhost:3300/SOS
```

## Traces

### UI

Traces will be available for viewing at:
* https://my-stg.appoptics.com/ service name (`w3c-poc`)
* http://localhost:9411/zipkin/

### Logs

Request log for each server stack of instrumented servers is at the root of the respective stack.
```
tail -F appoptics-w3c/req.log
tail -F otel/req.log
tail -F appoptics-legacy/req.log
tail -F solarwinds/req.log
```
Logs are deleted each time the servers start.

## Using in the Node Agent Dev Environment

The [Node Agent](https://github.com/appoptics/appoptics-apm-node) dev environment mounts an `instrumented` directory inside the container.

To run this PoC from inside the dev container follow the steps below. Note that due to port conflicts the PoC can run either as standalone or in the dev container, but not in both at the same time.

1. Clone this repo into the `instrumented` directory
2. Start the dev environment from the root of the agent repo: `npm run dev`
3. To open another shell, run `docker exec -it -w /usr/src/instrumented dev-agent bash -c "unset APPOPTICS_REPORTER && export APPOPTICS_COLLECTOR=collector-stg.appoptics.com && bash"`
4. In a new shell do for each:
  - `cd w3c-poc/appoptics-w3c`, `npm install` and `npm start` 
  - `cd w3c-poc/appoptics-legacy`, `npm install` and `npm start` 
  - `cd w3c-poc/otel`, `npm install` and `npm start` 
  - `cd w3c-poc/solarwinds`, `npm install` and `npm start`
5. If zipkin is not running - start it from **outside the dev container** - `docker run --rm -d -p 9411:9411 --name zipkin openzipkin/zipkin`
6. Traces will be available for viewing with service name `ao-node-test`

## Troubleshooting

* When failures happen during the start sequence, containers and ports might be "left hanging". Use `docker kill $(docker ps -a)` to forcefully clean the environment. 
* To clear a hanging port use `lsof -t -i tcp:{port} | xargs kill` (e.g. `lsof -t -i tcp:3200 | xargs kill`). Prepare for Docker desktop crashes....
* To restart a stack of servers (if failed) open a new shell `docker exec -it {container id} bash`. In the server directory `ctrl c` to stop (if needed) `npm start` to start.

###### Fabriqué au Canada : Made in Canada 🇨🇦
