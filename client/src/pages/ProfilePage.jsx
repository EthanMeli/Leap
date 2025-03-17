import { useRef, useState, createRef, useEffect } from "react";
import { Header } from "../components/Header";
import { useAuthStore } from "../store/useAuthStore";
import { useUserStore } from "../store/useUserStore";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ImageGridItem from '../components/ImageGridItem';
import { MapPin } from 'lucide-react';
import toast from "react-hot-toast";

const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
};

const formatLocationName = (displayName) => {
  if (!displayName) return "";
  try {
    const parts = displayName.split(", ");
    // Find the city and state in the address parts
    const cityIndex = parts.findIndex(part => 
      !part.match(/^\d/) && // Not starting with number
      !part.match(/^[A-Z]{2}$/) && // Not a 2-letter country code
      !part.includes("County") // Not a county name
    );
    const stateIndex = parts.findIndex(part => 
      part.match(/^[A-Z]{2}$/) || // US state code
      part.includes("County") || // County name
      part.match(/^[A-Z][a-z]+( [A-Z][a-z]+)*$/) // State name
    );
    
    if (cityIndex !== -1 && stateIndex !== -1) {
      return `${parts[cityIndex]}, ${parts[stateIndex]}`;
    }
    return parts[0]; // Fallback to first part
  } catch (error) {
    console.error("Error formatting location:", error);
    return displayName;
  }
};

