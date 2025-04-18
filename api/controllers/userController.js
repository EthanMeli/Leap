import { supabase } from "../config/supabase.js";

export const updateProfile = async (req, res) => {
  try {
    const { image, latitude, longitude, locationName, genderPreference, ...otherData } = req.body;
    let updatedData = { ...otherData };

    // Validate gender preference
    if (!genderPreference) {
      return res.status(400).json({
        success: false,
        message: "Gender preference is required"
      });
    }

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

    // Transform genderPreference to snake_case for database
    const updateData = {
      name: otherData.name,
      age: otherData.age,
      gender: otherData.gender?.toLowerCase(),
      gender_preference: genderPreference?.toLowerCase(), // Store as snake_case
      bio: otherData.bio,
      interests: otherData.interests,
      image: updatedData.image,
      latitude,
      longitude,
      location_name: locationName,
      updated_at: new Date().toISOString()
    };

    // Update user data in Supabase with transformed data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update(updateData)
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