# Theme Toggle Implementation Guide

## Overview
A comprehensive dark/light theme toggle system has been implemented across the entire Angular Meal Planner application. Users can switch between light and dark modes using a toggle button in the navbar.

## Implementation Details

### 1. Theme Service (`src/app/services/theme.service.ts`)
**Purpose**: Centralized theme management service

**Features**:
- Manages theme state using RxJS BehaviorSubject
- Persists theme preference in localStorage
- Automatically applies theme class to body element
- Observable stream for reactive theme updates

**Key Methods**:
- `toggleTheme()`: Switches between dark and light modes
- `isDarkMode()`: Returns current theme state
- `isDarkMode$`: Observable for theme changes

### 2. Navbar Integration
**Location**: `src/app/components/navbar/navbar.component.ts` & `.html`

**Features**:
- Theme toggle button with sun/moon icons
- Positioned next to user menu
- Smooth icon transitions with rotation effect
- Subscribes to theme changes for real-time updates

**Button Behavior**:
- Shows sun icon in light mode
- Shows moon icon in dark mode
- Hover effect with color and background changes
- Accessible with aria-label

### 3. Global Dark Theme Styles
**Location**: `src/styles.css`

**Dark Theme Color Palette**:
```css
--bg-primary: #1a1a2e (Main background)
--bg-secondary: #16213e (Cards, containers)
--bg-tertiary: #0f3460 (Inputs, nested elements)
--text-primary: #eaeaea (Main text)
--text-secondary: #b8b8b8 (Secondary text)
--border-color: #2d2d44 (Borders)
--card-bg: #16213e (Card backgrounds)
--shadow: rgba(0, 0, 0, 0.5) (Shadows)
```

**Applied to**:
- Body background color
- Scrollbar styling
- Text colors
- Container backgrounds

### 4. Component-Specific Dark Themes

#### Home Component (`home.component.scss`)
- Dark gradient background
- Light text colors
- Dark buttons with orange accent
- Dark category pills

#### Recipe Card Component (`recipe-card.component.scss`)
- Dark card backgrounds
- Enhanced shadows for depth
- Dark action menus and dropdowns
- Dark form inputs in dialogs
- Maintains orange accent color (#FF9F29)

#### Navbar Component (`navbar.component.scss`)
- Dark navbar background
- Light text for navigation links
- Dark dropdown menus
- Themed login button

#### Login Component (`login.component.scss`)
- Dark login container
- Dark form paper/card
- Themed form inputs
- Dark buttons with orange primary
- Dark alert messages

#### Meal Planner Landing (`meal-planner-landing.component.ts`)
- Dark gradient background
- Light text colors
- Dark action cards
- Themed back button

### 5. Theme Toggle Button Styles

**Navbar SCSS** (`navbar.component.scss`):
```scss
.theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-left: 12px;
    padding: 8px;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    color: #666;
    transition: all 0.3s ease;

    &:hover {
        background: rgba(255, 159, 41, 0.1);
        color: #FF9F29;
        svg {
            transform: rotate(20deg);
        }
    }
}
```

## Usage

### For Users:
1. Click the sun/moon icon in the navbar (top right)
2. Theme switches instantly across all pages
3. Preference is saved and persists across sessions

### For Developers:

**Adding Dark Theme to New Components**:

1. **In Component SCSS file**:
```scss
:host-context(body.dark-theme) .your-class {
    background: #16213e;
    color: #eaeaea;
}
```

2. **For dynamic theme-aware components**:
```typescript
import { ThemeService } from '../../services/theme.service';

constructor(public themeService: ThemeService) {}

ngOnInit() {
    this.themeService.isDarkMode$.subscribe(isDark => {
        // React to theme changes
    });
}
```

## Color Guidelines

### Light Mode:
- Background: #fafafa (off-white)
- Text: #333, #666 (dark grays)
- Accent: #FF9F29 (orange)
- Cards: #ffffff (white)

### Dark Mode:
- Background: #1a1a2e (dark blue-black)
- Text: #eaeaea, #b8b8b8 (light grays)
- Accent: #FF9F29 (orange - consistent)
- Cards: #16213e (dark blue)

## Components with Dark Theme Support

✅ **Fully Themed**:
- Navbar (all variations)
- Home page
- Recipe cards
- Login/Register page
- Meal Planner Landing
- Theme toggle button

✅ **Partial/Inherited Theming**:
- All pages inherit global dark theme styles
- Custom components may need additional styling

## Technical Architecture

### Theme Application Flow:
1. User clicks theme toggle button
2. ThemeService.toggleTheme() called
3. BehaviorSubject updates with new state
4. Body class toggled (`dark-theme` added/removed)
5. localStorage updated with preference
6. All components react via CSS cascade
7. Subscribed components update via observable

### State Management:
- **Source of Truth**: ThemeService BehaviorSubject
- **Persistence**: localStorage ('theme' key)
- **Application**: CSS class on body element
- **Reactivity**: RxJS Observable pattern

## Browser Compatibility
- Modern browsers with CSS custom properties support
- localStorage support required
- RxJS Observable support (included in Angular)

## Performance Considerations
- Theme toggle is instant (no reload required)
- CSS transitions provide smooth visual feedback
- localStorage read only on service initialization
- Minimal memory footprint (single BehaviorSubject)

## Future Enhancements
- [ ] System theme detection (prefers-color-scheme)
- [ ] Additional theme variants (blue, green, etc.)
- [ ] Per-component theme customization
- [ ] Theme preview before applying
- [ ] Scheduled theme switching (day/night)

## Testing Checklist
- ✅ Theme toggle button appears in navbar
- ✅ Theme switches on button click
- ✅ Theme persists after page reload
- ✅ All pages respond to theme changes
- ✅ No console errors
- ✅ Smooth transitions between themes
- ✅ Accessible keyboard navigation
- ✅ Icons update correctly

## Troubleshooting

**Theme not persisting**:
- Check browser localStorage permissions
- Verify ThemeService is provided at root level

**Component not themed**:
- Ensure `:host-context(body.dark-theme)` wrapper in SCSS
- Check CSS specificity conflicts
- Verify component imports ThemeService if needed

**Toggle button not visible**:
- Check navbar HTML template includes theme-toggle
- Verify button styles are loaded
- Check z-index stacking contexts

## Files Modified/Created

### Created:
- `src/app/services/theme.service.ts` - Core theme management

### Modified:
- `src/styles.css` - Global dark theme variables
- `src/app/components/navbar/*` - Theme toggle button
- `src/app/home/home.component.scss` - Dark theme styles
- `src/app/components/recipe-card/recipe-card.component.scss` - Dark card styles
- `src/app/pages/login/login.component.scss` - Dark login styles
- `src/app/pages/meal-planner-landing/meal-planner-landing.component.ts` - Dark styles

## Support
For issues or questions about the theme system, refer to this guide or check the ThemeService implementation.
