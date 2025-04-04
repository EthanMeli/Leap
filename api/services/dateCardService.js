import { supabase } from "../config/supabase.js";

// Try to import axios, but provide a fallback mechanism if it fails
let axios;
try {
  axios = (await import('axios')).default;
} catch (error) {
  console.warn("Axios not available, using fallback for venue lookup");
  // Create a simple fallback that mimics axios.get but always returns fallback data
  axios = {
    get: async () => ({ 
      data: [] // Empty data that will trigger the fallback venue logic
    })
  };
}

// Date categories with associated interests and image URLs
const DATE_CATEGORIES = {
  coffee: {
    interests: ["coffee", "conversation", "relaxing"],
    title: "Coffee Date",
    description: "Enjoy a cozy coffee together and get to know each other better.",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1287&q=80",
    type: "cafe"
  },
  dinner: {
    interests: ["food", "dining", "cooking", "wine"],
    title: "Dinner Date",
    description: "Share a delicious meal together at this lovely restaurant.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    type: "restaurant"
  },
  hiking: {
    interests: ["hiking", "outdoors", "fitness", "adventure", "nature"],
    title: "Hiking Adventure",
    description: "Explore the beauty of nature together on this scenic trail.",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    type: "hiking_trail"
  },
  museum: {
    interests: ["art", "culture", "history", "learning"],
    title: "Museum Visit",
    description: "Discover art and culture together at this fascinating museum.",
    image: "https://images.unsplash.com/photo-1565060169194-3b72aecbe791?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    type: "museum"
  },
  movie: {
    interests: ["movies", "cinema", "entertainment"],
    title: "Movie Night",
    description: "Enjoy the latest blockbuster together at this cinema.",
    image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    type: "cinema"
  },
  concert: {
    interests: ["music", "concerts", "entertainment", "live music"],
    title: "Live Music Date",
    description: "Experience the energy of live music together.",
    image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    type: "music_venue"
  },
  park: {
    interests: ["outdoors", "nature", "walking", "relaxing"],
    title: "Park Stroll",
    description: "Take a relaxing walk through this beautiful park.",
    image: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1772&q=80",
    type: "park"
  },
  beach: {
    interests: ["beach", "swimming", "outdoors", "water", "summer"],
    title: "Beach Day",
    description: "Soak up the sun and enjoy the waves together.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1773&q=80",
    type: "beach"
  },
  bowling: {
    interests: ["games", "fun", "competitive", "sports"],
    title: "Bowling Night",
    description: "Have a blast bowling together!",
    image: "https://images.unsplash.com/photo-1538511059235-bc51f972e3bf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1632&q=80",
    type: "bowling_alley"
  },
  gallery: {
    interests: ["art", "culture", "photography"],
    title: "Art Gallery Visit",
    description: "Appreciate art together at this gallery.",
    image: "https://images.unsplash.com/photo-1594733605297-91a1a69c9ee1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    type: "art_gallery"
  }
};

// Default date category if no matches found
const DEFAULT_DATE_CATEGORY = "coffee";

/**
 * Find common interests between two users
 */
const findCommonInterests = (interests1, interests2) => {
  if (!interests1 || !interests2) return [];
  
  const lowercaseInterests1 = interests1.map(i => i.toLowerCase());
  const lowercaseInterests2 = interests2.map(i => i.toLowerCase());
  
  return lowercaseInterests1.filter(interest => 
    lowercaseInterests2.includes(interest)
  );
};

/**
 * Find best match date category based on interests
 */
const findBestDateCategory = (commonInterests) => {
  // If no common interests, return default category
  if (!commonInterests || commonInterests.length === 0) {
    return DATE_CATEGORIES[DEFAULT_DATE_CATEGORY];
  }
  
  // Calculate score for each category based on matching interests
  const categoryScores = Object.entries(DATE_CATEGORIES).map(([category, data]) => {
    const matchCount = data.interests.filter(interest => 
      commonInterests.some(common => common.toLowerCase().includes(interest))
    ).length;
    
    return {
      category,
      score: matchCount,
      data
    };
  });
  
  // Sort by score (highest first)
  categoryScores.sort((a, b) => b.score - a.score);
  
  // Return the best matching category, or default if no matches
  return categoryScores[0].score > 0 
    ? categoryScores[0].data 
    : DATE_CATEGORIES[DEFAULT_DATE_CATEGORY];
};

/**
 * Generate a date in the future (between 3 and 7 days from now)
 */
const generateFutureDate = () => {
  const now = new Date();
  const daysInFuture = Math.floor(Math.random() * 5) + 3; // 3-7 days
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + daysInFuture);
  
  // Set to a reasonable time (between 5-8 PM)
  const hour = Math.floor(Math.random() * 4) + 17; // 5-8 PM
  futureDate.setHours(hour, 0, 0, 0);
  
  return futureDate;
};

/**
 * Find nearby venue based on location name and venue type
 */
