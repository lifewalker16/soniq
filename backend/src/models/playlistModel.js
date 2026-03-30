import { Schema ,model} from "mongoose";

const playlistSchema =new Schema({

    name:{
        type:String,
        required:true
    },
    songs:[
        {
            videoId:String,
            title:String,
            uploader:String,
            duration:Number,
            thumbnail:String,
            youtubeUrl:String
        }
    ],
    createdAt: {
    type: Date,
    default: Date.now
  }
});

const Playlist =model("Playlist",playlistSchema);
export {Playlist};
