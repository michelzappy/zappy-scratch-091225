# Patient Portal Design Review Session

**Date:** September 29, 2025  
**Duration:** 45 minutes  
**Attendees:** UX Lead, UI Designer, Customer (Stakeholder), Product Manager, Developer

---

## Round 1: First Impressions

**Customer (Stakeholder):**
Look, I'm going to be direct - this looks... amateur. The orange and red hero banner is screaming at me. It doesn't feel like a healthcare app. When I think Hims or Noom, I think clean, minimal, sophisticated. This feels like a carnival. Where's the trust? Where's the calm medical vibe?

**UX Lead:**
Fair point. The color intensity is overwhelming. Healthcare UI should feel reassuring, not alarming. That orange-red gradient combo is too aggressive. We also have too much happening at once - urgent alerts, programs, actions. The visual hierarchy is fighting itself.

**UI Designer:**
Agreed on colors. But there's a bigger problem - the spacing and typography are inconsistent. Some text is 3xl, some is text-base. The rounded corners vary from rounded-2xl to rounded-3xl randomly. Cards have different padding. It looks like three different designers worked on this without talking to each other.

**Product Manager:**
From a business perspective, I'm worried about conversion. If the patient lands here and feels overwhelmed or distrustful, they bounce. We need to look premium but approachable. Think Apple Health meets a boutique wellness brand.

**Developer:**
Technically, I can implement whatever we decide. But I'd point out - we're using generic orange/red because "coral" isn't in Tailwind. We need a proper design system with defined brand colors first.

---

## Round 2: Specific Problems

**UI Designer:**
Let me list the specific issues:
1. Hero banner gradient: Orange-red is too hot, not medical
2. Card colors: Every program has different gradient tops - looks chaotic
3. Button styles: Mix of gradient and solid borders - inconsistent
4. Whitespace: Too cramped in some places, too spacious in others
5. Typography: Size jumps are jarring (text-sm to text-3xl)
6. Icons: Emojis are cute but not professional

**Customer:**
Yes! The emojis especially. I'm paying for medical care, not using a kids app. And those huge "3xl" refill numbers - why? Is bigger always better? It looks desperate.

**UX Lead:**
The information architecture bothers me. We show urgent actions, then programs, then delivery, then quick actions. But what does the patient ACTUALLY need first? Probably their current program status. Urgent actions should be subtle notifications, not giant red boxes.

**Product Manager:**
And we're missing trust signals. No provider photos, no "your provider is..." section, no progress indicators. Just raw data thrown at them. Patients need to feel cared for, not managed by a database.

**Developer:**
We also have inconsistent component patterns. Some cards use `bg-gradient-to-br`, others use `bg-gradient-to-r`. Some have `hover:scale-105`, others have `hover:scale-[1.02]`. This needs standardization.

---

## Round 3: Color & Brand Identity

**Customer:**
What if we look at what actually works? Hims uses soft greens and blues. Noom uses calming oranges with lots of white space. Ro uses sophisticated grays with purple accents. We're using... what? Angry orange?

