# Event Popup Layout - Visual Guide

## Design Mockup Implementation

Your provided mockup has been implemented exactly as specified:

```
╔════════════════════════════════════════════════╗
║  [x]                                           ║  ← Close button (top right)
╠════════════════════════════════════════════════╣
║                                                ║
║  ┌──────────────────┐    ┌──────────────────┐  ║
║  │  EVENT NAME      │    │ ORGANISER DEETS  │  ║
║  │  [Box]           │    │ [Box]            │  ║
║  │                  │    │                  │  ║
║  └──────────────────┘    └──────────────────┘  ║
║                                                ║
║  ┌──────────────────┐    ┌──────────────────┐  ║
║  │📍 LOCATION       │    │ ADDITIONAL INFO  │  ║
║  │  Venue Name      │    │ [Box]            │  ║
║  │  Address Line    │    │                  │  ║
║  │                  │    │ Description text │  ║
║  │📅 DATE & TIME    │    │ goes here...     │  ║
║  │  Thu, Jan 28,    │    │                  │  ║
║  │  2025 at 2:30 PM │    │                  │  ║
║  └──────────────────┘    └──────────────────┘  ║
║                                                ║
║  ┌──────────────────────────────────────────┐  ║
║  │        [EVENT IMAGE - Clickable]         │  ║
║  │       (Optional - hidden if no image)    │  ║
║  └──────────────────────────────────────────┘  ║
║                                                ║
╚════════════════════════════════════════════════╝
```

## Component Breakdown

### 1. EVENT NAME BOX (Top Left)
```
┌─────────────────────────────────┐
│ Event Name or Linked Title      │
│ (Blue text, bold)               │
│ Clickable if URL exists         │
└─────────────────────────────────┘
```
- **Content**: Event title from database
- **Styling**: Bold, blue (accent color)
- **Behavior**: Clickable if `url` field exists
- **Responsiveness**: Full width on mobile

### 2. ORGANISER DEETS BOX (Top Right)
```
┌─────────────────────────────────┐
│ Organiser deets                 │
│ ─────────────────────────────   │
│ John Doe Events                 │
│ (or "Not provided")             │
└─────────────────────────────────┘
```
- **Content**: `organizer` field from database
- **Fallback**: "Not provided" if empty
- **Styling**: Gray text, small font
- **Responsiveness**: Stacks below Event Name on mobile

### 3. LOCATION & DATE BOX (Bottom Left)
```
┌─────────────────────────────────┐
│ 📍 THE VENUES                   │
│    123 Main Street, Bangalore   │
│                                 │
│ 📅 Thursday, Jan 28, 2025      │
│    at 02:30 PM                  │
└─────────────────────────────────┘
```
- **Content**: 
  - Venue name + address with location icon
  - Start date/time with calendar icon
- **Format**: "Day, Month Date, Year at HH:MM AM/PM"
- **Styling**: Secondary gray text, small font
- **Responsiveness**: Min height 140px to match design

### 4. ADDITIONAL INFO BOX (Bottom Right)
```
┌─────────────────────────────────┐
│ Additional info                 │
│ ─────────────────────────────── │
│ This is where the event          │
│ description goes. It can be      │
│ multiple lines and will be       │
│ truncated if too long...         │
└─────────────────────────────────┘
```
- **Content**: `description` field from database
- **Fallback**: "No additional details available"
- **Styling**: Secondary text, small font
- **Truncation**: Line clamped to 4 lines max
- **Responsiveness**: Min height 140px to match design

### 5. EVENT IMAGE (Full Width)
```
┌─────────────────────────────────┐
│                                 │
│     [EVENT IMAGE]               │
│     Click to expand             │
│                                 │
│     🔍 Magnifying glass icon    │
│        (on hover)               │
│                                 │
└─────────────────────────────────┘
```
- **Content**: `image` field URL
- **Behavior**: Clickable to open full-screen modal
- **Visibility**: Hidden if image URL is null
- **Styling**: Rounded corners, border, hover effects
- **Responsiveness**: Full width, responsive height

## Mobile Responsiveness

