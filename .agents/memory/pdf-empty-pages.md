---
name: PDF empty page fix
description: Why PDFKit creates empty pages and how to prevent it in WOOCE backup PDFs
---

## The Rule
Never draw text or lines past Y=791 on an A4 page (841.89pt height - 50pt margin = 791pt usable). Drawing past this triggers PDFKit auto-pagination, creating an empty page with only the footer on it.

**Why:** PDFKit's internal bottom boundary is `page.height - margin.bottom = 791.89`. Any `doc.text()` or `doc.moveTo()` at Y > 791 causes an automatic new page before rendering.

**How to apply:**
- `FOOTER_Y = 762` — footer separator line (safely within 791 limit)
- `PAGE_BOTTOM = 745` — content must stop here (leaves room for footer zone)
- `drawLastPageFooter(doc, y, pageW, pageNum)` clamps with `Math.min(y, FOOTER_Y)` so it never exceeds the safe zone
- NEVER use `bufferPages: true` — causes extra empty pages when combined with `switchToPage` + text rendering
- `heightOfString` does NOT accept `fontSize` in options — set `doc.fontSize(n)` before calling it instead
- ALWAYS wrap `doc.opacity(n)` calls in `doc.save()` / `doc.restore()` — opacity leaks to all subsequent content causing blank/invisible PDF pages
