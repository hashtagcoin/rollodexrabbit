import React, { PropsWithChildren } from 'react';
import { Session } from '@supabase/supabase-js';

export const useAuth = () => ({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
  },
  session: {
    access_token: 'test-token',
    // Add other necessary Session properties if needed by the component
  } as Session,
  loading: false,
});

// If the component uses the AuthProvider component directly (not just the hook)
// you might need to mock it too, though often just mocking the hook is enough.
// export const AuthProvider = ({ children }: PropsWithChildren) => <>{children}</>;
