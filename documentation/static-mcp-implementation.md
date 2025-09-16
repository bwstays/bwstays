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

### 📋 Directory Structure Created
```
bwstays/
├── CLAUDE.md                   # Project documentation and plan
├── mcp/                        # Static MCP files
│   ├── mcp.json               # Main manifest (to be generated)
│   ├── resources/             # Content resources
│   │   ├── about.json         # (to be generated)
│   │   ├── properties.json    # (to be generated)
│   │   ├── amenities.json     # (to be generated)
│   │   ├── booking.json       # (to be generated)
│   │   └── policies.json      # (to be generated)
│   └── tools/                 # Pre-computed tool responses
│       ├── search/
│       │   ├── locations.json     # (to be generated)
│       │   ├── dates.json         # (to be generated)
│       │   └── properties.json    # (to be generated)
│       └── booking/
│           ├── availability.json  # (to be generated)
│           └── pricing.json       # (to be generated)
└── documentation/
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

## Next Steps

### Phase 1: Content Extraction (Current)
1. Parse `index.html` for content
2. Extract property information
3. Identify amenities and features
4. Gather booking policies

### Phase 2: JSON Generation
1. Create generation scripts
2. Transform HTML content to JSON
3. Structure data according to MCP format
4. Generate all resource files

### Phase 3: Tool Response Generation
1. Identify common search patterns
2. Pre-compute search results
3. Generate availability matrices
4. Calculate pricing scenarios

### Phase 4: Testing
1. Validate JSON structure
2. Test with MCP bridge
3. Verify AI assistant integration
4. Optimize response sizes

## Notes
- All JSON files are pre-generated at build time
- No runtime computation or server needed
- Files can be served from any static host or CDN
- AI assistants access via MCP bridge server