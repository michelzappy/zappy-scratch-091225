# Coral Color System for Patient Portal

**Primary Brand Color:** Coral (warm, friendly, medical-appropriate)

---

## Tailwind Color Mapping

Since `coral` is not a default Tailwind color, we use a combination of **rose** and **orange** to achieve coral tones:

### Primary Coral Tones:
- **coral-50** → `rose-50` (lightest backgrounds)
- **coral-100** → `rose-100` (light backgrounds, hover states)
- **coral-400** → `rose-400` (medium accents)
- **coral-500** → `rose-500` (primary buttons, main coral)
- **coral-600** → `rose-600` (hover states, darker coral)
- **coral-700** → `rose-700` (active states)

### Warm Coral Tones (Orange blend):
- **warm-coral-50** → `orange-50`
- **warm-coral-100** → `orange-100`
- **warm-coral-500** → `orange-500`

### Supporting Colors:
- **Success/Active:** `emerald-500` (keep for positive states)
- **Warning:** `amber-500`
- **Error:** `red-500`
- **Neutral:** `slate-50/100/200/600/700/900`
- **Background:** `slate-50`
- **Cards:** `white`

---

## Component Color Usage

### Buttons:
- **Primary CTA:** `bg-rose-500 hover:bg-rose-600` (coral)
- **Secondary:** `bg-slate-100 hover:bg-slate-200`
- **Danger:** `bg-rose-600 hover:bg-rose-700`

### Status Badges:
- **Active:** `bg-emerald-100 text-emerald-700`
- **Pending:** `bg-amber-100 text-amber-700`
- **Urgent:** `bg-rose-100 text-rose-700`

### Navigation:
- **Logo:** `text-rose-600` (coral)
- **Active Nav:** `bg-rose-50 text-rose-700`
- **Badges:** `bg-rose-500` (coral)

### Interactive Elements:
- **Links:** `text-rose-600 hover:text-rose-700`
- **Focus rings:** `ring-rose-500`
- **Progress bars:** `bg-rose-500`
- **Borders:** `border-rose-200`

### Accents:
- **Icons:** `text-rose-600` for primary actions
- **Highlights:** `bg-rose-50` for emphasized sections
- **Gradients:** `from-rose-500 to-orange-400` for hero sections

---

## Examples

### Button
```jsx
<button className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600">
  Primary Action
</button>
```

### Card with Coral Accent
```jsx
<div className="bg-white rounded-xl border-l-4 border-l-rose-500 p-6">
  Content
</div>
```

### Status Badge
```jsx
<span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full">
  Active
</span>
```

---

## Color Psychology

**Why Coral Works for Healthcare:**
- Warm and approachable (not clinical)
- Friendly and inviting
- Professional yet personal
- Gender-neutral appeal
- Energetic but not aggressive
- Perfect for wellness/lifestyle medicine

**Competitors Using Similar:**
- Hims uses soft blues/greens
- Noom uses orange/coral
- Ro uses purple/gray
- **We differentiate with coral primary**

---

## Implementation Checklist

- [x] Dashboard - coral colors
- [x] Sidebar - coral logo, navigation
- [x] Messages - coral message bubbles
- [x] Orders - coral buttons, accents
- [ ] Refill Check-in - coral progress, buttons
- [ ] New Consultation - coral flow, CTAs
- [ ] Profile - coral form elements
- [ ] Subscription - coral plans, badges
- [ ] Help - coral icons
- [ ] Medical Records - coral accents

---

**Brand Identity:** Warm, friendly, professional healthcare with coral as signature color.
