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