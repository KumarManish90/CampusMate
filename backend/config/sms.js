async function sendSmsOtp(phone, otp) {
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM: from } = process.env;
  if (!sid || !token || !from) {
    const error = new Error("SMS delivery is unavailable. Please choose email or try later.");
    error.status = 503;
    throw error;
  }
  const form = new URLSearchParams({ To: phone, From: from, Body: `Your CampusMate code is ${otp}. It expires in 10 minutes. Do not share this code.` });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  if (!response.ok) {
    const error = new Error("SMS delivery failed. Please choose email or try later.");
    error.status = 503;
    throw error;
  }
}
module.exports = { sendSmsOtp };
