# Static MCP Implementation for BWStays

## Overview
This document describes the Static MCP (Model Context Protocol) implementation for BWStays, enabling AI assistants to understand and interact with the BWStays vacation rental platform through pre-generated JSON files.

## What is Static MCP?
Static MCP is a method of serving AI model context by pre-generating all responses as static JSON files. Instead of running a dynamic server, all AI context is computed at build time and served as static files from a CDN. This is essentially "RSS for AI" - a standardized format for machines to consume website content.

## Implementation Status

### ✅ Completed
- Created directory structure for MCP files
- Documented implementation plan in CLAUDE.md
- Set up project structure
- Generated all Static MCP JSON files from BWStays content
- Created manifest file (mcp.json)
- Generated 8 resource files with BWStays content
- Created 5 tool response files with pre-computed queries
- Extracted content from index.html

### 📋 Directory Structure Created
```
bwstays/
├── CLAUDE.md                   # Project documentation and plan
├── mcp.json               # ✅ Main manifest
├── resources/             # Content resources
│   ├── about.json         # ✅ Company info and services
│   ├── properties.json    # ✅ Villa and property listings
│   ├── amenities.json     # ✅ Complete amenities list
│   ├── booking.json       # ✅ Booking process and contact
│   ├── policies.json      # ✅ Terms and policies
│   ├── attractions.json   # ✅ Tourist attractions in Wayanad
│   └── location.json      # ✅ Location and directions
└── tools/                 # Pre-computed tool responses
    ├── search/
    │   ├── properties.json    # ✅ Property search responses
    │   └── attractions.json   # ✅ Attraction search responses
    └── booking/
         ├── availability.json  # ✅ Availability check responses
         ├── pricing.json       # ✅ Pricing information
         └── contact.json       # ✅ Contact details
documentation/
└── static-mcp-implementation.md  # This file
```

## Data Extraction Plan

### Source Files
The following files in the `bwstays/` directory will be parsed to extract content:
- `index.html` - Main website content, property information, amenities
- CSS/JS files - May contain additional data or configuration
- Image files - Will be referenced in property descriptions

### Content Mapping
| Source Content | Target JSON File | Description |
|----------------|------------------|-------------|
| Homepage sections | `resources/about.json` | Company info, mission, overview |
| Property listings | `resources/properties.json` | All property details and features |
| Amenity lists | `resources/amenities.json` | Available amenities across properties |
| Booking info | `resources/booking.json` | Booking process and requirements |
| Terms/Policies | `resources/policies.json` | Cancellation, payment policies |

### Tool Response Pre-computation
| Tool Function | JSON File | Pre-computed Data |
|--------------|-----------|-------------------|
| Property search | `tools/search/properties.json` | Search results by various criteria |
| Location search | `tools/search/locations.json` | Available locations and areas |
| Date search | `tools/search/dates.json` | Available date ranges |
| Availability check | `tools/booking/availability.json` | Property availability matrix |
| Price calculation | `tools/booking/pricing.json` | Pricing for different scenarios |

## JSON File Formats

### Resource Format
```json
{
  "name": "resource_name",
  "description": "Resource description",
  "content": {
    // Structured content data
  },
  "metadata": {
    "generated": "ISO 8601 timestamp",
    "version": "1.0.0",
    "type": "markdown|json|text"
  }
}
```

### Tool Response Format
```json
{
  "name": "tool_name",
  "description": "Tool description",
  "responses": [
    {
      "input": {
        // Input parameters
      },
      "output": {
        // Pre-computed result
      }
    }
  ],
  "metadata": {
    "generated": "ISO 8601 timestamp",
    "version": "1.0.0"
  }
}
```

### Manifest Format (mcp.json)
```json
{
  "name": "bwstays",
  "version": "1.0.0",
  "description": "AI context for BWStays vacation rental platform",
  "resources": [
    // List of available resources with paths
  ],
  "tools": [
    // List of available tools with paths
  ],
  "metadata": {
    "generated": "ISO 8601 timestamp",
    "generator": "bwstays-mcp-generator"
  }
}
```

## Benefits of Static MCP

### Performance
- **Instant responses**: No computation needed, just file retrieval
- **CDN caching**: Global edge servers provide low latency
- **No cold starts**: Unlike serverless functions

### Cost
- **Zero compute costs**: No servers to run
- **Minimal storage costs**: Just static JSON files
- **Free tier eligible**: Can use free static hosting

### Reliability
- **No runtime errors**: Everything pre-computed
- **Version controlled**: Changes tracked in git
- **Rollback capable**: Easy to revert to previous versions

### Control
- **Explicit exposure**: Only share what you choose
- **No scraping needed**: Structured data provided directly
- **Update on deploy**: Context updates with site deployments

## Generated Files Summary

### Resource Files (8 total)
1. **about.json** - Company information, philosophy, USPs, social media
2. **properties.json** - Three properties with details and features
3. **amenities.json** - Comprehensive amenities across all properties
4. **booking.json** - Booking process, contact info, payment details
5. **policies.json** - Terms, conditions, cancellation, safety policies
6. **attractions.json** - 14 categories of Wayanad tourist attractions
7. **location.json** - Detailed location, connectivity, and directions

### Tool Response Files (5 total)
1. **search/properties.json** - Pre-computed property search queries
2. **search/attractions.json** - Tourist attraction search responses
3. **booking/availability.json** - Availability check responses
4. **booking/pricing.json** - Pricing information queries
5. **booking/contact.json** - Contact information responses

### Total Files Generated: 14 JSON files + 1 manifest

## Next Steps

### Testing & Validation
1. ✅ JSON structure validated
2. Test with MCP bridge server
3. Verify AI assistant can consume the data
4. Monitor response times from CDN

### Deployment (Not included in current scope)
1. Upload to CDN/static hosting
2. Configure bridge server endpoint
3. Test AI assistant integration
4. Monitor and optimize

## Notes
- All JSON files are pre-generated at build time
- No runtime computation or server needed
- Files can be served from any static host or CDN
- AI assistants access via MCP bridge server