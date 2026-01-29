import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// Resend inbound email webhook - forwards contact@ emails
http.route({
  path: "/webhook/email/inbound",
  method: "POST",
  handler: async (request) => {
    const payload = await request.json();

    // Only process email.received events
    if (payload.type !== "email.received") {
      return new Response("OK", { status: 200 });
    }

    const { email_id, to } = payload.data;
    const toAddress = to?.[0]?.toLowerCase();

    // Forward contact@ emails
    if (toAddress === "contact@hsasongbook.com") {
      const response = await fetch(
        `https://api.resend.com/emails/${email_id}/forward`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.AUTH_RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: "hsasongbook@inbox.menningmail.com",
            from: "HSA Songbook <contact@hsasongbook.com>",
          }),
        }
      );

      if (!response.ok) {
        console.error("Failed to forward email:", await response.text());
        return new Response("Forward failed", { status: 500 });
      }
    }

    return new Response("OK", { status: 200 });
  },
});

export default http;
