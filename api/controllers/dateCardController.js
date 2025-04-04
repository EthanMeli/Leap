import { supabase } from "../config/supabase.js";
import { getDateCardForMatch, createDateCardForMatch } from "../services/dateCardService.js";

export const getDateCard = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    // Verify the match exists and the user is part of it
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .or(`user_id.eq.${req.user.id},liked_user_id.eq.${req.user.id}`)
      .eq('id', matchId)
      .single();
    
    if (matchError) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }
    
    // Get date card
    let dateCard;
    try {
      dateCard = await getDateCardForMatch(matchId);
    } catch (error) {
      console.error("Error getting date card:", error);
      dateCard = null;
    }
    
    // If no date card exists, create one
    if (!dateCard) {
      try {
        const newDateCard = await createDateCardForMatch(matchId);
        return res.status(200).json({
          success: true,
          dateCard: newDateCard
        });
      } catch (error) {
        console.error("Error creating new date card:", error);
        
        // If RLS error, provide more helpful message
        if (error.code === '42501') {
          return res.status(403).json({
            success: false,
            message: "Permission denied: You don't have access to create a date card for this match",
            details: "This might be due to row-level security policies. Please make sure you are a participant in this match."
          });
        }
        
        return res.status(500).json({
          success: false,
          message: "Failed to create date card"
        });
      }
    }
    
    res.status(200).json({
      success: true,
      dateCard
    });
  } catch (error) {
    console.log("Error in getDateCard: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
