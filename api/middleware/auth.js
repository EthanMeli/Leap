import { supabase } from "../config/supabase.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies["sb-token"];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized - No token provided"
      });
    }

    // Set auth header for this request
    supabase.auth.setSession(token);
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized - Invalid token"
      });
    }

    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;

    req.user = userData;
    next();

  } catch (error) {
    console.log("Error in auth middleware: ", error);
    res.status(401).json({
      success: false,
      message: "Not authorized"
    });
  }
};