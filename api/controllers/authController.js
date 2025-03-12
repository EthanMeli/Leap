import { supabase } from "../config/supabase.js";

export const signup = async (req, res) => {
  const { name, email, password, age, gender, genderPreference, interests } = req.body;
  
  try {
    // Validation checks
    if (!name || !email || !password || !age || !gender || !genderPreference) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Create auth user with email confirmation disabled
    const { data: { user, session }, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, age, gender, gender_preference: genderPreference }
      }
    });

    if (authError) throw authError;

    if (!session) {
      return res.status(400).json({
        success: false,
        message: "Unable to create session. Please try logging in."
      });
    }

    // Create user profile after successful auth
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: user.id,
          name,
          email,
          age,
          gender: gender.toLowerCase(),
          gender_preference: genderPreference.toLowerCase(),
          interests: interests || [],
        }
      ])
      .select()
      .single();

    if (userError) {
      // Rollback auth user creation if profile creation fails
      await supabase.auth.admin.deleteUser(user.id);
      throw userError;
    }

    // Transform the response to match frontend expectations
    const transformedUserData = {
      ...userData,
      _id: userData.id, // Add _id field for frontend compatibility
      genderPreference: userData.gender_preference,
    };
    delete transformedUserData.gender_preference;

    // Set session cookie
    res.cookie("sb-token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      user: transformedUserData
    });

  } catch (error) {
    console.log("Error in signup: ", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;

    // Get user profile and transform for frontend
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) throw userError;

    // Transform the data
    const transformedUserData = {
      ...userData,
      _id: userData.id,
      genderPreference: userData.gender_preference,
    };
    delete transformedUserData.gender_preference;

    // Set session cookie
    res.cookie("sb-token", authData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      user: transformedUserData
    });

  } catch (error) {
    console.log("Error in login: ", error);
    res.status(401).json({
      success: false,
      message: "Invalid email or password"
    });
  }
};

export const logout = async (req, res) => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return res.status(500).json({
      success: false,
      message: "Error logging out"
    });
  }

  res.clearCookie("sb-token");
  res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
};