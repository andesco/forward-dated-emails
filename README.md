# Expiring Emails with Cloudflare Email Routing

**`forward-dated-emails`** is a Cloudflare Email Worker that redirects or drops emails based on an expiration date embedded in the recipient address.

The email worker parses the recipient email address for a date in `YYYY-MM-DD` format and only forwards the email if the date has not passed:

`marketing-2029-01-01@user.click` → `marketing@user.click`

`expires-2028-12-31@user.click` → `s.jobs@icloud.com`

`expires-2021-01-06@user.click` → 🗑️


### Prerequisites

0. I recommend using Cloudflare Email Routing with a dedicated domain name. Cloudflare offers registrations priced at cost: [Cloudflare Domain Pricing](//cfdomainpricing.com)

1. **Enable [Cloudflare Email Routing][doc1]**:\
   Account → Domain → [Email Routing][dash-enable]

2. **Add [verified email addresses][doc2]**:\
   […] → Email Routing → [Destination addresses][dash-catch]

3. **Enable [subaddressing][sub]**:\
   Account → Domain → Email Routing → [Destination addresses][dash-catch]
    Enable subaddressing

### Setup

1. Deploy `forward-dated-emails` to Cloudflare.

2. Create a catch-all email address:\
   Account → Domain → Email Routing → Routing Rules → [Catch&#8209;all: Edit][dash-catch]

3. Action: `Send to Worker`\
   Destination: `forward-dated-emails`\
   Save.

## Deploy to Cloudflare

### Cloudflare Dashboard

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/andesco/forward-dated-emails)

<nobr>Workers & Pages</nobr> → Create an application → [Clone a repository](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create/deploy-to-workers):
   ```
   http://github.com/andesco/forward-dated-emails
   ```

### Wrangler CLI

```bash
git clone https://github.com/andesco/forward-dated-emails
cd forward-dated-emails
# edit wrangler.toml
wrangler deploy
```

## Environment Variables

### `UTC_OFFSET`
- optional
- If the recipient email address contains a date in the past, the email worker drops the email.
- Set your preferred timezone to determine the end of your day relative to <abbr title="Coordinated Universal Time">UTC</abbr>. Examples:\
  `-7` Pacific Time\
  `-4` Eastern Time · default\
  ` 0` UTC\
  `+8` Singapore

### `FORWARD_TO`
- optional
- If set, the email worker redirects to `FORWARD_TO`.
- If not set, it dynamically redirects the email by stripping out the date: \
`temp.mail-YYYY-MM-DD@user.click` → `temp.mail@user.click` \
`marketingYYYY-MM-DD@user.click` → `marketing@user.click`

## Development

#### Build Commands

```bash
npm run deploy # wrangler deploy --config wrangler.local.toml
npm run dev    # wrangler dev    --config wrangler.local.toml
```

[doc1]: //developers.cloudflare.com/email-routing/get-started/
[doc2]: //developers.cloudflare.com/email-routing/setup/email-routing-addresses/#destination-addresses
[doc3]: //developers.cloudflare.com/email-routing/setup/email-routing-addresses/#subaddressing
[dash-enable]: //dash.cloudflare.com/?to=/:account/:zone/email/routing/overview
[dash-verify]: //dash.cloudflare.com/?to=/:account/:zone/email/routing/destination-address
[dash-catch]:  //dash.cloudflare.com/?to=/:account/:zone/email/routing/routes/catch_all
[dash-subadd]: //dash.cloudflare.com/?to=/:account/:zone/email/routing/settings
