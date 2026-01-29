import { Email } from "@convex-dev/auth/providers/Email";

// Generate random 8-digit numeric code using Web Crypto API
function generateRandomCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // Get 8 digits by taking modulo and padding
  const code = (array[0] % 100000000).toString().padStart(8, "0");
  return code;
}

export const ResendOTPEmailVerification = Email({
  id: "resend-otp-verify",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 20, // 20 minutes

  async generateVerificationToken() {
    return generateRandomCode();
  },

  async sendVerificationRequest({ identifier: email, provider, token }) {
    // Use fetch directly instead of resend npm package to avoid Node.js dependencies
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.AUTH_EMAIL ?? "HSA Songbook <send@hsasongbook.com>",
        to: [email],
        subject: "Verify your email for HSA Songbook",
        html: `
          <h1>Welcome to HSA Songbook!</h1>
          <p>Your verification code is: <strong>${token}</strong></p>
          <p>This code expires in 20 minutes.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }
  },
});
