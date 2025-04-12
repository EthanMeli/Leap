import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { getSocket } from "../socket/socket.client";

export const useMatchStore = create((set, get) => ({
  matches: [],
  isLoadingMyMatches: false,
  isLoadingUserProfiles: false,
  userProfiles: [],
  swipeFeedback: null,
  noMoreProfiles: false,
  searchingForProfiles: false, // New state to track when "searching" for more profiles

  setNoMoreProfiles: (value) => set({ noMoreProfiles: value }),
  
  // New function to simulate searching for more profiles
  setSearchingForProfiles: (value) => set({ searchingForProfiles: value }),

  getMyMatches: async () => {
    try {
      set({ isLoadingMyMatches: true });
      const res = await axiosInstance.get("/matches");
      console.log("Fetched matches:", res.data.matches);
      set({ matches: res.data.matches });
    } catch (error) {
      set({ matches: [] });
      toast.error(error.response.data.message || "Something went wrong");
    } finally {
      set({ isLoadingMyMatches: false });
    }
  },

  getUserProfiles: async () => {
    try {
      set({ 
        isLoadingUserProfiles: true, 
        noMoreProfiles: false,
        searchingForProfiles: false
      }); // Reset all related flags when loading profiles
      
      const res = await axiosInstance.get("/matches/user-profiles");
      console.log("Fetched user profiles:", res.data.users);
      
      // If no profiles returned, set noMoreProfiles flag
      if (res.data.users.length === 0) {
        set({ noMoreProfiles: true });
      }
      
      set({ userProfiles: res.data.users });
    } catch (error) {
      set({ userProfiles: [], noMoreProfiles: true }); // Set flag on error too
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isLoadingUserProfiles: false });
    }
  },

  getDateCardForMatch: async (matchId) => {
    try {
      // If no matchId provided, return null
      if (!matchId) return null;

      const res = await axiosInstance.get(`/date-cards/${matchId}`);
      
      // Update the specific match with the date card
      const { matches } = get();
      const updatedMatches = matches.map(match => {
        if (match._id === res.data.dateCard.liked_user_id || 
            match.matchId === matchId) {
          return { ...match, dateCard: res.data.dateCard };
        }
        return match;
      });
      
      set({ matches: updatedMatches });
      return res.data.dateCard;
    } catch (error) {
      console.error("Error fetching date card:", error);
      return null;
    }
  },

  swipeLeft: async (user) => {
    try {
      set({ swipeFeedback: "passed" });
      await axiosInstance.post("/matches/swipe-left/" + user._id);
    } catch (error) {
      console.log(error);
      toast.error("Failed to swipe left");
    } finally {
      // Don't clear feedback immediately if this was the last profile
      // Let the SwipeArea component handle the timing
      setTimeout(() => set({ swipeFeedback: null }), 1500);
    }
  },
  
  swipeRight: async (user) => {
    try {
      set({ swipeFeedback: "liked" });
      await axiosInstance.post("/matches/swipe-right/" + user._id);
    } catch (error) {
      console.log(error);
      toast.error("Failed to swipe right");
    } finally {
      // Don't clear feedback immediately if this was the last profile
      // Let the SwipeArea component handle the timing
      setTimeout(() => set({ swipeFeedback: null }), 1500);
    }
  },

  unmatchUser: async (userId) => {
    try {
      console.log(`Attempting to unmatch user with ID: ${userId}`);
      
      const response = await axiosInstance.delete(`/matches/unmatch/${userId}`);
      console.log('Unmatch response:', response.data);
      
      if (response.data.success) {
        // Update local state to remove this match
        set((state) => {
          console.log(`Removing user ${userId} from matches`, state.matches);
          const updatedMatches = state.matches.filter((match) => match._id !== userId);
          console.log('Updated matches:', updatedMatches);
          return { matches: updatedMatches };
        });
        
        toast.success("User has been unmatched");
        return true;
      } else {
        throw new Error(response.data.message || "Failed to unmatch user");
      }
    } catch (error) {
      console.error("Failed to unmatch user:", error);
      toast.error(error.response?.data?.message || "Failed to unmatch user");
      return false;
    }
  },

  subscribeToNewMatches: () => {
    try {
      const socket = getSocket();

      socket.on("newMatch", (newMatch) => {
        // Add match to state
        set((state) => ({
          matches: [...state.matches, newMatch],
          swipeFeedback: "matched" // Show matched feedback on swipe
        }));
        
        // Reset the feedback after a delay
        setTimeout(() => set({ swipeFeedback: null }), 1500);
        
        // Show toast notification with more details when there's a date card
        if (newMatch.dateCard) {
          // Use string instead of JSX
          toast.success(`New match with ${newMatch.name}! A date has been suggested for you.`, { duration: 5000 });
        } else {
          toast.success(`You matched with ${newMatch.name}!`);
        }
      });
    } catch (error) {
      console.log(error);
    }
  },

  unsubscribeFromNewMatches: () => {
    try {
      const socket = getSocket();
      socket.off("newMatch");
    } catch (error) {
      console.error(error);
    }
  },
}));