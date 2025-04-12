import TinderCard from "react-tinder-card";
import { useMatchStore } from "../store/useMatchStore";
import { useState, useEffect } from "react";

const SwipeArea = () => {
  const { 
    userProfiles, 
    swipeRight, 
    swipeLeft, 
    setNoMoreProfiles, 
    setSearchingForProfiles 
  } = useMatchStore();
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  
  // Keep track of remaining profiles for "no more profiles" logic
  useEffect(() => {
    // Reset this state when profiles are reloaded
    if (userProfiles.length > 0) {
      setNoMoreProfiles(false);
      setSearchingForProfiles(false);
    }
  }, [userProfiles, setNoMoreProfiles, setSearchingForProfiles]);

  const handleSwipe = (dir, user, index) => {
    if (dir === "right") swipeRight(user);
    else if (dir === "left") swipeLeft(user);
    
    // Reset image index when card is swiped
    setCurrentImageIndex(prev => {
      const newIndexes = {...prev};
      delete newIndexes[user._id];
      return newIndexes;
    });
    
    // If this was the last card, set up the sequence:
    // 1. Wait for swipe feedback to display (1500ms)
    // 2. Show searching animation (1500ms)
    // 3. Finally show no more profiles message
    if (index === userProfiles.length - 1) {
      console.log("Last profile swiped, starting sequence...");
      
      // First, set the searchingForProfiles state after the swipe feedback ends
      setTimeout(() => {
        setSearchingForProfiles(true);
        console.log("Now searching for more profiles...");
        
        // After another delay, show the no more profiles message
        setTimeout(() => {
          setSearchingForProfiles(false);
          setNoMoreProfiles(true);
          console.log("No more profiles found.");
        }, 2000); // Wait 2 seconds while "searching"
      }, 1600); // Wait just after the swipe feedback ends
    }
  };

  const handleImageTap = (e, userId, maxLength) => {
    e.preventDefault(); // Prevent TinderCard from handling the click
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isRightSide = clickX > rect.width / 2;
    
    setCurrentImageIndex(prev => {
      const currentIndex = prev[userId] || 0;
      let newIndex = currentIndex;

      if (isRightSide && currentIndex < maxLength - 1) {
        newIndex = currentIndex + 1;
      } else if (!isRightSide && currentIndex > 0) {
        newIndex = currentIndex - 1;
      }

      return { ...prev, [userId]: newIndex };
    });
  };

  return (
    <div className='relative w-full max-w-sm h-[28rem]'>
      {userProfiles.map((user, index) => {
        const images = user.image?.length > 0 ? user.image : ["/avatar.png"];
        const currentIndex = currentImageIndex[user._id] || 0;

        return (
          <TinderCard
            className='absolute shadow-none'
            key={user._id}
            onSwipe={(dir) => handleSwipe(dir, user, index)}
            swipeRequirementType='position'
            swipeThreshold={100}
            preventSwipe={["up", "down"]}
          >
            <div className='card bg-white w-96 h-[28rem] select-none rounded-lg overflow-hidden border border-gray-200'>
              <figure className='relative px-4 pt-4 h-3/4'>
                {/* Progress bars */}
                <div className='absolute top-2 left-0 right-0 z-10 flex justify-center gap-1 px-4'>
                  {images.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        index === currentIndex 
                          ? 'bg-pink-400 w-12' 
                          : 'bg-gray-300/50 w-8'
                      }`}
                    />
                  ))}
                </div>

                {/* Image with tap handlers */}
                <div
                  className='w-full h-full cursor-pointer'
                  onClick={(e) => handleImageTap(e, user._id, images.length)}
                >
                  <img
                    src={images[currentIndex]}
                    alt={user.name}
                    className='rounded-lg object-cover h-full w-full pointer-events-none'
                  />
                </div>
              </figure>
              <div className='card-body bg-gradient-to-b from-white to-pink-50'>
                <h2 className='card-title text-2xl text-gray-800'>
                  {user.name}, {user.age}
                </h2>
                <p className='text-gray-600'>{user.bio}</p>
              </div>
            </div>
          </TinderCard>
        );
      })}
    </div>
  );
};

export default SwipeArea;