const ProfilePage = () => {
  const { authUser } = useAuthStore();
  const [name, setName] = useState(authUser?.name || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [age, setAge] = useState(authUser?.age || "");
  const [gender, setGender] = useState(authUser?.gender || "");
  const [genderPreference, setGenderPreference] = useState(
    authUser?.gender_preference ? authUser.gender_preference.toLowerCase() : ""
  );
  const [interests, setInterests] = useState(authUser?.interests || []);
  const [location, setLocation] = useState({
    latitude: authUser?.latitude || null,
    longitude: authUser?.longitude || null,
    name: authUser?.location_name || ""
  });
  const [images, setImages] = useState(() => {
    const initialImages = Array(9).fill("");
    if (authUser?.image) {
      authUser.image.forEach((img, i) => {
        if (i < 9) initialImages[i] = img;
      });
    }
    return initialImages;
  });

  // Moved useEffect after state initialization
  useEffect(() => {
    if (!authUser) return;
    
    setName(authUser.name || "");
    setBio(authUser.bio || "");
    setAge(authUser.age || "");
    setGender(authUser.gender || "");
    setGenderPreference(authUser.gender_preference?.toLowerCase() || "");
    setInterests(authUser.interests || []);
    
    setLocation({
      latitude: authUser.latitude || null,
      longitude: authUser.longitude || null,
      name: authUser.location_name || ""
    });

    const initialImages = Array(9).fill("");
    if (authUser.image) {
      authUser.image.forEach((img, i) => {
        if (i < 9) initialImages[i] = img;
      });
    }
    setImages(initialImages);
  }, [authUser]);

  const {loading, updateProfile} = useUserStore();
  const fileInputRefs = useRef(Array(9).fill(null).map(() => createRef())); // Create 9 refs
  const isTouch = useIsTouchDevice();

  // Add a loading state check
  if (!authUser) {
    return (
      <div className='min-h-screen bg-gray-50 flex flex-col'>
        <Header />
        <div className='flex-grow flex items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto'></div>
            <p className='mt-4 text-gray-600'>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const updateLocation = async () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Get location name
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();
            const simplifiedLocation = formatLocationName(data.display_name);
            
            // Just update local state, don't save to DB
            setLocation({
              latitude,
              longitude,
              name: simplifiedLocation
            });
          } catch (error) {
            console.error("Error getting location name:", error);
            toast.error("Error getting location name");
          }
        },
        (error) => {
          toast.error("Error getting location. Please enable location services.");
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!genderPreference) {
      toast.error("Please select a gender preference");
      return;
    }
    updateProfile({
      name, 
      bio, 
      age, 
      gender, 
      genderPreference, 
      image: images.filter(img => img !== ""), // Only send non-empty images
      interests,
      latitude: location.latitude,
      longitude: location.longitude,
      locationName: location.name
    });
  }

  const handleImageChange = async (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImages = [...images];
        newImages[index] = reader.result;
        setImages(newImages);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages[index] = "";
    setImages(newImages);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const newImages = Array.from(images);
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    
    // Swap the images instead of splicing
    [newImages[sourceIndex], newImages[destIndex]] = [newImages[destIndex], newImages[sourceIndex]];
    
    setImages(newImages);
  };

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col'>
      <Header />

      <div className='flex-grow flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-4xl'> {/* Increased max width */}
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>Your Profile</h2>

          {/* IMAGES GRID - Moved to top */}
          <div className='mt-8 bg-white py-4 sm:py-6 px-4 shadow sm:rounded-lg sm:px-6 border border-gray-200'>
            <label className='block text-sm font-medium text-gray-700 mb-2 sm:mb-4'>
              Profile Images (Maximum 9)
            </label>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable 
                droppableId="image-grid" 
                direction="horizontal"
                isDropDisabled={false}
              >
                {(provided, snapshot) => (
                  <div 
                    className={`grid grid-cols-3 gap-2 mb-4 md:max-w-[360px] md:mx-auto ${
                      snapshot.isDraggingOver ? 'bg-gray-50 rounded-lg' : ''
                    }`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      // Ensure grid maintains structure during drag
                      minHeight: snapshot.isDraggingOver ? '200px' : 'auto',
                    }}
                  >
                    {images.map((image, index) => (
                      <Draggable 
                        key={index.toString()} 
                        draggableId={index.toString()} 
                        index={index}
                        isDragDisabled={!image}
                      >
                        {(provided, snapshot) => (
                          <ImageGridItem
                            ref={provided.innerRef}
                            image={image}
                            index={index}
                            isTouch={isTouch}
                            onImageClick={() => fileInputRefs.current[index].current.click()}
                            onRemove={() => removeImage(index)}
                            provided={provided}
                            isDragging={snapshot.isDragging}
                          />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <div className='hidden'>
              {images.map((_, index) => (
                <input
                  key={index}
                  type='file'
                  accept='image/*'
                  onChange={(e) => handleImageChange(e, index)}
                  ref={fileInputRefs.current[index]}
                  className='hidden'
                />
              ))}
            </div>
          </div>

          {/* Rest of the form in a separate card */}
          <div className='mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200'>
            <form onSubmit={handleSubmit} className='space-y-6'>

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
                    className='appearance-none block w-full px-3 py-2 border border-gray-300
                      rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-300 focus:border-pink-300 
                      sm:text-sm'
                  />
                </div>
              </div>

              {/* AGE */}
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
                    className='appearance-none block w-full px-3 py-2 border border-gray-300
                      rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-300 focus:border-pink-300 
                      sm:text-sm'
                  />
                </div>
              </div>

              {/* GENDER */}
              <div>
                <span className='block text-sm font-medium text-gray-700'>
                  Gender
                </span>
                <div className='flex space-x-4'>
                  {["Male", "Female"].map((option) => (
                    <label key={option} className='inline-flex items-center'>
                      <input
                        type='radio'
                        className='form-radio text-pink-400'
                        name='gender'
                        value={option.toLowerCase()}
                        checked={gender === option.toLowerCase()}
                        onChange={() => setGender(option.toLowerCase())}
                      />
                      <span className='ml-2'>
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* GENDER PREFERENCE */}
              <div>
                <span className='block text-sm font-medium text-gray-700'>
                  Gender Preference
                </span>
                <div className='flex space-x-4'>
                  {["male", "female", "both"].map((option) => (
                    <label key={option} className='inline-flex items-center'>
                      <input
                        type='radio'
                        name='gender-preference'
                        className='form-radio text-pink-400'
                        value={option}
                        checked={genderPreference === option}
                        onChange={(e) => setGenderPreference(e.target.value)}
                      />
                      <span className='ml-2'>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* BIO */}
              <div>
                <label htmlFor='bio' className='block text-sm font-medium text-gray-700'>
                  Bio
                </label>
                <div className='mt-1'>
                  <textarea
                    id='bio'
                    name='bio'
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className='appearance-none block w-full px-3 py-2 border border-gray-300
                      rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-300 focus:border-pink-300 
                      sm:text-sm'
                  />
                </div>
              </div>

              {/* Interests */}
              <div>
                <label htmlFor='interests' className='block text-sm font-medium text-gray-700'>
                  Interests
                </label>
                <div className='mt-1'>
                  <div className='flex flex-wrap gap-2 mb-4'>
                    {interests.map((interest) => (
                      <span
                        key={interest}
                        className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          bg-pink-100 text-pink-800'
                      >
                        {interest}
                        <button
                          type='button'
                          onClick={() => setInterests(interests.filter(i => i !== interest))}
                          className='ml-1 text-pink-600 hover:text-pink-800'
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className='flex space-x-2'>
                    <input
                      id='newInterest'
                      name='newInterest'
                      type='text'
                      placeholder='Add new interest'
                      className='flex-1 appearance-none px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                        placeholder-gray-400 focus:outline-none focus:ring-pink-300 focus:border-pink-300 sm:text-sm'
                    />
                    <button
                      type='button'
                      onClick={() => {
                        const newInterest = document.getElementById('newInterest').value.trim();
                        if (newInterest && newInterest.length >= 2 && !interests.includes(newInterest)) {
                          setInterests([...interests, newInterest]);
                          document.getElementById('newInterest').value = '';
                        }
                      }}
                      className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium 
                        text-white bg-pink-400 hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300'
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* LOCATION */}
              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Location
                </label>
                <div className='mt-1 flex items-center gap-2'>
                  <span className='text-sm text-gray-600'>
                    {location.name || "No location set"}
                  </span>
                  <button
                    type='button'
                    onClick={updateLocation}
                    className='inline-flex items-center px-3 py-1 border border-transparent 
                      text-sm leading-4 font-medium rounded-md text-white bg-pink-400 
                      hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 
                      focus:ring-pink-300'
                  >
                    <MapPin className='mr-2 h-4 w-4' />
                    Update Location
                  </button>
                </div>
              </div>

              <button type='submit'
                className='w-full flex justify-center py-2 px-4 border-transparent rounded-md shadow-sm
                text-sm font-medium text-white bg-pink-400 hover:bg-pink-500
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500'
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )};

export default ProfilePage;