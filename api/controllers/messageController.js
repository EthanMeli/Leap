import { getConnectedUsers, getIO } from "../socket/socket.server.js";
import { supabase } from "../config/supabase.js";

export const sendMessage = async (req, res) => {
  try {
    const { content, receiverId } = req.body;

    // Insert message into messages table
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: req.user.id,
          receiver_id: receiverId,
          content,
        }
      ])
      .select()
      .single();

    if (messageError) throw messageError;

    const io = getIO();
    const connectedUsers = getConnectedUsers();
    const receiverSocketId = connectedUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        message: newMessage,
      });
    }

    res.status(201).json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.log("Error in sendMessage: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getConversation = async (req, res) => {
  const { userId } = req.params;
  try {
    // Fetch conversation messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.log("Error in getConversation: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};