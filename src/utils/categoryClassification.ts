import { PlaceCategoryType } from '../types';

export function classifyPlaceCategory(
  title: string = '',
  snippet: string = '',
  categoryHint?: string
): PlaceCategoryType {
  // If an exact known category is hinted
  const knownCategories: PlaceCategoryType[] = [
    'restaurant',
    'landmark',
    'park',
    'cafe',
    'nightlife',
    'shopping',
    'activity',
    'general',
  ];

  if (categoryHint && knownCategories.includes(categoryHint as PlaceCategoryType)) {
    return categoryHint as PlaceCategoryType;
  }

  const text = `${title} ${snippet} ${categoryHint || ''}`.toLowerCase();

  // Coffee & Cafes (checked before dining so specialty cafes get cafe category)
  if (
    /\b(cafe|café|coffee|espresso|roaster|roastery|bakery|bakehouse|patisserie|croissant|pastry|matcha|tea room|boba)\b/.test(
      text
    )
  ) {
    return 'cafe';
  }

  // Bars & Nightlife
  if (
    /\b(bar|pub|cocktail|speakeasy|brewery|beer|wine bar|winery|tavern|saloon|lounge|club|nightclub|taproom|cider)\b/.test(
      text
    )
  ) {
    return 'nightlife';
  }

  // Restaurants & Dining
  if (
    /\b(restaurant|bistro|eatery|dining|cuisine|kitchen|grill|trattoria|osteria|pizzeria|pizza|ramen|sushi|tacos|bbq|burger|diner|steakhouse|noodle|seafood|brunch|cantina|creperie)\b/.test(
      text
    )
  ) {
    return 'restaurant';
  }

  // Parks & Nature
  if (
    /\b(park|garden|botanical|preserve|reserve|nature|trail|viewpoint|overlook|beach|coastal|cove|waterfall|lake|forest|hill|pier|waterfront|quay|promenade|plaza verde)\b/.test(
      text
    )
  ) {
    return 'park';
  }

  // Landmarks & Culture
  if (
    /\b(museum|gallery|monument|memorial|cathedral|basilica|church|temple|shrine|castle|palace|tower|historic|heritage|ruins|bridge|fort|colosseum|opera house|sanctuary|arch|pantheon)\b/.test(
      text
    )
  ) {
    return 'landmark';
  }

  // Shopping & Markets
  if (
    /\b(market|bazaar|mall|boutique|store|shop|shopping|supermarket|grocer|flea market|arcade|mercantile)\b/.test(
      text
    )
  ) {
    return 'shopping';
  }

  // Attractions & Activities
  if (
    /\b(attraction|aquarium|zoo|amusement|theater|theatre|cinema|stadium|arena|observatory|ferris wheel|experience|tour|planetarium)\b/.test(
      text
    )
  ) {
    return 'activity';
  }

  return 'general';
}
