# Monitoring Setup Guide

This guide explains how to configure monitoring for your services and servers using the Edge Monitor Server.

## How It Works

The monitor engine runs in a continuous loop that:

1. Fetches all test fixtures from CouchDB
2. Checks if each fixture is due to run based on its `runFrequencyMins`
3. Executes the fixture using its associated plugin
4. Sends Slack alerts if any tests fail
5. Sleeps briefly, then repeats

## Adding Monitoring Fixtures

Monitoring is configured via test fixtures stored in CouchDB. Each fixture defines:
- Which plugin to use for testing
- How frequently to run tests
- The servers and API calls to monitor

### Fixture Structure

Create a JSON fixture file in the `fixtures/` directory:

```json
{
  "_id": "myServiceName",
  "pluginId": "fetchPlugin",
  "runFrequencyMins": 15,
  "data": {
    "clusters": [
      {
        "servers": [
          "https://my-server1.example.com",
          "https://my-server2.example.com"
        ],
        "apiCalls": [
          {
            "testName": "Health Check",
            "method": "GET",
            "path": "/health",
            "expectThrow": false,
            "headers": {},
            "body": null,
            "result": {
              "status": "ok"
            }
          }
        ]
      }
    ]
  }
}
```

### Fixture Fields

| Field | Description |
|-------|-------------|
| `_id` | CouchDB document ID for the fixture |
| `pluginId` | The plugin to use |
| `runFrequencyMins` | How often to run tests (in minutes) |
| `data.clusters` | Array of server clusters to monitor |
| `clusters[].servers` | Array of server URLs to test |
| `clusters[].apiCalls` | Array of API calls to make against each server |

### API Call Options

| Field | Default | Description |
|-------|---------|-------------|
| `testName` | - | Optional descriptive name for the test |
| `method` | `GET` | HTTP method (`GET` or `POST`) |
| `path` | `/v1/api/endpoint` | API endpoint path |
| `expectThrow` | `false` | Set `true` if the call should fail |
| `headers` | `{}` | Custom headers to include |
| `body` | `null` | Request body for POST requests |
| `result` | - | Expected response (partial match) |

### Registering a Fixture (Optional)

Registering a fixture as a template is **optional**. You can add fixtures directly to the `monitor_fixtures` database in CouchDB without this step—the engine will pick them up automatically.

However, registering a fixture ensures it persists across database resets and is version-controlled with your code. This is recommended for core infrastructure monitors that should always exist.

To register a fixture as a template:

1. Add your fixture JSON file to `fixtures/`

2. Import it in `src/db/dbTestFixtures.ts`:

   ```typescript
   import myService from '../../fixtures/myService.json'
   ```

3. Add it to the `templates` in `dbTestFixturesSetup`:

   ```typescript
   export const dbTestFixturesSetup: DatabaseSetup = {
     name: 'monitor_fixtures',
     templates: {
       ratesServer,
       infoServer,
       loginServer,
       myService  // Add here
     }
   }
   ```

4. Restart the monitor engine

## Response Matching

The `result` field performs a **deep partial match**. The actual API response must contain all keys and values specified in `result`, but may include additional fields. This allows you to verify critical fields without asserting the entire response structure.

### Example

If your API returns:

```json
{
  "status": "ok",
  "version": "1.2.3",
  "timestamp": 1703347200
}
```

You can verify just the status by setting `result` to:

```json
{
  "status": "ok"
}
```

## Slack Notifications

When tests fail, alerts are sent to the configured Slack webhooks. Configure these in `config.json`:

```json
{
  "slackWebhookLoggingUrl": "https://hooks.slack.com/services/...",
  "slackWebhookStatusUrl": "https://hooks.slack.com/services/..."
}
```

- `slackWebhookLoggingUrl` - Used for general logging
- `slackWebhookStatusUrl` - Used for test failure notifications

## Existing Fixtures

The server comes with pre-configured fixtures for Edge infrastructure:

| Fixture | Description | Frequency |
|---------|-------------|-----------|
| `changeServer` | Tests change-server WebSocket connections | 15 min |
| `infoServer` | Tests Edge info servers for exchange info | 15 min |
| `ratesServer` | Tests exchange rate API endpoints | 15 min |
| `loginServer` | Tests login server infrastructure | 15 min |

Review these fixtures in the `fixtures/` directory for real-world examples.

