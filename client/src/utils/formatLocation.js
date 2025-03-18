export const formatLocation = (displayName) => {
  if (!displayName) return "";
  
  try {
    const parts = displayName.split(", ");
    
    // Common words that indicate non-city parts
    const nonCityIndicators = [
      "county",
      "township",
      "district",
      "subdivision",
      "metropolitan",
      "municipality",
      "borough",
      "parish",
      "region",
      "territory",
      "province"
    ];

    // Filter out parts that contain non-city indicators (case insensitive)
    const filteredParts = parts.filter(part => 
      !nonCityIndicators.some(indicator => 
        part.toLowerCase().includes(indicator.toLowerCase())
      )
    );

    let city = null;
    let state = null;

    // Look for state abbreviation (e.g., "NY", "CA")
    const stateIndex = filteredParts.findIndex(part => /^[A-Z]{2}$/.test(part));
    
    if (stateIndex !== -1) {
      state = filteredParts[stateIndex];
      // Look for city before the state, avoiding numbered addresses
      for (let i = stateIndex - 1; i >= 0; i--) {
        const potentialCity = filteredParts[i];
        if (!potentialCity.match(/^\d/) && !potentialCity.match(/^[A-Z]{2}$/)) {
          city = potentialCity;
          break;
        }
      }
    }

    // If no state abbreviation found, look for full state name
    if (!state) {
      const stateIndex = filteredParts.findIndex(part => 
        part.match(/^(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)$/i)
      );
      
      if (stateIndex !== -1) {
        state = filteredParts[stateIndex];
        // Look for city before the state
        for (let i = stateIndex - 1; i >= 0; i--) {
          const potentialCity = filteredParts[i];
          if (!potentialCity.match(/^\d/) && !potentialCity.match(/^[A-Z]{2}$/)) {
            city = potentialCity;
            break;
          }
        }
      }
    }

    // If still no city/state found, use first non-numeric part as city and country as state
    if (!city || !state) {
      // Find first part that doesn't start with a number and isn't a country
      city = filteredParts.find(part => 
        !part.match(/^\d/) && 
        !part.match(/^[A-Z]{2}$/) &&
        part !== "United States" &&
        part !== "USA"
      ) || parts[0];
      
      // Use country or last part as state if no state found
      state = state || filteredParts[filteredParts.length - 1];
    }

    // Clean up any remaining parentheses or numbers
    city = city.replace(/\(.*?\)/g, '').trim();
    state = state.replace(/\(.*?\)/g, '').trim();

    return `${city}, ${state}`;
  } catch (error) {
    console.error("Error formatting location:", error);
    return displayName;
  }
};
