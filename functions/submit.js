/**
 * Cloudflare Pages Function — Contact form handler
 *
 * Setup required in Cloudflare dashboard:
 *   Workers & Pages → schrijfstijn → Settings → Variables and Secrets
 *   Add secret: RESEND_API_KEY = <your Resend API key>  (Environment: Production)
 *
 * DNS / Resend setup:
 *   - Verify the domain schrijfstijn.be in Resend (resend.com/domains)
 *   - Add the required DKIM + SPF records in Cloudflare DNS as instructed by Resend
 *   - The sender noreply@schrijfstijn.be will only work after domain verification
 */

export async function onRequestPost(context) {
    const formData = await context.request.formData();

    const firstname = String(formData.get("firstname") || "").trim();
    const lastname  = String(formData.get("lastname")  || "").trim();
    const name      = [firstname, lastname].filter(Boolean).join(" ");
    const email     = String(formData.get("email")     || "").trim();
    const phone     = String(formData.get("phone")     || "").trim();
    const subject   = String(formData.get("subject")   || "").trim();
    const message   = String(formData.get("message")   || "").trim();
    const website   = String(formData.get("website")   || "").trim(); // honeypot

    // Honeypot triggered — silently redirect as if successful
    if (website) {
        return Response.redirect(new URL("/thank-you.html", context.request.url), 303);
    }

    if (!firstname || !lastname || !email || !message || !subject) {
        return new Response("Naam, achternaam, e-mail, onderwerp en bericht zijn verplicht.", { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return new Response("Ongeldig e-mailadres.", { status: 400 });
    }

    const timestamp = new Date().toLocaleString("nl-BE", {
        timeZone: "Europe/Brussels",
        dateStyle: "long",
        timeStyle: "short",
    });

    const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"></head>
<body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 2rem; color: #0d0b09;">
  <h2 style="font-size: 1.5rem; font-weight: 400; border-bottom: 1px solid #e0dbd6; padding-bottom: 1rem; margin-bottom: 1.5rem;">
    Nieuw contactformulier via Schrijfstijn
  </h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 0.75rem 0; border-bottom: 1px solid #f0ebe6; width: 120px; color: #7a6f68; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.08em;">Naam</td>
      <td style="padding: 0.75rem 0; border-bottom: 1px solid #f0ebe6;">${escapeHtml(name)}</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem 0; border-bottom: 1px solid #f0ebe6; color: #7a6f68; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.08em;">E-mail</td>
      <td style="padding: 0.75rem 0; border-bottom: 1px solid #f0ebe6;"><a href="mailto:${escapeHtml(email)}" style="color: #D53212;">${escapeHtml(email)}</a></td>
    </tr>
    <tr>
      <td style="padding: 0.75rem 0; border-bottom: 1px solid #f0ebe6; color: #7a6f68; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.08em;">Telefoon</td>
      <td style="padding: 0.75rem 0; border-bottom: 1px solid #f0ebe6;">${escapeHtml(phone || "—")}</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem 0; border-bottom: 1px solid #f0ebe6; color: #7a6f68; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.08em;">Onderwerp</td>
      <td style="padding: 0.75rem 0; border-bottom: 1px solid #f0ebe6;">${escapeHtml(subject || "—")}</td>
    </tr>
  </table>
  <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; color: #7a6f68; margin: 2rem 0 0.75rem;">Bericht</h3>
  <p style="line-height: 1.75; white-space: pre-wrap; margin: 0 0 2rem; background: #f8f4f0; padding: 1.25rem; border-left: 2px solid #D53212;">${escapeHtml(message).replaceAll("\n", "<br>")}</p>
  <hr style="border: none; border-top: 1px solid #e0dbd6; margin: 1.5rem 0;">
  <p style="font-size: 0.75rem; color: #b0a89f; margin: 0;">Verzonden via schrijfstijn.be · ${escapeHtml(timestamp)}</p>
</body>
</html>`;

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${context.env.RESEND_SCHRIJFSTIJN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from:     "Schrijfstijn <noreply@schrijfstijn.be>",
            to:       ["management@schrijfstijn.be"],
            reply_to: email,
            subject:  `Nieuw contactformulier via Schrijfstijn: ${name}`,
            html,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Resend error:", errorText);
        return new Response(
            "Er ging iets mis bij het versturen van je bericht. Probeer opnieuw of stuur een e-mail naar management@schrijfstijn.be.",
            { status: 500 }
        );
    }

    return Response.redirect(new URL("/thank-you.html", context.request.url), 303);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&",  "&amp;")
        .replaceAll("<",  "&lt;")
        .replaceAll(">",  "&gt;")
        .replaceAll('"',  "&quot;")
        .replaceAll("'",  "&#039;");
}
