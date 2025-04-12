import { getConnectedUsers, getIO } from "../socket/socket.server.js";
import { supabase } from "../config/supabase.js";
import { createDateCardForMatch } from "../services/dateCardService.js";

export const swipeRight = async (req, res) => {
  try {
    const { likedUserId } = req.params;
    const currentUserId = req.user.id;

    // Check if interaction already exists
    const { data: existingMatch } = await supabase
      .from('matches')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('liked_user_id', likedUserId)
      .single();

    if (existingMatch) {
      return res.status(200).json({
        success: true,
        message: "Already swiped on this user"
      });
    }

    // Insert like into matches table
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .insert([
        {
          user_id: currentUserId,
          liked_user_id: likedUserId,
        }
      ])
      .select()
      .single();

    if (matchError) throw matchError;

    // Check if other user has liked current user
    const { data: otherUserLike, error: likeError } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id', likedUserId)
      .eq('liked_user_id', currentUserId)
      .single();

    if (likeError && likeError.code !== 'PGRST116') throw likeError; // ignore not found error

    if (otherUserLike) {
      // Update both records to mark as matches
      await Promise.all([
        supabase.from('matches').update({ is_match: true }).eq('id', matchData.id),
        supabase.from('matches').update({ is_match: true }).eq('id', otherUserLike.id)
      ]);

      // Create a date card for the match
      let dateCard = null;
      try {
        dateCard = await createDateCardForMatch(matchData.id);
        console.log("Date card created:", dateCard);
      } catch (dateCardError) {
        console.error("Error creating date card:", dateCardError);
        // Continue with the match even if date card creation fails
      }

      // Get other user's data for notification
      const { data: likedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', likedUserId)
        .single();

      // Send notification in real-time with socket.io
      const connectedUsers = getConnectedUsers();
      const io = getIO();
      
      // Enhanced notification data with match ID for date card fetching
      const matchNotification = {
        _id: req.user.id,
        name: req.user.name,
        image: req.user.image?.[0] || null,
        matchId: matchData.id,
        dateCard: dateCard || null,
      };
      
      const likedUserSocketId = connectedUsers.get(likedUserId);
      if (likedUserSocketId) {
        io.to(likedUserSocketId).emit("newMatch", matchNotification);
      }
      
      // Also notify the current user about the match
      const currentUserSocketId = connectedUsers.get(currentUserId);
      if (currentUserSocketId) {
        const currentUserNotification = {
          _id: likedUserId,
          name: likedUser.name,
          image: likedUser.image?.[0] || null,
          matchId: matchData.id,
          dateCard: dateCard || null,
        };
        io.to(currentUserSocketId).emit("newMatch", currentUserNotification);
      }
    }

    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.log("Error in swipeRight: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const swipeLeft = async (req, res) => {
  try {
    const { dislikedUserId } = req.params;
    const currentUserId = req.user.id;

    // Check if interaction already exists
    const { data: existingMatch } = await supabase
      .from('matches')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('liked_user_id', dislikedUserId)
      .single();

    if (existingMatch) {
      return res.status(200).json({
        success: true,
        message: "Already swiped on this user"
      });
    }

    // Record the dislike in matches table with is_match=false
    const { error: matchError } = await supabase
      .from('matches')
      .insert([
        {
          user_id: currentUserId,
          liked_user_id: dislikedUserId,
          is_match: false
        }
      ]);

    if (matchError) throw matchError;

    res.status(200).json({
      success: true
    });
  } catch (error) {
    console.log("Error in swipeLeft: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getMatches = async (req, res) => {
  try {
    // Get all matches for current user with date cards
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        liked_user_id,
        liked_users:users!matches_liked_user_id_fkey (
          id,
          name,
          image
        ),
        date_cards(*)
      `)
      .eq('user_id', req.user.id)
      .eq('is_match', true);

    if (matchError) throw matchError;

    // Transform data for frontend
    const transformedMatches = matches.map(match => {
      // Format the match data
      const matchData = {
        _id: match.liked_users.id,
        name: match.liked_users.name,
        image: match.liked_users.image?.[0] || null,
        matchId: match.id, // Include match ID for date card fetching
      };
      
      // Add date card if exists
      if (match.date_cards && match.date_cards.length > 0) {
        matchData.dateCard = match.date_cards[0];
      }
      
      return matchData;
    });

    res.status(200).json({
      success: true,
      matches: transformedMatches
    });
  } catch (error) {
    console.log("Error in getMatches: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getUserProfiles = async (req, res) => {
  try {
    const { gender, gender_preference } = req.user;
    console.log('Fetching profiles for user:', { id: req.user.id, gender, gender_preference });

    // Base query excluding current user
    let query = supabase
      .from('users')
      .select('*')
      .neq('id', req.user.id);

    // Get existing matches if any
    const { data: existingMatches, error: matchError } = await supabase
      .from('matches')
      .select('liked_user_id')
      .eq('user_id', req.user.id);

    if (matchError) throw matchError;

    // Only add the not-in filter if there are existing matches
    if (existingMatches && existingMatches.length > 0) {
      const interactedUserIds = existingMatches.map(match => match.liked_user_id);
      query = query.not('id', 'in', `(${interactedUserIds.join(',')})`);
    }

    // Handle gender preferences
    if (gender_preference === 'both') {
      // For users who prefer both, just filter by those who might be interested in them
      query = query.or(`gender_preference.eq.${gender},gender_preference.eq.both`);
    } else {
      // For users who prefer a specific gender, filter by that gender AND those who might be interested
      query = query
        .eq('gender', gender_preference)
        .or(`gender_preference.eq.${gender},gender_preference.eq.both`);
    }

    // Execute query with limit
    const { data: users, error } = await query.limit(50);

    if (error) {
      console.log('Supabase query error:', error);
      throw error;
    }

    // Transform for frontend
    const transformedUsers = users?.map(user => ({
      _id: user.id,
      name: user.name,
      age: user.age,
      gender: user.gender,
      genderPreference: user.gender_preference,
      bio: user.bio,
      image: user.image || [] // Return full image array instead of just first image
    })) || [];

    res.status(200).json({
      success: true,
      users: transformedUsers
    });

  } catch (error) {
    console.log("Error in getUserProfiles:", error);
    res.status(500).json({
      success: false, 
      message: "Internal server error"
    });
  }
};

export const unmatchUser = async (req, res) => {
  try {
    const { matchedUserId } = req.params;
    const currentUserId = req.user.id;
    
    console.log(`Attempting to unmatch: User ${currentUserId} from User ${matchedUserId}`);
    
    // First, find the match IDs to delete
    const { data: matchesToDelete, error: findError } = await supabase
      .from('matches')
      .select('id')
      .or(`user_id.eq.${currentUserId},user_id.eq.${matchedUserId}`)
      .or(`liked_user_id.eq.${currentUserId},liked_user_id.eq.${matchedUserId}`)
      .eq('is_match', true);
    
    if (findError) {
      console.error('Error finding matches to delete:', findError);
      throw findError;
    }
    
    console.log(`Found ${matchesToDelete?.length || 0} matches to delete`, matchesToDelete);
    
    if (matchesToDelete && matchesToDelete.length > 0) {
      // Extract match IDs
      const matchIds = matchesToDelete.map(match => match.id);
      
      // Delete date cards associated with these matches first
      const { error: dateCardError } = await supabase
        .from('date_cards')
        .delete()
        .in('match_id', matchIds);
      
      if (dateCardError) {
        console.error('Error deleting date cards:', dateCardError);
        // Continue anyway as this is secondary
      }
      
      // Delete the match records by IDs one by one to better diagnose issues
      for (const matchId of matchIds) {
        const { error: deleteMatchError } = await supabase
          .from('matches')
          .delete()
          .eq('id', matchId);
        
        if (deleteMatchError) {
          console.error(`Error deleting match ${matchId}:`, deleteMatchError);
          throw deleteMatchError;
        }
        console.log(`Successfully deleted match ID: ${matchId}`);
      }
      
      console.log(`Successfully deleted ${matchIds.length} matches`);
      
      // Also delete any messages between these users
      try {
        const { error: messageError } = await supabase
          .from('messages')
          .delete()
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${matchedUserId}),and(sender_id.eq.${matchedUserId},receiver_id.eq.${currentUserId})`);
        
        if (messageError) {
          console.error('Error deleting messages:', messageError);
        } else {
          console.log('Successfully deleted associated messages');
        }
      } catch (msgError) {
        console.error('Error attempting to delete messages:', msgError);
        // Continue as this is secondary
      }
    } else {
      console.log('No matches found to delete - trying direct deletion');
      
      // Try direct deletion as fallback
      const { error: directDeleteError } = await supabase
        .from('matches')
        .delete()
        .or(`and(user_id.eq.${currentUserId},liked_user_id.eq.${matchedUserId}),and(user_id.eq.${matchedUserId},liked_user_id.eq.${currentUserId})`);
      
      if (directDeleteError) {
        console.error('Error with direct match deletion:', directDeleteError);
        throw directDeleteError;
      }
      
      console.log('Direct deletion completed without errors');
    }
    
    res.status(200).json({
      success: true,
      message: "Successfully unmatched"
    });
  } catch (error) {
    console.log("Error in unmatchUser: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};