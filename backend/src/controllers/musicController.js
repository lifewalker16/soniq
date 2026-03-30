import ytdlp from "yt-dlp-exec";
import { RecentSearch } from "../models/musicModel.js";

const searchCache=new Map();
export const search=async(req,res)=>{
    const query=req.query.q;
    if(searchCache.has(query)){
        return res.json(searchCache.get(query));
    }
    
    try{
        const result =await ytdlp(`ytsearch3:${query}`,{
            dumpSingleJson:true,
            noWarnings:true,
        }); 
        const clean = result.entries
            .map(video=>({
                id: video.id,
                title: video.title,
                url: video.webpage_url,
                duration: video.duration,
                thumbnail: video.thumbnail,
                uploader: video.uploader
            }));
        searchCache.set(query,clean);
        return res.json(clean);

    }catch(err){
        return res.status(500).json({error:"Failed to find song"});
    }

}


const streamCache=new Map();
export const stream= async(req,res)=>{
       const {url,id,title,thumbnail,uploader}=req.body;
       if(streamCache.has(url)){
        return res.json({audioUrl:streamCache.get(url)})
       }

       try{
           const info=await ytdlp(url,{
            dumpSingleJson:true,
            noWarnings:true,
            format:"bestaudio"
           });

           const audioUrl=info.url;
           streamCache.set(url,audioUrl);
           res.json({audioUrl});

           setTimeout(() => {
               saveRecentSongs({ id, title, url, thumbnail, uploader });
            }, 0);

       }catch(err){
           return res.status(500).json({error:"Failed To play song"})
       }
}


const saveRecentSongs=async({id,title,thumbnail,url,uploader})=>{

    try{
        await RecentSearch.findOneAndUpdate(
            { songId: id },
            {
                title,
                url,
                thumbnail,
                uploader,
                playedAt: Date.now()
            },
            { upsert: true }
        );
        const total = await RecentSearch.countDocuments();
         if (total > 10) {
            const oldest = await RecentSearch.find().sort({ playedAt: 1 }).limit(total - 10);

            const ids = oldest.map(item => item._id);

            await RecentSearch.deleteMany({ _id: { $in: ids } });
        }

    }catch(err){
        console.error("Failed to save recent songs", err);
    }

}

export const getRecent = async (req, res) => {
    try {
        const songs = await RecentSearch.find()
            .sort({ playedAt: -1 })
            .limit(10);

        res.json(songs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch recent songs" });
    }
};

export const deleteRecentSong=async(req,res)=>{
    try{
        await RecentSearch.findOneAndDelete({songId:req.params.id});
        res.json({message:"deleted"});

    }catch(err){
        res.status(500).json({ error: "Failed to delete" });
    }
}

