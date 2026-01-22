# R2 Avatar Upload Test Plan

## ✅ Quick Manual Test (5 minutes)

### Prerequisites
- App running (`npm run dev`)
- Signed in with a **real account** (not anonymous)
- Have a test image ready (PNG/JPG, < 2MB)

### Test Steps

1. **Navigate to Profile/Settings**
   - Find where the `ProfilePictureUpload` component is rendered
   - (Check auth settings or profile page)

2. **Test Upload - Drag & Drop**
   - Drag an image onto the upload area
   - ✅ Preview should appear immediately
   - Click "Save Avatar"
   - ✅ Should show "Uploading..." then save
   - ✅ Avatar should display in the preview area

3. **Test Persistence**
   - Refresh the page (F5)
   - ✅ Avatar should still be visible

4. **Test Avatar Display Component**
   - Navigate to any page that shows your user avatar
   - ✅ Should see your uploaded image (not initials)

5. **Test File Validation**
   - Try uploading a large file (> 2MB)
   - ✅ Should show: "File size must be less than 2MB"
   - Try uploading a PDF or text file
   - ✅ Should show: "Please select a valid image file..."

6. **Test Remove Avatar**
   - Click the "Remove" button
   - ✅ Avatar should be deleted
   - ✅ Should fall back to initials (colored circle)

7. **Test Replace Avatar**
   - Upload a new avatar
   - ✅ Old avatar should be automatically deleted from R2
   - ✅ New avatar should display

---

## 🔍 Backend Verification

### Check R2 Configuration
```bash
# Verify R2 component is installed
npx convex env ls | grep R2
```

### Check Schema has avatarKey
```bash
# Look for avatarKey in users table
grep -A 5 "defineTable.*users" convex/schema.ts
```

Expected: `avatarKey: v.optional(v.string())`

---

## 🐛 Troubleshooting

### Upload fails with auth error
- Make sure you're signed in with a **real account** (not anonymous)
- Check browser console for errors

### Avatar doesn't persist after refresh
- Check browser Network tab for `getAvatarUrl` query
- Verify signed URL is returned
- Check if R2 bucket is accessible

### CORS errors
- Check Cloudflare R2 bucket CORS settings
- Should allow GET requests from your domain

### Image doesn't display
- Check if signed URL is expired (default: 24 hours)
- Verify R2 bucket has public read access via signed URLs
- Check browser console for 403/404 errors

---

## 📝 What to Look For

### ✅ Success Indicators
1. Image uploads without errors
2. Avatar displays after refresh
3. Remove button works
4. Initials fallback shows when no avatar
5. File validation works (size, type)
6. Old avatars are cleaned up when uploading new ones

### ❌ Failure Indicators
1. Upload fails silently
2. Avatar disappears after refresh
3. Console errors about R2/CORS
4. Multiple old avatars not being deleted
5. Anonymous users can upload (should fail)

---

## 🎯 Quick One-Liner Test

**Upload → Refresh → Remove**

If this works smoothly, your R2 integration is solid!
