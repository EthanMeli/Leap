import { supabase } from "../config/supabase.js";
import User from "../models/User.js";

export const updateProfile = async (req, res) => {
  try {
    const { image, ...otherData } = req.body;
    let updatedData = otherData;

    if (image && Array.isArray(image)) {
      try {
        const uploadPromises = image.map(async (img) => {
          // Only upload if it's a new base64 image
          if (img && img.startsWith('data:image')) {
            // Convert base64 to buffer
            const base64Data = img.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Generate unique filename
            const filename = `${req.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            
            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
              .from('profile-images')
              .upload(filename, buffer, {
                contentType: 'image/jpeg',
                upsert: true,
              });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('profile-images')
              .getPublicUrl(filename);

            return publicUrl;
          }
          // Return existing image URL as is
          return img;
        });

        const uploadedImages = await Promise.all(uploadPromises);
        updatedData.image = uploadedImages.filter(url => url);

      } catch (error) {
        console.error("Error uploading images: ", error);
        return res.status(400).json({
          success: false,
          message: "Error uploading images",
        });
      }
    }

    // Update user data in Supabase with transformed data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({
        name: otherData.name,
        age: otherData.age,
        gender: otherData.gender?.toLowerCase(),
        gender_preference: otherData.genderPreference?.toLowerCase(),
        bio: otherData.bio,
        interests: otherData.interests,
        image: updatedData.image,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (userError) throw userError;

    // Transform the response back to camelCase for frontend
    const transformedUser = {
      ...userData,
      genderPreference: userData.gender_preference,
    };
    delete transformedUser.gender_preference;

    res.status(200).json({
      success: true,
      user: transformedUser
    });

  } catch (error) {
    console.log("Error in updateProfile: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};