import User from "../models/User.js";
import { getConnectedUsers, getIO } from "../socket/socket.server.js";
import { supabase } from "../config/supabase.js";

export const swipeRight = async (req, res) => {
  try {
    const { likedUserId } = req.params;
    const currentUserId = req.user.id;

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
    const currentUser = await User.findById(req.user.id);

    if (!currentUser.dislikes.includes(dislikedUserId)) {
      currentUser.dislikes.push(dislikedUserId);
      await currentUser.save();
    }

    res.status(200).json({
      success: true,
      user: currentUser,
    });
  } catch (error) {
    console.log("Error in swipeLeft: ", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
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

    // First get the IDs of users that have been liked or matched
    const { data: matches } = await supabase
      .from('matches')
      .select('liked_user_id')
      .eq('user_id', req.user.id);
    
    const excludedUserIds = matches?.map(match => match.liked_user_id) || [];
    
    // Get users excluding the current user and previously liked/matched users
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .neq('id', req.user.id)
      .not('id', 'in', `(${excludedUserIds.join(',')})`)
      .order('created_at', { ascending: false });

    if (userError) throw userError;

    // Filter by gender preferences
    const filteredUsers = users.filter(user => {
      const matchesUserPreference = gender_preference === 'both' || user.gender === gender_preference;
      const matchesOtherPreference = user.gender_preference === 'both' || user.gender_preference === gender;
      return matchesUserPreference && matchesOtherPreference;
    });

    // Transform for frontend
    const transformedUsers = filteredUsers.map(user => ({
      _id: user.id,
      name: user.name,
      age: user.age,
      gender: user.gender,
      genderPreference: user.gender_preference,
      bio: user.bio,
      image: user.image?.[0] || null
    }));

    res.status(200).json({
      success: true,
      users: transformedUsers
    });
  } catch (error) {
    console.log("Error in getUserProfiles: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};