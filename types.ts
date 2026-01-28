export interface TileDefinition {
  id: string;
  label: string;
  url: string; // Renamed from defaultUrl for clarity
  icon: string;
  imageUrl?: string; // Optional custom image URL
  description?: string;
}

export interface UserConfig {
  tiles: TileDefinition[];
  lastUpdated: string | null;
}