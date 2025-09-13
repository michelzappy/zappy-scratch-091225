# Color Review - Health Quiz Page

## Current Color Usage Summary

### Zappy Brand Colors (Correctly Applied)
- `bg-zappy-light-blue` - Progress bar background
- `text-zappy-blue` - Progress milestone labels, estimated time
- `border-zappy-pink` - Selected states, hover states
- `bg-zappy-light-yellow` - Selected option backgrounds
- `from-zappy-pink to-zappy-blue` - Gradient buttons and progress bar
- `text-zappy-pink` - Checkbox accent color
- `focus:ring-zappy-pink` - Focus states

### Gray Colors (Standard UI)
- `bg-white` - Main background
- `text-gray-900` - Primary text (headings, labels)
- `text-gray-600` - Secondary text (descriptions)
- `text-gray-500` - Tertiary text (placeholders, hints)
- `text-gray-400` - Disabled state text
- `border-gray-200` - Default borders
- `bg-gray-200` - Disabled button background, progress track

### Other Colors (Need Review)
- `bg-green-100` - Success checkmark background
- `text-green-600` - Success checkmark icon
- `text-green-500` - Checkmarks in plan features
- `from-green-600 to-emerald-600` - "BEST VALUE" badge gradient
- `text-red-500` - Error messages and required field asterisks

## Component-by-Component Breakdown

### 1. Progress Bar Section
```
Container: bg-zappy-light-blue ✅
Label: text-zappy-blue ✅
Track: bg-gray-200 ✅
Fill: bg-gradient-to-r from-zappy-pink to-zappy-blue ✅
Counter: text-gray-500 ✅
```

### 2. Condition Selection Cards
```
Border Default: border-gray-200 ✅
Border Hover: hover:border-zappy-pink ✅
Background Hover: hover:bg-zappy-light-yellow ✅
Title: text-gray-900 ✅
Description: text-gray-600 ✅
Time: text-zappy-blue ✅
```

### 3. Form Input Elements

**Select Inputs:**
```
Default Border: border-gray-200 ✅
Active Border: border-zappy-blue ✅
Focus Border: focus:border-zappy-blue ✅
Error Border: border-red-500 ⚠️
```

**Multiselect Options:**
```
Default: border-gray-200 bg-white ✅
Hover: hover:border-zappy-pink ✅
Selected: border-zappy-pink bg-zappy-light-yellow ✅
Checkbox: text-zappy-pink focus:ring-zappy-pink ✅
```

**Yes/No Buttons:**
```
Default: border-gray-200 bg-white ✅
Hover: hover:border-zappy-pink ✅
Selected: border-zappy-pink bg-zappy-light-yellow ✅
```

**Scale Buttons:**
```
Default: border-gray-200 ✅
Hover: hover:border-zappy-pink ✅
Selected: border-zappy-pink bg-zappy-pink text-white ✅
```

### 4. Navigation Buttons
```
Back Button: text-gray-600 hover:text-gray-900 ✅
Continue Button: bg-gradient-to-r from-zappy-pink to-zappy-blue text-white ✅
```

### 5. Plan Selection Section

**Success Icon:**
```
Background: bg-green-100 ⚠️
Icon: text-green-600 ⚠️
```

**Plan Cards:**
```
Default: border-gray-200 hover:border-zappy-pink ✅
Selected: border-zappy-pink bg-zappy-light-yellow ✅
Pricing: text-gray-900 ✅
Period: text-gray-500 ✅
Features: text-green-500 ⚠️
```

**Badges:**
```
Most Popular: from-zappy-pink to-zappy-blue ✅
Best Value: from-green-600 to-emerald-600 ⚠️
```

**Trust Badges:**
```
Icons: text-2xl (emojis) ✅
Text: text-gray-600 ✅
Divider: border-gray-200 ✅
```

### 6. Continue to Checkout Button
```
Enabled: bg-gradient-to-r from-zappy-pink to-zappy-blue text-white ✅
Disabled: bg-gray-200 text-gray-400 ✅
```

## Colors That Should Be Changed

### 1. Green Colors (Replace with Zappy colors)
- `bg-green-100` → `bg-zappy-light-yellow`
- `text-green-600` → `text-zappy-blue`
- `text-green-500` → `text-zappy-blue`
- `from-green-600 to-emerald-600` → `from-zappy-blue to-zappy-pink`

### 2. Red Error Color (Keep but could adjust)
- `text-red-500` → Could keep for errors or use `text-zappy-pink` with different styling

## Recommended Color Palette

### Primary Brand Colors Only
1. **Zappy Pink**: #f76d6d
2. **Zappy Blue**: #3c5b99
3. **Zappy Light Blue**: #eef2ff
4. **Zappy Light Yellow**: #fefce8

### Neutral Colors
1. **White**: #ffffff
2. **Gray-200**: #e5e7eb (borders)
3. **Gray-400**: #9ca3af (disabled)
4. **Gray-500**: #6b7280 (hints)
5. **Gray-600**: #4b5563 (secondary text)
6. **Gray-900**: #111827 (primary text)

### Semantic Colors
1. **Error**: #ef4444 (red-500) or use zappy-pink with error icon
2. **Success**: Use zappy-blue with checkmark icon