### Desktop Layout (lg breakpoint and above)
- **Grid**: 2 columns (left: name & location, right: organizer & info)
- **Width**: Max 580px
- **Image**: Below grid, full width
- **Height**: Event image 192px (12rem)

### Mobile Layout (below lg breakpoint)
- **Grid**: 1 column (stacked vertically)
- **Width**: 90vw with min/max constraints
- **Image**: Below other sections, full width
- **Height**: Event image 160px (10rem)
- **Spacing**: Reduced padding and margins

## Color Scheme

| Element | CSS Variable | Color | Usage |
|---------|--------------|-------|-------|
| Background | `--marker-background` | Dark gray/charcoal | Popup background |
| Border | `--marker-border` | Light gray | Box borders, dividers |
| Surface | `--marker-surface` | Slightly lighter | Box backgrounds |
| Primary Text | `--marker-text-primary` | Light gray/white | Headings, labels |
| Secondary Text | `--marker-text-secondary` | Medium gray | Description text |
| Muted Text | `--marker-text-muted` | Dim gray | Icons, subtle info |
| Accent | `--marker-accent` | Blue (#3b82f6) | Event names, links |

## Interaction States

### Normal State
- Popup displays all available information
- Image (if present) visible with subtle border
- Text is readable and well-formatted

### Hover State
- Event name (if link): Underline appears
- Image: Opacity decreases slightly, magnifying glass icon appears
- Close button: Scales up slightly

### Active/Selected State
- Selected marker: Scales to 1.2x
- Popup: Z-index 10001 (high visibility)
- All content fully visible and interactive

### Loading State
- Spinning loader with text "Loading event details..."
- Shown while fetching event details from API
- Popup stays open with loading indicator

### Error State
- Text: "Failed to load event details"
- Color: Red (error color)
- Close button still available to dismiss

## Date & Time Formatting

### Input Format (from Database)
```
2025-01-28T14:30:00+00:00  (ISO 8601 with timezone)
```

### Display Format
```
Thursday, Jan 28, 2025 at 02:30 PM
```

### Formatting Logic
1. Extract day name: "Thursday"
2. Extract date: "Jan 28, 2025"
3. Extract time: "02:30 PM" (12-hour format)
4. Combine: "Thursday, Jan 28, 2025 at 02:30 PM"

## Image Preview Modal

When user clicks on event image:

```
╔════════════════════════════════════════════════╗
║                                            [x] ║  ← Close button
║                                                ║
║                                                ║
║            [  FULL-SIZE IMAGE  ]              ║
║                                                ║
║            ─────────────────────              ║
║         Event Name (Caption)                 ║
║                                                ║
║                                                ║
╚════════════════════════════════════════════════╝
```

- **Backdrop**: Semi-transparent black with blur effect
- **Image**: Max 95vw width, max 70vh height (responsive)
- **Caption**: Event name displayed at bottom
- **Close**: Click × or click outside to close

## Accessibility Features

1. **Semantic HTML**: Proper heading hierarchy (h3, h4)
2. **Color Contrast**: High contrast text on background
3. **Hover States**: Visual feedback for interactive elements
4. **Keyboard Navigation**: Close button, links are keyboard accessible
5. **Focus Indicators**: Visual focus states for keyboard users
6. **Loading Indicators**: Spinner shows progress
7. **Error Messages**: Clear error communication

## Performance Optimizations

1. **Memoization**: MarkerInfoWindow memoized to prevent unnecessary re-renders
2. **Event Caching**: Event details cached after first fetch
3. **Lazy Loading**: Images use `loading="lazy"` attribute
4. **Async Decoding**: Images use `decoding="async"`
5. **CSS Transitions**: GPU-accelerated transforms for smooth scaling

## Known Behaviors

1. **Multiple Clicks**: Clicking same marker again closes popup
2. **New Marker Click**: Closes previous popup, opens new one
3. **Map Pan**: Popup may move off-screen if user pans far; click marker again to recenter
4. **Image Errors**: If image fails to load, image section is hidden silently
5. **Missing Fields**: Gracefully handled with fallback text
6. **Large Descriptions**: Text is truncated with line-clamp
7. **Long Names**: Text wraps to multiple lines, handled with word-break
