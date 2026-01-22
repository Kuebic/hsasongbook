# Phase B: Username System Implementation

## Overview
Implement a proper identity system with unique usernames, required email, and optional display names.

## Requirements (from user discussion)

### Sign Up Flow
1. **Username** (required, unique, public)
   - 3-30 characters
   - Letters, numbers, underscores, hyphens allowed
   - Lowercase only
   - No spaces or special characters
   - Primary public identifier

2. **Email** (required)
   - For password recovery
   - Hidden by default from other users
   - User can toggle visibility in settings

3. **Password** (required)

### Settings (later)
- **Display Name / Real Name** (optional) - can be added anytime
- **Toggle**: "Show real name on contributions" (default: off, shows username)
- **Email visibility toggle**

### Migration
- Existing accounts: Auto-generate username from email prefix
- Test accounts will be deleted anyway

---

## Files to Modify

### Backend (Convex)

#### `convex/schema.ts` ✅ PARTIALLY DONE
Added fields:
- `username: v.optional(v.string())` - Unique public username
- `displayName: v.optional(v.string())` - Optional real name
- `showRealName: v.optional(v.boolean())` - Toggle for contributions
- Index: `by_username`

#### `convex/users.ts`
Add:
```typescript
// Query: Check if username is available
export const isUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.username.toLowerCase().trim();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalized))
      .first();
    return existing === null;
  },
});

// Mutation: Set username (called after signup)
export const setUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    const user = await ctx.db.get(userId);
    if (user?.username) throw new Error("Username already set");

    // Validate format
    const normalized = args.username.toLowerCase().trim();
    const usernameRegex = /^[a-z0-9_-]{3,30}$/;
    if (!usernameRegex.test(normalized)) {
      throw new Error("Username must be 3-30 characters, lowercase letters, numbers, underscores, or hyphens");
    }

    // Check uniqueness
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalized))
      .first();
    if (existing) throw new Error("Username is already taken");

    await ctx.db.patch(userId, { username: normalized });
    return { success: true };
  },
});
```

### Frontend

#### `src/features/auth/validation/authSchemas.ts`
Update `signUpSchema`:
```typescript
export const signUpSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-z0-9_-]+$/, 'Only lowercase letters, numbers, underscores, and hyphens allowed')
    .transform(val => val.toLowerCase()),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
```

#### `src/features/auth/components/SignUpForm.tsx`
Update to:
1. Add username field (first field)
2. Check username availability on blur (debounced)
3. Show availability indicator (green check / red X)
4. After Convex auth signup succeeds, call `setUsername` mutation
5. Only call `onSuccess` after both auth AND username are set

#### `src/features/auth/context/AuthProvider.tsx`
Update `signUpWithPassword` to accept username:
```typescript
const signUpWithPassword = useCallback(async (
  email: string,
  password: string,
  username: string  // NEW
) => {
  // 1. Create auth account
  await signIn("password", { email, password, flow: "signUp" });
  // 2. Set username (will need to wait for auth to complete first)
  // This is tricky - may need to be done in SignUpForm after auth completes
}, [signIn]);
```

#### `src/types/User.types.ts`
Add to User interface:
```typescript
export interface User {
  id: string;
  email?: string;
  username?: string;      // NEW
  displayName?: string;   // NEW
  showRealName?: boolean; // NEW
  isAnonymous: boolean;
  createdAt: string;
}
```

#### `src/features/auth/context/AuthProvider.tsx`
Update user mapping to include new fields:
```typescript
return {
  id: convexUser._id,
  email: convexUser.email,
  username: convexUser.username,
  displayName: convexUser.displayName,
  showRealName: convexUser.showRealName,
  isAnonymous: !hasEmail,
  createdAt: new Date(convexUser._creationTime).toISOString(),
};
```

---

## Implementation Order

### Step 1: Backend
1. ✅ Update schema (already done)
2. Add `isUsernameAvailable` query
3. Add `setUsername` mutation

### Step 2: Validation
1. Update `signUpSchema` to include username field
2. Add username validation rules

### Step 3: Types
1. Update `User` interface with username fields

### Step 4: AuthProvider
1. Update user mapping to include username
2. Update `signUp` function signature

### Step 5: SignUpForm
1. Add username input field
2. Add real-time availability check
3. Call `setUsername` after auth completes
4. Update success detection to wait for username

### Step 6: Profile Display
1. Update ProfilePage to show username
2. Update UserDropdown to show username
3. Update any "created by" displays to use username

---

## Edge Cases

### Username Already Taken
- Show error immediately on blur
- Prevent form submission
- Suggest alternatives? (optional)

### Auth Succeeds but Username Fails
- User is authenticated but has no username
- Show "complete your profile" prompt
- Don't allow full app access until username is set

### Existing Users Without Username
- Auto-generate from email prefix on next login
- Or prompt to set username

---

## Testing Checklist

- [ ] Sign up with valid username/email/password
- [ ] Username uniqueness enforced
- [ ] Username validation (length, characters)
- [ ] Email required validation
- [ ] Password requirements shown
- [ ] Real-time username availability check
- [ ] Error handling for taken username
- [ ] Profile shows username after signup
- [ ] Existing test account gets auto-generated username
