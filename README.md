# Wire Jira Broadcast Bot
The intent of this bot is to receive a webhook from Jira and send the message to Wire to all conversations, this bot is in.
In theory, the webhook can be triggered by any event, but as of February 2021, Wire is using it for webhooks triggered by transitions.

## Development
The bot is based on the JavaScript runtime [Deno](https://deno.land/) and [Oak](https://github.com/oakserver/oak) middleware.

### Configuration
Jira Broadcast Bot uses few environmental variables for its configuration, for complete list see first lines of the [code](app.ts).
