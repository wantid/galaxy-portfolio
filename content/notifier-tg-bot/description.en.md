## notifier-tg-bot

notifier-tg-bot is a Telegram bot for task reminders that helps a person move towards a big goal in small steps.

The bot allows you to configure the **mood** of reminders (from gentle support to strict discipline) and the **frequency** of notifications to find the optimal pace and tone of communication that suits you.

Technically, it's a Node.js application based on the **Telegraf** framework, using **PostgreSQL** as storage. The project is packaged in Docker and deployed via **docker-compose**: separate services for the bot and database, working in a common network, with configuration through environment variables.

The bot is deployed as a standalone service and can be managed through Portainer/Stacks, which simplifies updates and maintenance in production.

## Links

- [@notifier_exersitus_bot](https://t.me/notifier_exersitus_bot) — Telegram bot

