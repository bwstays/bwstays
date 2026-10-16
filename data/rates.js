// Rates, the single source for the booking page card, the request PDF (js/pdfgen.js), the FAQ, the MCP/llms files and the
// structured data. Fees are quoted inclusive of GST (see the Terms). Change a number here, then run the build
// (node scripts/build-faq.mjs, build-schema.mjs, generate-mcp.mjs, build-llms.mjs; check.mjs verifies they agree).
var bwRates = {
  currency: 'INR',
  perNight: 3999,          // the villa, per night
  includedAdults: 4,       // included in the nightly rate
  includedChildren: 1,     // children 0-12 included in the nightly rate
  extraChildPerNight: 800,  // extra bed: each child beyond the included child, per night
  maxAdults: 4,            // booking limit: adults
  maxChildren: 4,          // booking limit: children (0-12 years)
  gstIncluded: true
};
