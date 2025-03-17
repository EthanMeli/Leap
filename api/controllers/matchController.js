import { getConnectedUsers, getIO } from "../socket/socket.server.js";
import { supabase } from "../config/supabase.js";

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

      // Get other user's data for notification
      const { data: likedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', likedUserId)
        .single();

      // Send notification in real-time with socket.io
      const connectedUsers = getConnectedUsers();
      const io = getIO();
      const likedUserSocketId = connectedUsers.get(likedUserId);
      if (likedUserSocketId) {
        io.to(likedUserSocketId).emit("newMatch", {
          _id: req.user.id,
          name: req.user.name,
          image: req.user.image,
        });
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
    // Get all matches for current user
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select(`
        liked_user_id,
        liked_users:users!matches_liked_user_id_fkey (
          id,
          name,
          image
        )
      `)
      .eq('user_id', req.user.id)
      .eq('is_match', true);

    if (matchError) throw matchError;

    // Transform data for frontend
    const transformedMatches = matches.map(match => ({
      _id: match.liked_users.id,
      name: match.liked_users.name,
      image: match.liked_users.image?.[0] || null
    }));

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