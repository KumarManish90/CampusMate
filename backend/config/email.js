const PROVIDER = (process.env.EMAIL_PROVIDER || "console").toLowerCase();

function assertEmailConfig() {
  if (process.env.NODE_ENV !== "production") return true;
  if (PROVIDER !== "resend") {
    console.warn("[startup] Production email delivery is disabled. Set EMAIL_PROVIDER=resend before enabling email verification.");
    return false;
  }
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.warn("[startup] Resend is selected but RESEND_API_KEY or EMAIL_FROM is missing; email verification will be unavailable.");
    return false;
  }
  return true;
}

async function sendEmailOtp(email, otp) {
  if (PROVIDER === "console" && process.env.NODE_ENV !== "production") {
    console.log(`[dev] Email OTP for ${email}: ${otp}`);
    return;
  }

  if (PROVIDER !== "resend") {
    const error = new Error("Email delivery is not configured.");
    error.status = 503;
    throw error;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: "Your CampusMate verification code",
      html: `<p>Your CampusMate verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p><p>This code expires in 10 minutes.</p>`,
    }),
  });

  if (!response.ok) {
    const error = new Error("Unable to send the verification email right now.");
    error.status = 503;
    throw error;
  }
}

module.exports = { assertEmailConfig, sendEmailOtp };
