import mongoose from 'mongoose';

// sender => type objectid ref user, req
// receiver => type objectid ref user
// content => type string, req
const messageSchema = new mongoose.Schema(
  {
    sender:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User",
      required:true
    },
    receiver:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User",
      required:true
    },
    content:{
      type:String,
      required:true
    } // createdAt, updatedAt
  }, 
  { timestamps:true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;