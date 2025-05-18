/**
 * Navigation helper functions for consistent behavior across the app
 */

import { router } from 'expo-router';

/**
 * Tab names for main sections of the app
 */
export type TabName = 'index' | 'discover' | 'community' | 'wallet' | 'profile' | 'housing' | 'favorites';

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
      router.navigate('/(tabs)'); 
      break;
    case 'discover':
      router.navigate('/(tabs)/discover'); 
      break;
    case 'community':
      router.navigate('/(tabs)/community'); 
      break;
    case 'wallet':
      router.navigate('/(tabs)/wallet'); 
      break;
    case 'favorites':
      router.navigate('/(tabs)/favorites'); 
      break;
    case 'profile':
      router.navigate('/(tabs)/profile'); 
      break;
    case 'housing':
      router.navigate('/(tabs)/housing'); 
      break;
    default:
      router.navigate('/'); 
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
