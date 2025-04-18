import { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useMatchStore } from "../store/useMatchStore";
import { Frown, Loader } from "lucide-react";
import SwipeArea from "../components/SwipeArea";
import SwipeFeedback from "../components/SwipeFeedback";
import { useAuthStore } from "../store/useAuthStore";

const HomePage = () => {
  const {
    isLoadingProfiles, 
    getUserProfiles, 
    userProfiles, 
    noMoreProfiles,
    searchingForProfiles,
    subscribeToNewMatches, 
    unsubscribeFromNewMatches
  } = useMatchStore();
  const {authUser} = useAuthStore();

  useEffect(() => {
    getUserProfiles();
  }, [getUserProfiles]);

  useEffect(() => {
    authUser && subscribeToNewMatches();
    
    return () => {
      unsubscribeFromNewMatches();
    };
  }, [subscribeToNewMatches, unsubscribeFromNewMatches, authUser]);

  return (
    <div className='flex flex-col lg:flex-row h-screen bg-gradient-to-br from-orange-200 to-pink-300 overflow-hidden'>
      {/* Sidebar - fixed height with internal scrolling */}
      <Sidebar />
      
      {/* Main content area - takes remaining space */}
      <div className='flex-grow flex flex-col overflow-hidden'>
        <Header />
        {/* Content area with absolute centering */}
        <main className='flex-grow flex flex-col gap-10 justify-center items-center p-4 relative overflow-hidden'>
            {userProfiles.length > 0 && !isLoadingProfiles && !noMoreProfiles && !searchingForProfiles && (
              <>
                <SwipeArea />
                <SwipeFeedback />
              </>
            )}

            {searchingForProfiles && !isLoadingProfiles && (
              <SearchingForProfiles />
            )}

            {noMoreProfiles && !isLoadingProfiles && !searchingForProfiles && (
              <NoMoreProfiles />
            )}

            {isLoadingProfiles && <LoadingUI />}
        </main>
      </div>
    </div>
  );
}

export default HomePage;

// Add a new component for the "searching for profiles" state
const SearchingForProfiles = () => {
  return (
    <div className='flex flex-col items-center justify-center h-full text-center p-8'>
      <div className='relative mb-6'>
        <Loader className='text-white animate-spin' size={80} />
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='h-16 w-16 bg-gradient-to-r from-orange-300 to-pink-300 rounded-full opacity-30 animate-pulse'></div>
        </div>
      </div>
      <h2 className='text-3xl font-bold text-gray-800 mb-4'>Searching for new profiles...</h2>
      <p className='text-xl text-gray-600 mb-6'>Looking for your perfect match!</p>
    </div>
  )
};

const NoMoreProfiles = () => {
  return (
    <div className='flex flex-col items-center justify-center h-full text-center p-8'>
      <Frown className='text-white mb-6' size={80} />
      <h2 className='text-3xl font-bold text-gray-800 mb-4'>No more available profiles...</h2>
      <p className='text-xl text-gray-600 mb-6'>Come check back later for more potential matches!</p>
    </div>
  )
};

const LoadingUI = () => {
  return (
    <div className='relative w-full max-w-sm h-[28rem]'>
      <div className='card bg-white w-96 h-[28rem] rounded-lg overflow-hidden border border-gray-200 shadow-sm'>
        <div className='px-4 pt-4 h-3/4'>
          <div className='w-full h-full bg-gray-200 rounded-lg' />
        </div>
        <div className='card-body bg-gradient-to-b from-white to-pink-50 p-4'>
          <div className='space-y-2'>
            <div className='h-6 bg-gray-200 rounded w-3/4' />
            <div className='h-4 bg-gray-200 rounded w-1/2' />
          </div>
        </div>
      </div>
    </div>
  )
};