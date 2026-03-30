import { Schema,model } from "mongoose";

const recentSearchSchema= new Schema({

    songId:{
        type:String,
        required:true
    },
    title:String,
    url:String,
    thumbnail:String,
    uploader:String,

    playedAt:{
        type:Date,
        default:Date.now
    }
});
const RecentSearch=model("RecentSearch",recentSearchSchema);

export {RecentSearch};