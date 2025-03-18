import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { formatLocation } from '../utils/formatLocation';
import { MapPin } from 'lucide-react';
import { RadioCard } from './ui/RadioCard'; // Add this import
import { InterestCard } from './ui/InterestCard'; // Add this import

const SignUpForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [genderPreference, setGenderPreference] = useState("");
  const [interests, setInterests] = useState([]);
  const [customInterest, setCustomInterest] = useState("");
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [locationError, setLocationError] = useState("");

  const recommendedInterests = [
    "Travel",
    "Music",
    "Movies",
    "Fitness",
    "Food",
    "Photography",
    "Art",
    "Reading",
    "Gaming",
    "Sports"
  ];
  
  const { signup, loading } = useAuthStore();

  const requestLocation = async () => {
    if ("geolocation" in navigator) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });
        
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          const simplifiedLocation = formatLocation(data.display_name);
          setLocation({ latitude, longitude });
          setLocationName(simplifiedLocation);
          setLocationError(""); // Clear any existing error
        } catch (error) {
          console.error("Error getting location name:", error);
          setLocationError("Error getting location name");
        }
      } catch (error) {
        console.error("Error getting location:", error);
        if (error.code === 1) {
          setLocationError("Location permission denied. Please enable location services.");
        } else if (error.code === 2) {
          setLocationError("Location not available. Please try again.");
        } else {
          setLocationError("Error getting location. Please try again.");
        }
      }
    } else {
      setLocationError("Geolocation is not supported by your browser");
    }
  };

  useEffect(() => {
    // Only auto-request on desktop devices
    if (!/Mobi|Android/i.test(navigator.userAgent)) {
      requestLocation();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!location) {
      toast.error("Location is required");
      return;
    }
    if (interests.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }
    signup({
      name, 
      email, 
      password, 
      gender, 
      age: parseInt(age), 
      genderPreference,
      interests,
      latitude: location.latitude,
      longitude: location.longitude,
      locationName
    });
  };

  const handleInterestChange = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const addCustomInterest = (e) => {
    e?.preventDefault(); // Handle both button click and form submit
    if (!customInterest.trim()) {
      return;
    }
    
    const formatted = customInterest.trim();
    
    if (interests.includes(formatted)) {
      toast.error("This interest already exists!");
      return;
    }
    
    if (formatted.length < 2) {
      toast.error("Interest must be at least 2 characters long");
      return;
    }
    
    setInterests(prev => [...prev, formatted]);
    setCustomInterest("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomInterest(e);
    }
  };

  return (
    <form className='space-y-6'
      onSubmit={handleSubmit}
    >

      {/* NAME */}
      <div>
        <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
          Name
        </label>
        <div className='mt-1'>
          <input 
            id='name'
            name='name'
            type='text'
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            placeholder-gray-400 focus:outline-none focus:ring-pink-300 focus:border-pink-300 sm:text-sm'
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
          Email
        </label>
        <div className='mt-1'>
          <input 
            id='email'
            name='email'
            type='email'
            autoComplete='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            placeholder-gray-400 focus:outline-none focus:ring-pink-300 focus:border-pink-300 sm:text-sm'
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
          Password
        </label>
        <div className='mt-1'>
          <input 
            id='password'
            name='password'
            type='password'
            autoComplete='new-password'
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            placeholder-gray-400 focus:outline-none focus:ring-pink-300 focus:border-pink-300 sm:text-sm'
          />
        </div>
      </div>

      {/* Age */}
      <div>
        <label htmlFor='age' className='block text-sm font-medium text-gray-700'>
          Age
        </label>
        <div className='mt-1'>
          <input 
            id='age'
            name='age'
            type='number'
            required
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min='18'
            max='120'
            className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            placeholder-gray-400 focus:outline-none focus:ring-pink-300 focus:border-pink-300 sm:text-sm'
          />
        </div>
      </div>

      {/* GENDER */}
      <div>
        <label className='block text-sm font-medium text-gray-700'>
          Your Gender
        </label>
        <div className='mt-2 flex gap-2'>
          <div className='flex items-center'>
            <input 
              id='male'
              name='gender'
              type='radio'
              checked={gender === "male"}
              onChange={() => setGender("male")}
              className='h-4 w-4 text-purple-600 focus:ring-pink-300 border-gray-300 rounded'
            
            />
            <label htmlFor='male' className='ml-2 block text-sm text-gray-900'>
              Male
            </label>
          </div>
          <div className='flex items-center'>
            <input 
              id='female'
              name='gender'
              type='radio'
              checked={gender === "female"}
              onChange={() => setGender("female")}
              className='h-4 w-4 text-purple-600 focus:ring-pink-300 border-gray-300 rounded'
            />
            <label htmlFor='female' className='ml-2 block text-sm text-gray-900'>
              Female
            </label>
          </div>
        </div>
      </div>

      {/* GENDER PREFERENCE - Updated to use RadioCard */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preferred Gender
        </label>
        <div className="space-y-2 max-w-md">
          <RadioCard
            id="prefer-male"
            value="male"
            checked={genderPreference === "male"}
            onChange={(e) => setGenderPreference(e.target.value)}
            label="Male"
            icon="👨"
          />
          <RadioCard
            id="prefer-female"
            value="female"
            checked={genderPreference === "female"}
            onChange={(e) => setGenderPreference(e.target.value)}
            label="Female"
            icon="👩"
          />
          <RadioCard
            id="prefer-both"
            value="both"
            checked={genderPreference === "both"}
            onChange={(e) => setGenderPreference(e.target.value)}
            label="Both"
            icon="👥"
          />
        </div>
      </div>

      {/* INTERESTS SECTION - Updated with card UI */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-3'>
          Interests
        </label>
        <div className='grid grid-cols-2 gap-3 mb-4'>
          {recommendedInterests.map(interest => (
            <InterestCard
              key={interest}
              interest={interest}
              isSelected={interests.includes(interest)}
              onToggle={() => handleInterestChange(interest)}
            />
          ))}
        </div>

        {/* Custom Interest Input */}
        <div className='flex space-x-2'>
          <input
            type='text'
            value={customInterest}
            onChange={(e) => setCustomInterest(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder='Add custom interest'
            className='flex-1 appearance-none px-3 py-2 border border-gray-300 rounded-md shadow-sm 
              placeholder-gray-400 focus:outline-none focus:ring-pink-300 focus:border-pink-300 sm:text-sm'
          />
          <button
            type='button'
            onClick={addCustomInterest}
            className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium 
              text-white bg-pink-400 hover:bg-pink-500 focus:outline-none focus:ring-2 
              focus:ring-offset-2 focus:ring-pink-300'
          >
            Add
          </button>
        </div>

        {/* Selected Custom Interests */}
        {interests.filter(i => !recommendedInterests.includes(i)).length > 0 && (
          <div className='mt-4 flex flex-wrap gap-2'>
            {interests
              .filter(i => !recommendedInterests.includes(i))
              .map(interest => (
                <span
                  key={interest}
                  className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    bg-pink-100 text-pink-800'
                >
                  {interest}
                  <button
                    type='button'
                    onClick={() => handleInterestChange(interest)}
                    className='ml-1 text-pink-600 hover:text-pink-800'
                  >
                    ×
                  </button>
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Location Field */}
      <div>
        <label className='block text-sm font-medium text-gray-700'>
          Location
        </label>
        <div className='mt-1'>
          {locationError ? (
            <div className='flex flex-col gap-2'>
              <div className='text-red-500 text-sm'>{locationError}</div>
              <button
                type='button'
                onClick={requestLocation}
                className='inline-flex items-center px-4 py-2 border border-transparent 
                  text-sm font-medium rounded-md text-white bg-pink-400 
                  hover:bg-pink-500 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-pink-300'
              >
                <MapPin className='mr-2 h-4 w-4' />
                Share Location
              </button>
            </div>
          ) : location ? (
            <div className='flex items-center justify-between'>
              <div className='text-sm text-gray-600'>
                {locationName || 'Location detected'}
              </div>
              <button
                type='button'
                onClick={requestLocation}
                className='inline-flex items-center px-3 py-1 border border-transparent 
                  text-sm font-medium rounded-md text-white bg-pink-400 
                  hover:bg-pink-500 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-pink-300'
              >
                <MapPin className='mr-2 h-4 w-4' />
                Update
              </button>
            </div>
          ) : (
            <div className='flex flex-col gap-2'>
              <div className='text-sm text-gray-600'>Location required</div>
              <button
                type='button'
                onClick={requestLocation}
                className='inline-flex items-center px-4 py-2 border border-transparent 
                  text-sm font-medium rounded-md text-white bg-pink-400 
                  hover:bg-pink-500 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-pink-300'
              >
                <MapPin className='mr-2 h-4 w-4' />
                Share Location
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <button 
          type='submit'
          className={`w-full flex justify-center py-2 px-4 border border-transparent
            rounded-md shadow-sm text-sm font-medium text-white ${
              loading
                ? "bg-pink-400 cursor-not-allowed"
                : "bg-pink-400 hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
          }`}
          disabled={loading}
        >
          Create Account
        </button>
      </div>

    </form>
  );
};

export default SignUpForm;