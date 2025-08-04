# Settings Page Implementation Guide

This guide shows how to integrate the new Settings page into your application.

## Files Created

1. **Settings Component**: `/src/components/Settings.tsx`
2. **Settings Styles**: `/src/components/Settings.css`
3. **Updated Migration Panel styles** for better integration

## Features

The Settings page includes:

### 1. **General Settings**
- Account information display
- Theme preferences (dark mode default)
- Language selection (English default)

### 2. **Profile Settings**
- Display name management
- Phone number
- Department information

### 3. **Notification Settings**
- Email notification preferences
- Order updates
- New customer alerts
- Low inventory warnings
- Daily/weekly reports

### 4. **Database Settings** (Admin/Manager only)
- **Migration Panel integrated here**
- Future tools: Export, Backup, Clear Cache

### 5. **Security Settings**
- Password management
- Two-factor authentication (planned)
- Active session management

## Integration Steps

### 1. Add Route to Your Router

In your main App.tsx or routing configuration:

```typescript
import Settings from './components/Settings';

// In your routes
<Route path="/settings" element={<Settings />} />
```

### 2. Add Settings Link to Navigation

In your navigation/header component:

```typescript
import { FaCog } from 'react-icons/fa';

// In your navigation menu
<Link to="/settings" className="nav-link">
  <FaCog />
  <span>Settings</span>
</Link>
```

### 3. Access Control

The Settings page automatically handles role-based access:
- **All users** can see: General, Profile, Notifications, Security
- **Admin/Manager/Brand Manager only** can see: Database tab (with Migration Panel)

### 4. Mobile Responsive

The Settings page is fully responsive:
- Desktop: Sidebar navigation
- Mobile: Full-width layout (sidebar hidden)

## Usage

### Running Migrations

1. Navigate to Settings → Database tab
2. Click "Run Dry Check" to see what needs updating
3. Click "Run Migration" to update the database

### Customizing Settings

To add new settings sections:

1. Add a new tab to `settingsTabs` array
2. Create a new component for your settings
3. Set `adminOnly: true` if restricted to admins

Example:
```typescript
{
  id: 'custom',
  label: 'Custom Settings',
  icon: <FaCustomIcon />,
  component: <CustomSettings />,
  adminOnly: false
}
```

## Screenshots/Layout

### Desktop Layout
```
+---------------------------+
| ← Settings                |
+--------+------------------+
| General| Account Info     |
| Profile| Theme: Dark      |
| Notif. | Language: EN     |
| Database|                 |
| Security|                 |
+--------+------------------+
```

### Database Tab (Admin view)
```
Database Management
- Migration Panel (integrated)
- Export Data (coming soon)
- Backup Database (coming soon)
- Clear Cache (coming soon)
```

## Testing

1. **Check role-based access**: Login as different user roles
2. **Test migration panel**: Run dry check and migration
3. **Mobile view**: Resize browser to test responsive design
4. **Navigation**: Ensure back button and routing work correctly

## Future Enhancements

1. **Functional implementations for**:
   - Theme switching
   - Language selection
   - Profile updates
   - Notification preferences saving
   - Password changes
   - 2FA setup

2. **Additional database tools**:
   - Data export functionality
   - Automated backups
   - Cache management

3. **User preferences persistence**:
   - Save preferences to Firestore
   - Apply preferences on login