**UI Designer:**
Let me propose a proper color system:
- Primary: Soft teal/sage (#10b981 emerald-500) - medical, trustworthy
- Accent: Warm coral (#fb7185 rose-400) - friendly, not aggressive  
- Neutral: Slate grays - professional
- Success: Emerald
- Alert: Amber (not red - too scary)
- Background: Off-white (#fafafa) with very subtle tints

**UX Lead:**
Yes! And we need to reduce color usage. Right now everything is a gradient. Let's use solid colors with ONE accent gradient for the hero. Everything else should be clean white cards with subtle shadows.

**Product Manager:**
That aligns with premium positioning. Think of it like this: we're not a discount pharmacy, we're a wellness partner. The design should whisper confidence, not shout features.

**Developer:**
I can set up CSS variables for these. But we need to decide: do we use Tailwind's built-in colors or extend with custom ones?

---

## Round 4: Layout & Hierarchy

**UX Lead:**
New proposed structure:
1. Greeting bar (simple, text-only, no huge banner)
2. At-a-glance status card (next dose, refills due, messages) - ONE card
3. Your Programs (clean list, not giant cards)
4. Secondary actions below fold

The key is: show only what matters RIGHT NOW above fold. Everything else scrolls.

**UI Designer:**
I'd design the program cards completely differently:
- Single white card per program
- Small colored accent bar on left (not top)
- Horizontal layout: Icon | Info | Metrics | CTA
- No gradients, no borders, just shadow
- Professional typography (Inter or SF Pro)

**Customer:**
Much better. But what about mobile? Right now those program cards would be a mess on phone. Can we go even simpler? One column, scan-able information?

**Product Manager:**
And add some personality back in a subtle way. Maybe provider avatars, progress charts, achievement badges. But done tastefully, not emoji carnival.

**Developer:**
For mobile, we could use a CSS Grid that collapses from 2-column to 1-column. And maybe we add skeleton loaders instead of that spinning circle? More modern.

---

## Round 5: Action Items & Solution

**Customer:**
Okay, so here's what I'm hearing as the fix:

**Brand Colors:**
- Replace orange/red with emerald/sage + rose accent
- Mostly white background
- One subtle gradient for hero only

**Layout:**
- Remove giant hero banner, make it a simple bar
- Single "Status Card" at top with key info
- Clean white program cards, horizontal layout
- Remove emoji icons, use lucide-react icons

**Typography:**
- Consistent scale: text-sm, text-base, text-lg, text-xl (no jumps)
- One font weight per element type
- More whitespace, less cramming

**Interaction:**
- Subtle hover states (no scale transforms)
- Professional shadows, not heavy
- Consistent border radius (rounded-xl everywhere)

Is that the plan?

**UI Designer:**
Yes! And I'd add:
- Remove all the tiny decorative gradients
- Use actual icons instead of emojis
- Add provider context ("Your provider: Dr. Smith")
- Show LESS information, but make it CLEARER

**UX Lead:**
Perfect. The mantra is: "Calm, Clear, Confident." Every element should pass that test. If it doesn't feel medical-professional, cut it.

**Product Manager:**
Timeline? Can we get a redesigned version by end of week? This is blocking our launch.

**Developer:**
If you give me a Figma file with the exact design system, I can rebuild this in a day. But I need:
- Exact hex colors
- Typography scale
- Component spacing
- Icon library choice
- Shadow values

**Customer:**
Let's do this. One more thing though - can we see competitors side-by-side? I want to make sure we're not just copying, but we're at least in the same league.

---

## Design Direction Summary

### Problems Identified:
1. **Color Overload:** Orange/red is too aggressive, unprofessional
2. **Visual Chaos:** Too many gradients, inconsistent styles
3. **Information Dump:** Everything shown at once, no hierarchy
4. **Childish Elements:** Emojis, huge numbers, carnival vibes
5. **No Trust Signals:** Missing provider context, progress, care
6. **Inconsistent Patterns:** Mixed component styles, spacing, typography

### Solution Direction:
1. **Sophisticated Color Palette:** Emerald/sage primary, rose accent, mostly white
2. **Minimal Design:** One hero gradient, everything else clean/flat
3. **Clear Hierarchy:** Status card → Programs → Actions (in that order)
4. **Professional Icons:** Lucide or Heroicons, not emojis
5. **Trust Elements:** Provider info, progress indicators, achievements
6. **Design System:** Consistent spacing, typography, shadows, borders

### Inspiration References:
- **Hims:** Clean, sophisticated, medical trust
- **Noom:** Friendly but professional, great use of white space
- **Ro:** Premium aesthetic, confident typography
- **Apple Health:** Minimal, clear data presentation
- **Headspace:** Calm color palette, soothing gradients

### Next Steps:
1. Create design system in Figma (colors, typography, components)
2. Redesign dashboard with new direction
3. Review with team before implementation
4. Developer implements with proper CSS variables
5. User test with real patients

---

**Meeting Conclusion:** Current design is too aggressive and unprofessional. Team agrees on complete visual redesign using calm, medical-appropriate colors (emerald/sage), minimal layout, professional icons, and consistent design system. Target: Premium wellness brand aesthetic.

**Priority:** HIGH - Blocking launch
**Timeline:** Design by Tuesday, Implementation by Thursday
**Owner:** UI Designer (Figma), Developer (Implementation)
