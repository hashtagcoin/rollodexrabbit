/**
 * Navigation helper functions for consistent behavior across the app
 */

import { router } from 'expo-router';

/**
 * Tab names for main sections of the app
 */
export type TabName = 'index' | 'discover' | 'community' | 'wallet' | 'profile' | 'housing';

/**
 * Navigate to a root tab, ensuring we always go to the main screen of that tab
 * @param tabName The tab to navigate to
 */
export function navigateToTab(tabName: TabName): void {
  // Reset scroll position
  window.scrollTo?.(0, 0);
  
  // Handle navigation differently based on tab
  switch(tabName) {
    case 'index':
      router.replace('/');
      break;
    case 'discover':
      router.replace('/(tabs)/discover');
      break;
    case 'community':
      router.replace('/(tabs)/community');
      break;
    case 'wallet':
      router.replace('/(tabs)/wallet');
      break;
    case 'profile':
      router.replace('/(tabs)/profile');
      break;
    case 'housing':
      router.replace('/(tabs)/housing');
      break;
    default:
      router.replace('/');
  }
}

/**
 * Reset the scroll position to the top
 * To be used when navigating between screens
 */
export function resetScrollPosition(): void {
  // Reset immediate scroll if available
  window.scrollTo?.(0, 0);
  
  // Also use setTimeout as a fallback to ensure scroll reset happens after render
  setTimeout(() => {
    window.scrollTo?.(0, 0);
  }, 50);
}
