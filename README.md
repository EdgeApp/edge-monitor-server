# edge-monitor-server

This server monitors various infrasture utilized by the Edge platform.

## Setup

Run `yarn` then edit the `config.json` created

`yarn start` to start the monitoring engines

### Manage server using `pm2`

First, install pm2 to run at startup:

```sh
yarn global add pm2
pm2 startup # Then do what it says
```

Next, tell pm2 how to run the server script:

```sh
# install:
pm2 start pm2.json
pm2 save

# check status:
pm2 monit
tail -f /var/log/pm2/monitorEngine.log

# manage:
pm2 restart monitorEngine
pm2 reload monitorEngine
pm2 stop monitorEngine
```

### Updating

To update the code running on the production server, use the following procedure:

```sh
git pull
yarn
yarn prepare
pm2 restart all
```

Each deployment should come with its own version bump, changelog update, and git tag.

## Usage

The monitor server runs a continuous loop that tests your configured services at regular intervals. It works by:

1. **Loading test fixtures** from CouchDB that define what to monitor
2. **Executing plugins** that perform the actual health checks (HTTP requests, response validation)
3. **Alerting via Slack** when tests fail

### Architecture

- **Engine** (`yarn start:engine`) - The monitoring daemon that runs tests continuously
- **API** (`yarn start:api`) - Optional HTTP server for health checks and future management endpoints

### Adding Monitors

To monitor a new service, create a **fixture** that specifies:
- The servers/endpoints to test
- The API calls to make
- The expected responses

Fixtures are JSON documents stored in CouchDB's `monitor_fixtures` database. The `fixtures/` directory contains template files that seed the database on startup—these serve as version-controlled defaults that get synced to CouchDB when the server initializes. You can also modify fixtures directly in CouchDB without redeploying.

For detailed instructions on setting up monitoring, see the [Monitoring Setup Guide](docs/monitoring-setup.md).
