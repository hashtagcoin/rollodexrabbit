export type Service = {
  id: string;
  title: string;
  description: string;
  category: string;
  format: string;
  price: number;
  provider: {
    id: string | null;
    business_name: string;
    verified: boolean;
  };
  media_urls?: string[] | null;
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
  address: string;
  sda_category: string;
  sda_listing: boolean;
  media_urls: string[];
  provider: {
    id: string | null;
    business_name: string;
    verified: boolean;
  };
};

export type ListingItem = Service | HousingListing;
export type ViewMode = 'grid' | 'list' | 'swipe';

// Type guard for Service
export function isServiceListing(item: ListingItem): item is Service {
  console.log('DEBUG isServiceListing: Item received:', JSON.stringify(item, null, 2));
  if (!item) {
    console.log('DEBUG isServiceListing: item is null or undefined');
    return false;
  }
  const hasCategory = Object.prototype.hasOwnProperty.call(item, 'category');
  const categoryIsString = typeof (item as Service).category === 'string';
  console.log(`DEBUG isServiceListing: hasCategory: ${hasCategory}, categoryIsString: ${categoryIsString}, category value: ${(item as any).category}`);

  const hasFormat = Object.prototype.hasOwnProperty.call(item, 'format');
  const formatIsString = typeof (item as Service).format === 'string';
  console.log(`DEBUG isServiceListing: hasFormat: ${hasFormat}, formatIsString: ${formatIsString}, format value: ${(item as any).format}`);

  const result = hasCategory && categoryIsString && hasFormat && formatIsString;
  console.log(`DEBUG isServiceListing: Overall result: ${result}`);
  return result;
}

// Type guard for HousingListing
export function isHousingListing(item: ListingItem): item is HousingListing {
  console.log('DEBUG isHousingListing: Item received:', JSON.stringify(item, null, 2));
  if (!item) {
    console.log('DEBUG isHousingListing: item is null or undefined');
    return false;
  }
  const hasWeeklyRent = Object.prototype.hasOwnProperty.call(item, 'weekly_rent');
  const weeklyRentIsNumber = typeof (item as HousingListing).weekly_rent === 'number';
  console.log(`DEBUG isHousingListing: hasWeeklyRent: ${hasWeeklyRent}, weeklyRentIsNumber: ${weeklyRentIsNumber}, weekly_rent value: ${(item as any).weekly_rent}`);

  const hasBedrooms = Object.prototype.hasOwnProperty.call(item, 'bedrooms');
  const bedroomsIsNumber = typeof (item as HousingListing).bedrooms === 'number';
  console.log(`DEBUG isHousingListing: hasBedrooms: ${hasBedrooms}, bedroomsIsNumber: ${bedroomsIsNumber}, bedrooms value: ${(item as any).bedrooms}`);

  const result = hasWeeklyRent && weeklyRentIsNumber && hasBedrooms && bedroomsIsNumber;
  console.log(`DEBUG isHousingListing: Overall result: ${result}`);
  return result;
}

// Helper function to check view mode to avoid TypeScript errors
export function isViewMode(value: string): value is ViewMode {
  return value === 'grid' || value === 'list' || value === 'swipe';
}

// This is a dummy component to satisfy Expo Router's need for a default export
// TypeScript types can't be used as values, so we need to export a real value
const DummyComponent = () => null;
export default DummyComponent;