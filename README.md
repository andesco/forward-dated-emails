# Forward Dated Emails

A Cloudflare Email Worker that forwards emails based on expiration dates embedded in the recipient address.

## Overview

This worker parses the recipient email address for a date in `YYYY-MM-DD` format and only forwards the email if the current date is before the expiration date (end of day in UTC-4 timezone).

## Features

- Date parsing from email local part (e.g., `anything-2025-12-31@forward-dated-emails.andrewe.link`)
- Expiration checking (end of day in UTC-4)
- Automatic email rejection for expired or invalid addresses

## Deployment

```bash
# Deploy to Cloudflare
npm run deploy

# Tail logs
npm run tail
```

## Configuration

- **Custom Domain**: `forward-dated-emails.andrewe.link`
- **Forward To**: `andrewe@icloud.com`
- **Account ID**: `0a15c5f9d39350baa992ff9f48efc1c8`

## Email Format

Send emails to any address at your domain with a date in the format `YYYY-MM-DD`:

- `2025-12-31@forward-dated-emails.andrewe.link`
- `test-2025-06-15@forward-dated-emails.andrewe.link`
- `backup-2024-01-01-old@forward-dated-emails.andrewe.link` (uses first date found)

## How It Works

1. Email arrives at the worker
2. Worker extracts the first `YYYY-MM-DD` pattern from the recipient address
3. Calculates expiration as end of day (23:59:59.999) in UTC-4
4. If current time > expiration: rejects the email
5. Otherwise: forwards to configured address
