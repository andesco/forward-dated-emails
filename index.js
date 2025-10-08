/**
 * Get the configured UTC offset from environment variable or use default.
 * Valid range: -12 to +14
 * Examples: -5 for EST, -8 for PST, 0 for GMT, +1 for CET, +8 for SGT
 *
 * @param {object} env - Environment object containing UTC_OFFSET
 * @returns {number} The UTC offset to use
 */
function getUTCOffset(env) {
  const offset = env.UTC_OFFSET !== undefined ? Number(env.UTC_OFFSET) : -4;

  if (isNaN(offset) || offset < -12 || offset > 14) {
    throw new Error(`Invalid UTC_OFFSET: ${offset}. Valid range is -12 to +14.`);
  }

  return offset;
}

/**
 * Parse the REQUIRE_DATE environment variable to determine if a date is required.
 * Truthy values: "true", "1", "yes" (case-insensitive)
 * Falsy values: "false", "0", "no", "", undefined
 * Default: false
 *
 * @param {object} env - Environment object containing REQUIRE_DATE
 * @returns {boolean} True if date is required, false otherwise
 */
function parseRequireDate(env) {
  const value = env.REQUIRE_DATE;

  if (value === undefined || value === '') {
    return false; // Default
  }

  const normalized = String(value).toLowerCase().trim();
  return ['true', '1', 'yes'].includes(normalized);
}

/**
 * Find a date (YYYY-MM-DD) in the local part of an email address.
 * Searches in both the base local-part and any subaddresses (separated by +).
 *
 * @param {string} localPart - The local part of the email address
 * @returns {object} Object with { dateStr: string|null, found: boolean }
 */
function findDateInAddress(localPart) {
  // Date regex: matches years 1900-2099, months 01-12, days 01-31
  const dateRegex = /(?:19|20)\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])/;

  // Split on + to handle subaddressing (e.g., user+tag+2025-12-31)
  const parts = localPart.split('+');

  // Search through all parts (base and subaddresses)
  for (const part of parts) {
    const match = part.match(dateRegex);
    if (match) {
      return { dateStr: match[0], found: true };
    }
  }

  return { dateStr: null, found: false };
}

/**
 * Calculate the end of day for a given date in the configured UTC offset timezone.
 *
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {number} utcOffset - UTC offset hours
 * @returns {Date} End of day (23:59:59.999) in the configured timezone
 */
function getEndOfDayInConfiguredTimezone(dateStr, utcOffset) {
  const [year, month, day] = dateStr.split('-').map(Number);

  // Convert end of day in local timezone to UTC
  // For UTC-4: 23:59:59 local = 03:59:59 UTC next day (subtract negative = add)
  // For UTC+2: 23:59:59 local = 21:59:59 UTC same day (subtract positive)
  return new Date(Date.UTC(year, month - 1, day, 23 - utcOffset, 59, 59, 999));
}

/**
 * Remove date patterns from local-part with various separators.
 * Patterns: +YYYY-MM-DD, .YYYY-MM-DD, -YYYY-MM-DD, or bare YYYY-MM-DD
 *
 * @param {string} localPart - The local part to clean
 * @returns {string} Cleaned local part
 */
function removeDateFromLocalPart(localPart) {
  // Remove date with common separators: +date, .date, -date, or bare date
  const datePattern = /[+.\-]?(?:19|20)\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])/;

  let cleaned = localPart.replace(datePattern, '');

  // Clean up: remove double separators, leading/trailing separators
  cleaned = cleaned.replace(/[+.\-]{2,}/g, '-')  // Multiple separators → single hyphen
                   .replace(/^[+.\-]+|[+.\-]+$/g, '');  // Remove leading/trailing

  return cleaned;
}

export default {
  async email(message, env, ctx) {
    const [localPart, domain] = message.to.split('@');

    // Get UTC offset from environment variable
    let utcOffset;
    try {
      utcOffset = getUTCOffset(env);
    } catch (error) {
      await message.setReject(`Configuration error: ${error.message}`);
      return;
    }

    // STEP 1: Check REQUIRE_DATE requirement
    const requireDate = parseRequireDate(env);
    const { dateStr, found: dateFound } = findDateInAddress(localPart);

    if (requireDate && !dateFound) {
      await message.setReject("Date required but not found in address.");
      return;
    }

    // STEP 2: Check date expiration (if date was found)
    if (dateFound) {
      let expiryDate;
      try {
        expiryDate = getEndOfDayInConfiguredTimezone(dateStr, utcOffset);
      } catch {
        await message.setReject("Invalid date format in address.");
        return;
      }

      const now = new Date();
      if (now > expiryDate) {
        await message.setReject("Expired recipient address.");
        return;
      }
    }

    // STEP 3: Check FORWARD_TO
    if (env.FORWARD_TO) {
      await message.forward(env.FORWARD_TO);
      return;
    }

     // STEP 4: Dynamic forwarding with date removal and tag matching
     const cleanedLocalPart = removeDateFromLocalPart(localPart);

     if (!cleanedLocalPart) {
       await message.setReject("Invalid recipient address: no local part remains after removing date.");
       return;
     }

     // Check for tag-based forwarding
     const tags = cleanedLocalPart.split('+');
     let destinationAddress = null;

     for (const tag of tags) {
       // Find matching env var (case-insensitive)
       const matchedKey = Object.keys(env).find(key => key.toLowerCase() === tag.toLowerCase());
       if (matchedKey) {
         destinationAddress = env[matchedKey];
         break; // Use the first matching tag
       }
     }

     // If no tag matched, use the cleaned local part as before
     if (!destinationAddress) {
       destinationAddress = `${cleanedLocalPart}@${domain}`;
     }

     try {
       await message.forward(destinationAddress);
     } catch (error) {
       if (error.message && error.message.includes('destination address not verified')) {
         await message.setReject(`Unable to forward to ${destinationAddress}. This address is not configured in Email Routing.`);
       } else {
         // Re-throw unexpected errors
         throw error;
       }
     }
  },
};
