# Expiring Emails with Cloudflare Email Routing

**`expiring-email-routing`** is a Cloudflare Email Worker that redirects or drops emails based on an expiration date embedded in the recipient address.

The email worker parses the recipient email address for a date in `YYYY-MM-DD` format and only forwards the email if the date has not passed:

`mailbox+2029-01-01@example.com` → `mailbox@example.com`

`catchall-2029-01-01@example.com` → `steve.jobs@icloud.com`

`expired.2024-12-31@example.com` → 🗑️

### Prerequisites

1. **Enable [Cloudflare Email Routing][doc1]**:\
   Account → Domain → [Email Routing][dash-enable]

    > Use a new or unused domain name with Email Routing. Cloudflare offers registrations [priced at cost][pricing].
    
2. **Add verified [destination addresses][doc2]**:\
   […] <nobr>Email Routing</nobr> → [<nobr>Destination addresses</nobr>][dash-catch]
   > At least one destination address is required. Email workers can only route to approved email addresses, even if the email domain remains the same (catch-all routing to custom).

  3. **Enable [subaddressing][doc3]**:\
   […] <nobr>Email Routing</nobr> → [Settings][dash-subadd]

## Setup

1. **Deploy** `expiring-email-routing` to Cloudflare.

2. **Enable** the Catch-all email address:\
   Account → Domain → <nobr>Email Routing</nobr> → <nobr>Routing Rules</nobr> → [Catch&#8209;all: Edit][dash-catch]

3. Action: `Send to Worker`\
   Destination: `expiring-email-routing`\
   Save.


## Deploy to Cloudflare

### Cloudflare Dashboard

[![<nobr>Deploy to Cloudflare</nobr>](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/andesco/expiring-email-routing)

<nobr>Workers & Pages</nobr> → Create an application → [Clone a repository](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create/deploy-to-workers):
   ```
   http://github.com/andesco/expiring-email-routing
   ```

### Wrangler CLI

```bash
git clone https://github.com/andesco/expiring-email-routing
cd expiring-email-routing
# edit wrangler.toml
wrangler deploy
```

## Environment Variables

### `UTC_OFFSET`
- optional
- If the  email address contains a date in the past, the worker drops the email.
- Set your preferred timezone to determine the end of your day relative to <abbr title="Coordinated Universal Time">UTC</abbr>. Examples:\
  `-7` Pacific Time\
  `-4` Eastern Time · default\
  ` 0` UTC\
  `+8` Singapore

### `REQUIRE_DATE`
- optional
- If the email address does not contain a date, drop the email:\
`true`\
`false` · default

### `FORWARD_TO`
- optional
- If set, the email worker redirects to `FORWARD_TO`.
- If not set, the worker strips the date and redirect:\
`temp+YYYY-MM-DD@xyz.com` → `temp@xyz.com` \
`temp-YYYY-MM-DD@xyz.com` → `temp@xyz.com` \
`temp.YYYY-MM-DD@xyz.com` → `temp@xyz.com` \
`tempYYYY-MM-DD@xyz.com` → `temp@xyz.com`

## Development

#### Build Commands

```bash
npm run deploy # wrangler deploy --config wrangler.local.toml
npm run dev    # wrangler dev    --config wrangler.local.toml
```

[doc1]: //developers.cloudflare.com/email-routing/get-started/
[doc2]: //developers.cloudflare.com/email-routing/setup/email-routing-addresses/#destination-addresses
[doc3]: //developers.cloudflare.com/email-routing/setup/email-routing-addresses/#subaddressing
[pricing]: //cfdomainpricing.com

[dash-enable]: //dash.cloudflare.com/?to=/:account/:zone/email/routing/overview
[dash-verify]: //dash.cloudflare.com/?to=/:account/:zone/email/routing/destination-address
[dash-catch]:  //dash.cloudflare.com/?to=/:account/:zone/email/routing/routes/catch_all
[dash-subadd]: //dash.cloudflare.com/?to=/:account/:zone/email/routing/settings
