function getEndOfDayInFixedUTCMinus4(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  // 23:59:59.999 in UTC-4 is 03:59:59.999 UTC next day (+4 hours)
  return new Date(Date.UTC(year, month - 1, day, 23 + 4, 59, 59, 999));
}

export default {
  async email(message, env, ctx) {
    const [localPart] = message.to.split('@');

    // find first occurrence of YYYY-MM-DD anywhere in local part
    const match = localPart.match(/\d{4}-\d{2}-\d{2}/);
    if (!match) {
      await message.setReject("Invalid recipient address: no valid date found.");
      return;
    }

    const expiryDateStr = match[0];
    let expiryDate;
    try {
      expiryDate = getEndOfDayInFixedUTCMinus4(expiryDateStr);
    } catch {
      await message.setReject("Invalid recipient address: invalid date.");
      return;
    }

    const now = new Date();

    if (now > expiryDate) {
      await message.setReject("Expired recipient address.");
      return;
    }

    // Forward to your desired email address
    await message.forward("andrewe@icloud.com");
  },
};
