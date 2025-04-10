// c:\Users\bashi\Desktop\rollodex2\lib\__mocks__\supabase.ts

// Create a mock object that can be manipulated in tests
export const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }), // Default mock response
    // Add other Supabase methods used by the component if necessary
  })),
  // Mock other top-level Supabase client properties/methods if needed
  auth: {
    // Mock auth methods if used directly
  },
  storage: {
    // Mock storage methods if used directly
  },
};

export const supabase = mockSupabaseClient;
