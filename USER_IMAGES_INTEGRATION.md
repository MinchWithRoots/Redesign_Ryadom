# User Images Integration Guide

## Overview
This document describes how user/companion images are integrated throughout the application using the new image assets.

## Image Paths
- User image directory: `public/images/users/`
- Image files:
  - `/images/users/id1-image.jpg` → Companion ID 1 (Мария К.)
  - `/images/users/id2-image.jpg` → Companion ID 2 (Алексей М.)
  - `/images/users/id3-image.jpg` → Companion ID 3 (Елена В.)

## Database Setup

### Step 1: Add Images to Database
Run the migration script `MIGRATE_USER_IMAGES.sql` in Supabase SQL Editor:
- Updates `companions.image` field with local image paths
- Updates `users.image` field with corresponding image paths
- Maps companion IDs 1-3 to their respective image files

### Step 2: Verify in Supabase
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `MIGRATE_USER_IMAGES.sql`
4. Execute the script
5. Verify by running:
   ```sql
   SELECT id, name, image FROM public.companions;
   SELECT id, name, image FROM public.users;
   ```

## Components Using Images

### 1. Search Results (`src/views/SearchView.vue`)
**Location**: Companion search grid and detail modal
- **Companion cards**: Displays full-size companion image
  ```vue
  <img
    :src="companion.image"
    :alt="companion.name"
    class="w-full h-full object-cover"
  />
  ```
- **Selected companion modal**: Shows circular avatar
  ```vue
  <img
    :src="selectedCompanion.image"
    :alt="selectedCompanion.name"
    class="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
  />
  ```

### 2. Companion Profile (`src/views/UserProfileView.vue`)
**Location**: Individual companion profile page
- Main companion image (large hero section)
  ```vue
  <img
    :src="companion.image"
    :alt="companion.name"
    class="w-full h-72 rounded-2xl object-cover"
  />
  ```
- In reviews section: User review avatars
  ```vue
  <img
    :src="review.users?.image"
    :alt="review.users?.name"
    class="w-10 h-10 rounded-full object-cover"
  />
  ```

### 3. Chat View (`src/views/ChatView.vue`)
**Location**: Active chat conversation
- Companion avatar in chat header
  ```vue
  <img
    :src="currentCompanion.image"
    :alt="currentCompanion.name"
    class="w-12 h-12 rounded-full object-cover"
  />
  ```

### 4. User Profile (`src/views/ProfileView.vue`)
**Location**: Logged-in user's profile page
- User profile avatar (circular)
  ```vue
  <img
    :src="userProfile.image"
    :alt="userProfile.name"
    class="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
  />
  ```

### 5. Companion List Component (`src/components/CompanionsFromSupabase.vue`)
**Location**: Reusable companion cards in various contexts
- Companion card image
  ```vue
  <img
    :src="companion.image"
    :alt="companion.name"
    class="h-full w-full object-cover"
  />
  ```

### 6. Home Page Reviews (`src/views/HomeView.vue`)
**Location**: Review carousel at bottom of home page
- Review author avatars
- Uses fallback image if not available
  ```vue
  :src="review.avatar || 'https://images.pexels.com/...'"
  ```

## Data Flow

### Service Layer (`src/services/supabaseService.ts`)
Fetches image data from database:

```typescript
// Companions with images
const { data } = await supabase
  .from('companions')
  .select(`*, reviews (rating, comment, title, users (name, image))`)

// Users with images
const { data } = await supabase
  .from('users')
  .select('*')

// Chats with companion images
const { data } = await supabase
  .from('chats')
  .select(`*, companions (name, image, specialization)`)

// Messages with sender images
const { data } = await supabase
  .from('messages')
  .select('*, users (name, image)')
```

## Image Rendering

All images use the standard Vue binding pattern:
```vue
<img
  :src="imageFieldFromDatabase"
  :alt="altText"
  class="object-cover"
/>
```

### Key Classes Used
- `object-cover`: Ensures image fills container while maintaining aspect ratio
- `rounded-full`: Circular avatars
- `rounded-2xl`: Rounded card images

## Adding New Companions/Users with Images

When adding new companions or users:

1. **Place image file** in `public/images/users/id{N}-image.jpg`
   - Replace `{N}` with the user ID

2. **Update database** via Supabase SQL Editor:
   ```sql
   UPDATE public.companions
   SET image = '/images/users/id{N}-image.jpg'
   WHERE id = {N};
   ```

3. **Verify** by:
   - Navigating to search page to see the new companion
   - Clicking on the companion to view their profile
   - Checking that the avatar appears in all locations (search, chat, profile, etc.)

## Image Best Practices

- **Format**: JPG/PNG recommended
- **Size**: Optimize for web (50-200KB ideal)
- **Dimensions**: Square images (1:1 ratio) work best for circular avatars
- **Fallback**: Currently using hardcoded fallback URLs; consider adding default avatar SVG

## Troubleshooting

### Image Not Appearing
1. **Check database**: Verify image path is correct in Supabase
   ```sql
   SELECT id, name, image FROM public.companions WHERE id = 1;
   ```
2. **Check file exists**: Verify file exists in `public/images/users/`
3. **Check path**: Ensure path starts with `/` (absolute from public root)
4. **Browser cache**: Hard refresh (Ctrl+Shift+R) to clear cache

### Wrong Image Showing
1. Verify ID mapping is correct in database
2. Check that companion/user ID matches image filename

### Images Not Loading in Production
1. Ensure files are in the build output (check `dist/images/users/`)
2. Verify public folder is copied to build
3. Check Vite config includes public folder in assets

## Future Enhancements

- [ ] Add image upload functionality for user profiles
- [ ] Implement image compression for faster loading
- [ ] Add image optimization pipeline
- [ ] Add fallback/placeholder components
- [ ] Implement lazy loading for images
- [ ] Add image error handling with default avatars
