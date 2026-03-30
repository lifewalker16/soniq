import mongoose from 'mongoose';
import "dotenv/config";

export const connectDB=async()=>{
    try{
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Mongo Connected DB Host :",mongoose.connection.host);
    }catch(err){
      console.log("Database Error",err);
    }
}
