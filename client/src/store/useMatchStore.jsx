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

  getMyMatches: async () => {
    try {
      set({ isLoadingMyMatches: true });
      const res = await axiosInstance.get("/matches");
      console.log("Fetched matches:", res.data.matches);
      set({ matches: res.data.matches });
    } catch (error) {
      set({ matches: [] });
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isLoadingMyMatches: false });
    }
  },

  getUserProfiles: async () => {
    try {
      set({ isLoadingUserProfiles: true });
      const res = await axiosInstance.get("/matches/user-profiles");
      console.log("Fetched user profiles:", res.data.users);
      set({ userProfiles: res.data.users });
    } catch (error) {
      set({ userProfiles: [] });
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
      setTimeout(() => set({ swipeFeedback: null }), 1500);
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
          // Use a function syntax instead of JSX directly
          toast.success(() => (
            <div>
              <p className="font-bold">New match with {newMatch.name}!</p>
              <p className="text-sm">A date has been suggested for you.</p>
            </div>
          ), { duration: 5000 });
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
