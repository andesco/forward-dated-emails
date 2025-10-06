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

    // find first occurrence of YYYY-MM-DD anywhere in local part
    const match = localPart.match(/\d{4}-\d{2}-\d{2}/);
    if (!match) {
      await message.setReject("Invalid recipient address: no valid date found.");
      return;
    }

    const expiryDateStr = match[0];
    let expiryDate;
    try {
      expiryDate = getEndOfDayInConfiguredTimezone(expiryDateStr, utcOffset);
    } catch {
      await message.setReject("Invalid recipient address: invalid date.");
      return;
    }

    const now = new Date();

    if (now > expiryDate) {
      await message.setReject("Expired recipient address.");
      return;
    }

    // Determine forward-to address
    let forwardTo = env.FORWARD_TO;

    if (!forwardTo) {
      // Dynamic forwarding: remove date from local part
      // andrew2025-10-06@example.com → andrew@example.com
      const cleanedLocalPart = localPart.replace(/\d{4}-\d{2}-\d{2}/, '').replace(/--+/g, '-').replace(/^-|-$/g, '');

      if (!cleanedLocalPart) {
        await message.setReject("Invalid recipient address: no local part remains after removing date.");
        return;
      }

      forwardTo = `${cleanedLocalPart}@${domain}`;
    }

    // Forward to configured or dynamic email address
    await message.forward(forwardTo);
  },
};
