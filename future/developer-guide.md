# Rollodex Developer Guide

## Development Environment Setup

### Prerequisites
- Node.js (v18+)
- Expo CLI
- Supabase CLI (for local development)
- Git

### Installation
1. Clone the repository
```bash
git clone <repository-url>
cd rollodex2
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` with your Supabase credentials.

4. Start the development server
```bash
npx expo start
```

## Project Structure

```
rollodex2/
├── app/               # Main application code
│   ├── (tabs)/        # Tab-based screens
│   │   ├── discover/  # Service discovery screens
│   │   ├── housing/   # Housing discovery screens
│   │   ├── profile/   # User profile screens
│   │   ├── rewards/   # Rewards & badges screens
│   │   └── wallet/    # Wallet & claims screens
│   ├── (auth)/        # Authentication screens
│   └── _layout.tsx    # Root layout component
├── components/        # Reusable components
├── lib/               # Utility functions and libraries
├── supabase/          # Supabase configuration
│   └── migrations/    # Database migrations
├── assets/            # Static assets
└── docs/              # Documentation
```

## Coding Standards

### TypeScript Best Practices

1. **Type Everything**: Always define proper types for props, state, and function parameters
2. **Avoid 'any'**: Use specific types or `unknown` when type is not yet known
3. **Error Handling**: Always follow the pattern below for error handling:

```typescript
try {
  // Code that might throw
} catch (e: unknown) {
  console.error('Error description:', e);
  setError(e instanceof Error ? e.message : 'An unknown error occurred');
}
```

### Component Guidelines

1. **Functional Components**: Use functional components with hooks
2. **Props Interface**: Define props interface for each component
3. **State Management**: Use React hooks for state management
4. **Style Organization**: Keep styles at the bottom of the file using StyleSheet.create

Example component structure:
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MyComponentProps {
  title: string;
  onPress: () => void;
}

export default function MyComponent({ title, onPress }: MyComponentProps) {
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    // Component logic
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Styles here
  },
  title: {
    // Styles here
  }
});
```

### Navigation Standards

1. **AppHeader Usage**: Always include AppHeader in screen components
2. **Back Button Behavior**: Use navigation.goBack() for consistent navigation
3. **Parameters**: Pass only necessary parameters between screens

Example navigation with AppHeader:
```typescript
import { useNavigation } from 'expo-router';
import AppHeader from '../../../components/AppHeader';

export default function ScreenComponent() {
  const navigation = useNavigation();
  
  return (
    <View style={styles.container}>
      <AppHeader 
        title="Screen Title" 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()} 
      />
      {/* Screen content */}
    </View>
  );
}
```

## Database Interaction

### Supabase Client Usage

1. **Import**: Import the supabase client from lib/supabase
2. **Authentication**: Use supabase.auth for user authentication
3. **Data Access**: Use supabase.from() to interact with tables
4. **RLS Policies**: Remember all tables have Row Level Security

Example database query:
```typescript
import { supabase } from '../../../lib/supabase';

async function fetchData() {
  try {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw error;
    return data;
  } catch (e: unknown) {
    console.error('Error fetching data:', e);
    throw e instanceof Error ? e : new Error('Unknown error occurred');
  }
}
```

### Database Migrations

1. **Location**: All migrations are in supabase/migrations/
2. **Naming**: Use timestamp_description.sql format
3. **Application**: Apply migrations using Supabase CLI

## Common Patterns

### Booking Flow

The booking process follows this pattern:
1. Check wallet balance for service category
2. Create booking record
3. Update wallet balance
4. Create claim record
5. Navigate to confirmation screen

### Error Handling

1. **Backend Errors**: Display specific error message from backend
2. **Network Errors**: Check for connectivity issues
3. **Fallback**: Always provide fallback error messages

### UI States

1. **Loading**: Show loading indicator during data fetching
2. **Empty State**: Provide guidance when no data is available
3. **Error State**: Show error message with recovery options

## Troubleshooting Common Issues

### Booking Errors

If encountering errors related to booking:
1. Check `book_service_fixed` function in migrations
2. Verify wallet balance calculation
3. Ensure all required parameters are passed correctly

### Navigation Issues

For navigation problems:
1. Verify AppHeader implementation
2. Check navigation parameters
3. Ensure correct use of navigation.goBack()

### Database Schema Issues

When encountering database errors:
1. Check schema in database-schema.md
2. Verify table structures and foreign keys
3. Review recent migrations

## Testing Guidelines

1. **Component Testing**: Test all components in isolation
2. **Screen Testing**: Test full screen functionality
3. **Integration Testing**: Test complete user flows

## Deployment Process

1. **Local Testing**: Test all changes locally first
2. **Supabase Migrations**: Apply migrations to development environment
3. **Build**: Create production build with Expo
4. **Testing**: Test the production build before release
5. **Release**: Deploy to app stores

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