const findNearbyVenue = async (locationName, venueType) => {
  try {
    console.log(`Looking for ${venueType} in ${locationName}`);
    
    // Format the venue type for display
    const formattedVenueType = venueType.split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    
    // Create fallback venue in case API call fails
    const fallbackVenue = {
      name: `Local ${formattedVenueType}`,
      latitude: null,
      longitude: null,
      address: `${formattedVenueType} in ${locationName}`,
    };
    
    // If no valid location name, return fallback
    if (!locationName || locationName.trim() === '') {
      console.warn('Invalid location name provided:', locationName);
      return fallbackVenue;
    }

    // Try to get venue from OpenStreetMap based on location name and venue type
    try {
      // Construct query with both location name and venue type
      const query = `${venueType} in ${locationName}`;
      const apiUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3`;
      
      console.log(`Making API request to: ${apiUrl}`);
      
      // Set a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      
      // Use Promise.race to implement timeout
      const response = await Promise.race([
        axios.get(apiUrl, {
          headers: {
            'User-Agent': 'LeapDatingApp/1.0' // Required by Nominatim
          }
        }),
        timeoutPromise
      ]);
      
      console.log(`API response received, found ${response.data?.length || 0} venues`);
      
      if (response.data && response.data.length > 0) {
        // Randomly select one from the top 3 results
        const venue = response.data[Math.floor(Math.random() * Math.min(response.data.length, 3))];
        
        console.log('Selected venue:', venue.display_name);
        
        return {
          name: venue.name || `${formattedVenueType} in ${locationName}`,
          latitude: parseFloat(venue.lat),
          longitude: parseFloat(venue.lon),
          address: venue.display_name,
        };
      } else {
        // If no specific venue found, try just the venue type in that location
        console.log('No specific venues found, trying broader search');
        
        const broadSearchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formattedVenueType)}&city=${encodeURIComponent(locationName)}&format=json&limit=1`;
        
        const broadResponse = await axios.get(broadSearchUrl, {
          headers: {
            'User-Agent': 'LeapDatingApp/1.0'
          }
        });
        
        if (broadResponse.data && broadResponse.data.length > 0) {
          const venue = broadResponse.data[0];
          return {
            name: venue.name || `${formattedVenueType} in ${locationName}`,
            latitude: parseFloat(venue.lat),
            longitude: parseFloat(venue.lon),
            address: venue.display_name,
          };
        }
      }
    } catch (apiError) {
      console.error('API error when finding venue:', apiError);
      // Continue to fallback
    }
    
    // Return fallback if API fails or no venue found
    return fallbackVenue;
  } catch (error) {
    console.error('Error finding venue:', error);
    
    // Fallback if entire function fails
    return {
      name: `${venueType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
      latitude: null,
      longitude: null,
      address: `${locationName}`,
    };
  }
};

/**
 * Extract city name from a location string
 */
const extractLocationCity = (locationString) => {
  if (!locationString) return '';
  
  // Try to extract city from common formats like "City, State" or "City, Country"
  const parts = locationString.split(',');
  if (parts.length > 0) {
    return parts[0].trim(); // Return the first part which is usually the city
  }
  
  return locationString.trim();
};

/**
 * Determine a midpoint location between two users
 */
const determineSharedLocation = (user1Location, user2Location) => {
  // If both users have the same location, use that
  if (user1Location && user2Location && 
      extractLocationCity(user1Location) === extractLocationCity(user2Location)) {
    return user1Location;
  }
  
  // If only one user has a location, use that
  if (user1Location && !user2Location) return user1Location;
  if (!user1Location && user2Location) return user2Location;
  
  // If both have different locations, choose one randomly
  // In a real app, you might want to find a midpoint or alternate between them
  if (user1Location && user2Location) {
    return Math.random() > 0.5 ? user1Location : user2Location;
  }
  
  // Fallback to a default location
  return 'New York, NY';
};

/**
 * Create a date card for a match
 */
export const createDateCardForMatch = async (matchId) => {
  try {
    // Get match details with user location data
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        user_id,
        liked_user_id,
        users!matches_user_id_fkey (
          id,
          interests,
          location_name
        ),
        liked_users:users!matches_liked_user_id_fkey (
          id,
          interests,
          location_name
        )
      `)
      .eq('id', matchId)
      .single();
    
    if (matchError) {
      console.error('Error fetching match:', matchError);
      throw matchError;
    }
    
    // Extract user data
    const user1 = match.users;
    const user2 = match.liked_users;
    
    console.log('User locations:', {
      user1: { location: user1.location_name },
      user2: { location: user2.location_name }
    });
    
    // Find common interests
    const commonInterests = findCommonInterests(user1.interests, user2.interests);
    
    // Determine best date category
    const dateCategory = findBestDateCategory(commonInterests);
    
    // Determine shared location
    const locationName = determineSharedLocation(
      user1.location_name, 
      user2.location_name
    );
    
    console.log('Using location:', locationName);
    
    // Find venue near the location
    let venue;
    try {
      venue = await findNearbyVenue(locationName, dateCategory.type);
    } catch (venueError) {
      console.error('Error finding venue, using fallback:', venueError);
      venue = {
        name: `Local ${dateCategory.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
        latitude: null,
        longitude: null,
        address: locationName || 'Nearby',
      };
    }
    
    // Generate future date
    const scheduledDate = generateFutureDate();
    
    // Create date card
    let dateCard;
    let dateCardError;
    
    try {
      const result = await supabase
        .from('date_cards')
        .insert([{
          match_id: matchId,
          title: dateCategory.title,
          description: dateCategory.description,
          location_name: venue.name,
          location_address: venue.address,
          latitude: venue.latitude,
          longitude: venue.longitude,
          scheduled_date: scheduledDate.toISOString(),
          image_url: dateCategory.image,
          interest_category: dateCategory.type
        }])
        .select()
        .single();
        
      dateCard = result.data;
      dateCardError = result.error;
    } catch (insertError) {
      console.error('Error during standard insert:', insertError);
      dateCardError = insertError;
    }
    
    if (dateCardError) throw dateCardError;
    
    return dateCard;
  } catch (error) {
    console.error('Error creating date card:', error);
    throw error;
  }
};

/**
 * Get date card for a match
 */
export const getDateCardForMatch = async (matchId) => {
  try {
    const { data: dateCard, error } = await supabase
      .from('date_cards')
      .select('*')
      .eq('match_id', matchId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // Ignore not found error
    
    return dateCard;
  } catch (error) {
    console.error('Error getting date card:', error);
    throw error;
  }
};
