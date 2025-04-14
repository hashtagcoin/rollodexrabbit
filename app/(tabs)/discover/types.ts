export type Service = {
  id: string;
  title: string;
  description: string;
  category: string;
  format: string;
  price: number;
  provider: {
    business_name: string;
    verified: boolean;
  };
};

export type HousingListing = {
  id: string;
  title: string;
  description: string;
  weekly_rent: number;
  bedrooms: number;
  bathrooms: number;
  suburb: string;
  state: string;
  sda_category: string;
  media_urls: string[];
  provider: {
    business_name: string;
    verified: boolean;
  };
};

export type ListingItem = Service | HousingListing;
export type ViewMode = 'grid' | 'list' | 'swipe';

// Helper function to check view mode to avoid TypeScript errors
export function isViewMode(value: string): value is ViewMode {
  return value === 'grid' || value === 'list' || value === 'swipe';
}

// This is a dummy component to satisfy Expo Router's need for a default export
// TypeScript types can't be used as values, so we need to export a real value
const DummyComponent = () => null;
export default DummyComponent;