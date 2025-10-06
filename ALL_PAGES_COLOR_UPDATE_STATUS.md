# All Patient Pages - Color Update Status
## Systematic Coral/Cream Implementation

**Color Scheme:**
- Background: Cream-100 (#FAF7F0)
- Cards: White
- Primary Actions: Coral-500 (#E67E7B)
- Navigation: White sidebar + White mobile nav

---

## ✅ COMPLETED PAGES (3/15)

### 1. ✅ dashboard/page.tsx
- Background: cream-100
- Cards: white
- Buttons: coral-500
- Quick actions: white cards with coral icons

### 2. ✅ messages/page.tsx  
- Background: cream-100
- Message bubbles: coral-500 (patient)
- Send button: coral-500
- Selected conversation: coral-50 border

### 3. ✅ orders/page.tsx
- Background: cream-100
- Cards: white
- Progress bars: coral-500
- Track button: coral-500
- Links: coral-600

---

## 🔄 IN PROGRESS (Remaining 12 pages)

### High Priority (User Flow):

#### 4. ❌ login/page.tsx
**Changes needed:**
- Background: Keep white (auth pages)
- Logo/links: rose → coral
- Focus rings: rose → coral
- Buttons: rose → coral

#### 5. ❌ register/page.tsx
**Changes needed:**
- Background: Keep white (auth pages)
- Logo/links: rose → coral
- Focus rings: rose → coral
- Checkboxes: rose → coral

#### 6. ❌ profile/page.tsx
**Changes needed:**
- Background: cream-100
- Icons: rose → coral
- Tabs: rose → coral
- Toggles: rose → coral
- Links: rose → coral

### Medium Priority (Features):

#### 7. ❌ refill-checkin/page.tsx
**Changes needed:**
- Background: Keep white (form page)
- Progress bar: rose → coral
- Selected options: rose → coral
- Focus rings: rose → coral
- Info boxes: blue → coral (optional)

#### 8. ❌ subscription/page.tsx
**Changes needed:**
- Background: cream-100
- Badges: rose → coral
- Selected plans: rose → coral
- Links: rose → coral

#### 9. ❌ checkout/page.tsx
**Changes needed:**
- Background: Keep white (checkout)
- Step indicators: blue → coral
- Selected items: blue → coral
- Buttons: blue → coral

#### 10. ❌ help/page.tsx
**Changes needed:**
- Background: cream-100
- Icons: blue → coral
- Links: blue → coral

### Lower Priority (Supporting):

#### 11. ❌ consultation-submitted/page.tsx
**Changes needed:**
- Info box: blue → coral
- Step indicators: blue → coral

#### 12. ❌ subscription-checkout/page.tsx
**Changes needed:**
- Info box: blue → coral

#### 13. ❌ consultations/[id]/page.tsx
**Changes needed:**
- Status badges: blue → coral

#### 14. ❌ medical-records/page.tsx
**Changes needed:**
- Background: cream-100
- Any action buttons: → coral

#### 15. ❌ new-consultation/page.tsx
**Changes needed:**
- Background: Keep white (form)
- Buttons: → coral

---

## 📊 PROGRESS TRACKER

**Completed:** 3/15 (20%)
**Remaining:** 12/15 (80%)

**Next Steps:**
1. Update login/register (auth flow)
2. Update profile (high traffic)
3. Update refill-checkin (important feature)
4. Update subscription/checkout
5. Update remaining supporting pages

---

## 🎨 COLOR REPLACEMENT PATTERNS

```
COMMON REPLACEMENTS:
bg-slate-50 → bg-cream-100 (page backgrounds)
bg-rose-* → bg-coral-*
text-rose-* → text-coral-*
border-rose-* → border-coral-*
focus:ring-rose-* → focus:ring-coral-*

OPTIONAL (info boxes):
bg-blue-50 → bg-coral-50 (or keep blue for info)
text-blue-* → text-coral-* (or keep blue)

BUTTONS:
bg-slate-900 → bg-coral-500 (primary actions)
hover:bg-slate-800 → hover:bg-coral-600
```

---

## ⚠️ SPECIAL CASES

**Auth Pages (login/register):**
- Keep white background (standard for auth)
- Only update colors to coral

**Form Pages (refill-checkin, checkout):**
- Keep white background (better for forms)
- Only update accent colors

**Content Pages (dashboard, messages, orders, profile, etc):**
- Use cream-100 background
- White cards for content

---

**Status:** 20% Complete
**Last Updated:** December 9, 2025, 10:16 PM
