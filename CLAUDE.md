# BWStays Static MCP Implementation

## Project Overview
Generate Static MCP JSON files for the BWStays website to enable AI assistants to understand and interact with the site's content and functionality.

## Static MCP Documentation

### What is Static MCP?
Static MCP is an approach to serving AI model context by pre-generating all responses as static JSON files that can be served from any CDN or static hosting provider. It's essentially "RSS for AI" - a standardized way to expose structured content for machine consumption.

### Core Principles
1. **Pre-generation**: All responses are computed at build time, not runtime
2. **Static hosting**: JSON files served from CDN (Vercel, Netlify, GitHub Pages)
3. **Zero computation**: No servers, databases, or runtime processing
4. **Global caching**: Instant responses via CDN edge servers

### File Structure
```
bwstays/
├── mcp.json                    # Main manifest file
├── resources/                  # Pre-built resource responses
│   ├── about.json             # About BWStays content
│   ├── properties.json        # Property listings
│   ├── amenities.json         # Available amenities
│   ├── booking.json           # Booking information
│   └── policies.json          # Terms and policies
└── tools/                      # Pre-built tool responses
    ├── search/
    │   ├── locations.json     # Location search results
    │   ├── dates.json         # Date availability
    │   └── properties.json    # Property search
    └── booking/
        ├── availability.json   # Check availability
        └── pricing.json        # Pricing calculations
```

### mcp.json Structure
The main manifest file that describes available resources and tools:
```json
{
  "name": "bwstays",
  "version": "1.0.0",
  "description": "AI context for BWStays vacation rental platform",
  "resources": [
    {
      "name": "about",
      "description": "Information about BWStays",
      "path": "/resources/about.json"
    },
    {
      "name": "properties",
      "description": "Available property listings",
      "path": "/resources/properties.json"
    }
  ],
  "tools": [
    {
      "name": "search_properties",
      "description": "Search for available properties",
      "path": "/tools/search/properties.json"
    }
  ]
}
```

### Resource JSON Format
Each resource file contains pre-generated content:
```json
{
  "name": "resource_name",
  "content": "Pre-generated content or data",
  "metadata": {
    "generated": "2024-01-01T00:00:00Z",
    "type": "markdown|json|text"
  }
}
```

### Tool JSON Format
Tool files contain pre-computed responses for various inputs:
```json
{
  "name": "tool_name",
  "responses": [
    {
      "input": {"param": "value"},
      "output": {"result": "pre-computed result"}
    }
  ]
}
```

## BWStays Implementation Plan

### Phase 1: Content Extraction
1. **Analyze existing website content** in `bwstays/` folder
2. **Identify key information** to expose to AI:
   - Property descriptions and amenities
   - Booking policies and procedures
   - Location information
   - Pricing structures
   - Contact information

### Phase 2: JSON Generation
1. **Create generation scripts** to:
   - Parse HTML/content from bwstays/ folder
   - Extract structured data
   - Generate JSON files in Static MCP format

2. **Content to extract**:
   - Homepage content → about.json
   - Property listings → properties.json
   - Amenities list → amenities.json
   - Booking policies → policies.json
   - FAQ/Help content → help.json

### Phase 3: Tool Implementation
1. **Define tool responses** for common queries:
   - Property search by location/date
   - Availability checking
   - Pricing calculations
   - Booking process information

### Phase 4: Deployment
1. **Build process**:
   - Generate all JSON files
   - Validate structure
   - Create mcp.json manifest

2. **Hosting**:
   - Deploy to `/mcp/` directory
   - Configure CDN caching
   - Set up bridge server connection

### Implementation Notes

#### Data Sources in bwstays/
- `index.html` - Main site content, property features
- CSS/JS files - UI components that may contain data
- Images - Property photos (reference in JSON)
- Any config files with site data

#### Generation Strategy
1. Parse HTML files for content
2. Extract text, structure, and metadata
3. Transform to Static MCP JSON format
4. Organize by logical categories
5. Pre-compute common query responses

#### Key Benefits for BWStays
- **Instant AI responses** about properties and bookings
- **No server costs** for AI context serving
- **Global availability** via CDN
- **Controlled information** - only expose what we choose
- **Version control** - update AI context with deployments

### Next Steps
1. Analyze current bwstays/ folder structure
2. Create JSON generation scripts
3. Generate initial Static MCP files
4. Test with MCP bridge
5. Deploy to production

### Bridge Server
Use hosted bridge at: `https://bridge.staticmcp.com`
Or self-host bridge for custom requirements

### References
- [Static MCP Website](https://staticmcp.com)
- [MCP Protocol Specification](https://modelcontextprotocol.org)
- Static MCP RFC and Standard documentation