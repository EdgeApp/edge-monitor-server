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
