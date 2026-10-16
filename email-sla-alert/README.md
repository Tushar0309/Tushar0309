# Customer email SLA -> Slack alert

Every 15 min, finds customer emails in Gmail whose latest message is from the customer
and older than `slaHours`, then posts to Slack tagging the configured people. Alerts once
per unanswered message; a new customer follow-up alerts again.

## Setup
1. Slack: create an Incoming Webhook (api.slack.com/apps -> Incoming Webhooks) for the channel.
2. Get each person's member ID: Slack profile -> ⋮ -> Copy member ID.
3. Go to script.google.com (logged in as the support mailbox) -> New project -> paste `Code.gs`.
4. Edit `CONFIG` (domains, hours, webhook, member IDs).
5. Run `installTrigger` once and approve permissions. Run `checkUnrepliedEmails` to test.
