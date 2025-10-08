# Expiring Emails with Cloudflare Email Routing

**`expiring-email-routing`** is a Cloudflare Email Worker that redirects or drops emails based on an expiration date embedded in the recipient address.

The email worker parses the recipient email address for a date in `YYYY-MM-DD` format and only forwards the email if the date has not passed:

`mailbox+2029-01-01@example.dev` → `mailbox@example.dev`

`catchall.2029-01-01@example.dev` → `steve.jobs@icloud.com`

`expired.2024-12-31@example.dev` → 🗑️

### Prerequisites

1. **Enable [Cloudflare Email Routing][doc1]**:\
  Dashboard → Account → Domain → [Email Routing][dash-enable]

    > Use a new or unused domain name with Email Routing. Cloudflare offers registrations [priced at cost][pricing].
    
2. **Add verified [destination addresses][doc2]**:\
   Domain → <nobr>Email Routing</nobr> → [<nobr>Destination addresses</nobr>][dash-catch]
   > At least one destination address is required. Email workers can only route to approved email addresses, even if the email domain remains the same (catch-all routing to custom).


## Deploy to Cloudflare
   
1. **Cloudflare Dashboard:**\
   Dashboard … Workers → Create an application → <nobr>[Clone a repository](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create/deploy-to-workers):</nobr>
      ```
      http://github.com/andesco/expiring-email-routing
      ```
   [![<nobr>Deploy to Cloudflare</nobr>](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/andesco/expiring-email-routing)
   
2. **Wrangler CLI:**
   ```bash
   git clone https://github.com/andesco/expiring-email-routing
   cd expiring-email-routing
   # edit wrangler.toml
   wrangler deploy
   ```
 
 
## Setup

### Use Catach-All Address: `.YYYY-MM-DD`

If your catch-all address is enabled, you can effectively use `expiring-email-routing` with all your custom addresses:</summary>

1. **Enable catch-all address:**\
   Domain → <nobr>Email Routing</nobr> → <nobr>[Routing Rules][dash-routes]</nobr>\
   <kbd>Active</kbd>
   
2. **Send catch-all address to Worker:**\
   Domain → Email Routing → <nobr>Routing Rules</nobr> → [Edit catch-all address][dash-catch]\
   <kbd>Edit</kbd>\
   Action: Send to a Worker\
   Destination: expiring-email-routing\
   <kbd>Save</kbd>
   
3. **Use the catach-all address:**
      
   `catchall.{YYYY-MM-DD}@example.dev` → `FORWARD_TO`
   
   `custom-address.{YYYY-MM-DD}@example.dev` → `custom-address@example.dev`
     
### Use Custom Addresses: `+YYYY-MM-DD`

If your catch-all address is disabled, you can selectively use `expiring-email-routing` with a custom addresses:

1. **Enable [subaddressing][doc3]**:\
   Domain → <nobr>Email Routing</nobr> → [Settings][dash-subadd]

2. **Send custom addresses to Worker:**\
   Domain → <nobr>Email Routing</nobr> → <nobr>[Routing Rules][dash-routes]</nobr>\
   <kbd>Create address</kbd> <small>or</small> <kbd>Edit</kbd>\
   Action: Send to a Worker\
   Destination: expiring-email-routing\
   <kbd>Save</kbd>
   
3. **Use your custom addresses with [subaddressing]:**
   
   `mailbox+{date}@example.dev` → `FORWARD_TO`
   
   `mailbox+{CUSTOM_TAG}@example.dev` → `CUSTOM_TAG`
   
   `mailbox+{date}+{CUSTOM_TAG}@example.dev` → `CUSTOM_TAG`

   > [!note]
   > [Subaddressing] is also known as sub-addressing, plus addressing, and tagged addressing.

## Environment Variables

### `REQUIRE_DATE`
- optional boolean
- drop emails with no date in address: `true`
- route emails with or without a date in address: `false` · default

### `UTC_OFFSET`
- optional
- If the  email address contains a date in the past, the worker drops the email.
- Set your preferred timezone to determine the end of your day relative to <abbr title="Coordinated Universal Time">UTC</abbr>. Examples:\
  `-7` Pacific Time\
  `-4` Eastern Time · default\
  ` 0` UTC\
  `+8` Singapore\
  `-96` 4 day buffer
  
### `{CUSTOM_TAG}`
- optional email address
- If subaddresses is enabled and a `{CUSTOM_TAG}` is included in the address, the email worker routes to `{CUSTOM_TAG}` first.

### `FORWARD_TO`
- optional email address
- If `FORWARD_TO` is set, the email worker routes to `FORWARD_TO`:
- If `FORWARD_TO` is not set, the worker strips the date and attempts to route to a custom address:\
`custom-address.YYYY-MM-DD@example.com` → `custom-address@example.com`



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
[subaddressing]: //en.wikipedia.org/wiki/Email_address#Sub-addressing

[dash-enable]: //dash.cloudflare.com/?to=/:account/:zone/email/routing/overview
[dash-verify]: //dash.cloudflare.com/?to=/:account/:zone/email/routing/destination-address
[dash-routes]:  //dash.cloudflare.com/?to=/:account/:zone/email/routing/routes/
[dash-catch]:  //dash.cloudflare.com/?to=/:account/:zone/email/routing/routes/catch_all
[dash-subadd]: //dash.cloudflare.com/?to=/:account/:zone/email/routing/settings
