/**
 * AdForge — /api/export-campaign (Professional PDF Campaign Brief Export)
 *
 * POST endpoint that generates a professional PDF campaign brief
 * with embedded poster images, styled layout, and print-ready formatting.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productName,
      productDesc,
      tone,
      platforms,
      headline,
      tagline,
      adCopy,
      callToAction,
      targetAudience,
      keyBenefits,
      platformVersions,
      posters, // Array of { platform, label, imageBase64 }
    } = body;

    if (!productName || !headline) {
      return NextResponse.json(
        { error: "Product name and headline are required" },
        { status: 400 }
      );
    }

    // Generate professional HTML that will be rendered as PDF
    const postersHtml = (posters && posters.length > 0)
      ? posters.map((p: any) => `
          <div class="poster-card">
            <div class="poster-label">${p.label} (${p.platform})</div>
            <img src="data:image/png;base64,${p.imageBase64}" alt="${p.label}" class="poster-image" />
          </div>
        `).join("")
      : "";

    const benefitsHtml = keyBenefits
      ? keyBenefits.split("\n").map((b: string) => `<li>${b.replace(/^[•\-*]\s*/, "")}</li>`).join("")
      : "";

    const platformsList = platforms && platforms.length > 0
      ? platforms.map((p: string) => `<span class="platform-badge">${p}</span>`).join("")
      : "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${productName} — Ad Campaign Brief</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1a1814;
    background: #fff;
    line-height: 1.6;
    font-size: 14px;
  }

  .page {
    max-width: 900px;
    margin: 0 auto;
    padding: 40px;
  }

  /* Cover Section */
  .cover {
    text-align: center;
    padding: 60px 40px 40px;
    border-bottom: 3px solid #c8602a;
    margin-bottom: 40px;
  }

  .cover-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #c8602a;
    margin-bottom: 16px;
  }

  .cover h1 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 36px;
    font-weight: 700;
    color: #1a1814;
    margin-bottom: 8px;
    line-height: 1.2;
  }

  .cover .headline-text {
    font-size: 22px;
    color: #c8602a;
    font-weight: 600;
    margin-top: 12px;
    font-style: italic;
  }

  .cover .tagline-text {
    font-size: 16px;
    color: #4a4640;
    margin-top: 8px;
    font-weight: 500;
  }

  /* Campaign Details */
  .details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 32px;
  }

  .detail-card {
    background: #faf9f7;
    border: 1px solid #e8e5df;
    border-radius: 8px;
    padding: 20px;
  }

  .detail-card h3 {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #c8602a;
    margin-bottom: 8px;
  }

  .detail-card p {
    font-size: 14px;
    color: #1a1814;
    line-height: 1.6;
  }

  /* Section */
  .section {
    margin-bottom: 32px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e8e5df;
  }

  .section-header h2 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 20px;
    font-weight: 700;
    color: #1a1814;
  }

  .section-icon {
    width: 24px;
    height: 24px;
    background: #c8602a;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    font-weight: 700;
  }

  .section p {
    font-size: 14px;
    line-height: 1.7;
    color: #4a4640;
  }

  /* CTA Highlight */
  .cta-highlight {
    background: linear-gradient(135deg, #c8602a, #d4763f);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    font-size: 18px;
    font-weight: 700;
    text-align: center;
    margin: 20px 0;
  }

  /* Benefits */
  .benefits-list {
    list-style: none;
    padding: 0;
  }

  .benefits-list li {
    padding: 10px 0 10px 28px;
    position: relative;
    border-bottom: 1px solid #f0ede8;
    font-size: 14px;
    color: #4a4640;
  }

  .benefits-list li::before {
    content: "\\2713";
    position: absolute;
    left: 0;
    color: #c8602a;
    font-weight: 700;
    font-size: 16px;
  }

  /* Platform Badges */
  .platform-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .platform-badge {
    background: #1a1814;
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    text-transform: capitalize;
  }

  /* Posters */
  .posters-section {
    margin-top: 40px;
    padding-top: 32px;
    border-top: 3px solid #c8602a;
  }

  .posters-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 16px;
  }

  .poster-card {
    border: 1px solid #e8e5df;
    border-radius: 8px;
    overflow: hidden;
    background: #faf9f7;
  }

  .poster-label {
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #c8602a;
    border-bottom: 1px solid #e8e5df;
    background: #fff;
  }

  .poster-image {
    width: 100%;
    height: auto;
    display: block;
  }

  /* Footer */
  .footer {
    margin-top: 48px;
    padding-top: 16px;
    border-top: 1px solid #e8e5df;
    text-align: center;
    color: #8a8580;
    font-size: 11px;
  }

  /* Print optimization */
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 20px; }
    .poster-card { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Cover -->
  <div class="cover">
    <div class="cover-label">Ad Campaign Brief</div>
    <h1>${escapeHtml(productName)}</h1>
    ${headline ? `<div class="headline-text">"${escapeHtml(headline)}"</div>` : ""}
    ${tagline ? `<div class="tagline-text">${escapeHtml(tagline)}</div>` : ""}
    ${platformsList ? `<div class="platform-badges" style="justify-content:center;margin-top:16px">${platformsList}</div>` : ""}
  </div>

  <!-- Quick Details -->
  <div class="details-grid">
    ${tone ? `<div class="detail-card"><h3>Campaign Tone</h3><p style="text-transform:capitalize">${escapeHtml(tone)}</p></div>` : ""}
    ${callToAction ? `<div class="detail-card"><h3>Call to Action</h3><p style="color:#c8602a;font-weight:700;font-size:16px">${escapeHtml(callToAction)}</p></div>` : ""}
  </div>

  ${productDesc ? `
  <div class="section">
    <div class="section-header">
      <div class="section-icon">B</div>
      <h2>Brand Brief</h2>
    </div>
    <p>${escapeHtml(productDesc)}</p>
  </div>
  ` : ""}

  ${adCopy ? `
  <div class="section">
    <div class="section-header">
      <div class="section-icon">C</div>
      <h2>Ad Copy</h2>
    </div>
    <p>${escapeHtml(adCopy)}</p>
  </div>
  ` : ""}

  ${callToAction ? `
  <div class="cta-highlight">${escapeHtml(callToAction)}</div>
  ` : ""}

  ${targetAudience ? `
  <div class="section">
    <div class="section-header">
      <div class="section-icon">A</div>
      <h2>Target Audience</h2>
    </div>
    <p>${escapeHtml(targetAudience)}</p>
  </div>
  ` : ""}

  ${benefitsHtml ? `
  <div class="section">
    <div class="section-header">
      <div class="section-icon">K</div>
      <h2>Key Benefits</h2>
    </div>
    <ul class="benefits-list">
      ${benefitsHtml}
    </ul>
  </div>
  ` : ""}

  ${platformVersions ? `
  <div class="section">
    <div class="section-header">
      <div class="section-icon">P</div>
      <h2>Platform Adaptations</h2>
    </div>
    <p style="white-space:pre-line">${escapeHtml(platformVersions)}</p>
  </div>
  ` : ""}

  ${postersHtml ? `
  <div class="posters-section">
    <div class="section-header">
      <div class="section-icon">V</div>
      <h2>Visual Ad Creatives</h2>
    </div>
    <div class="posters-grid">
      ${postersHtml}
    </div>
  </div>
  ` : ""}

  <div class="footer">
    Generated by AdForge AI &mdash; ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
  </div>

</div>
</body>
</html>`;

    // Return the HTML for the frontend to render as PDF via print
    return NextResponse.json({
      html,
      productName,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong exporting campaign.";
    console.error("Export error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
