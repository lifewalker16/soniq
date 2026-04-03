import './MusicPlayer.css';
import {useState,useContext,useEffect} from 'react';
import { MyContext } from './MyContext';


function MusicPlayer(){

    const {currentSong,audioUrl,setAudioUrl,audioRef }=useContext(MyContext)
    
    const [isPlaying,setIsPlaying]=useState(false);
    const [progress,setProgress]=useState(0);
    const [currentTime,setCurrentTime]=useState(0);
    const [duration,setDuration]=useState(0);
    const [volume,setVolume]=useState(1);
    
  
    const togglePlay=()=>{
       if(!audioRef.current)return;

       if(isPlaying){
        audioRef.current.pause();
       }else{
         audioRef.current.play();
       }
       setIsPlaying(!isPlaying);
    }
    const  handleTimeUpdate=()=>{
        if(!audioRef.current)return;
        const current=audioRef.current.currentTime;
        const dur=audioRef.current.duration;
        if (!dur) return;
        setCurrentTime(current);
        setDuration(dur);
        setProgress((current/dur)*100);
        
    }
    const handleSeek=(e)=>{
        const value=e.target.value;
        if (!audioRef.current || !duration) return;
        audioRef.current.currentTime=(value/100)*duration;
        setProgress(value);
    }
    const formatTime=(time)=>{
        if(!time)return "00:00";

        const minutes=Math.floor(time/60);
        const seconds=Math.floor(time%60);

        return `${minutes}:${seconds<10?"0":""}${seconds}`;
    }

    const handleVolume=(e)=>{
      const value=parseFloat(e.target.value);
      setVolume(value);
      audioRef.current.volume=value;
    }
    const toggleMute = () => {
      const newVolume = volume === 0 ? 1 : 0;
      setVolume(newVolume);
      audioRef.current.volume = newVolume;
    };
   
    useEffect(()=>{
      if(!currentSong)return;
         
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        setCurrentTime(0);
        setProgress(0);
      }

      const fetchAudio =async()=>{
        try{
          const res = await fetch(`https://soniq-nmto.onrender.com/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(currentSong),
          });
          const data=await res.json();
          
          setAudioUrl(data.audioUrl);

        }catch(err){
           setAudioUrl("");
           console.log("Stream fetch error:",err);
        }
      };
      fetchAudio();
    },[currentSong]);

    useEffect(()=>{
     if(audioUrl&&audioRef.current){
       audioRef.current.play();
       setIsPlaying(true);
       setProgress(0);
     }
    },[audioUrl]);

    return(
        <div className='music-player'>
          
              <audio 
              src={audioUrl||null}
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              />
           
           <div className='player-left'>
                 <img src={currentSong?.thumbnail||"./cover"} alt="thumbnail"/>
                  <div className='player-left-text'>
                    <p style={{margin:0}}>{currentSong?.title || "No song"}</p>
                    <span>{currentSong?.uploader || ""}</span>
                  </div>
                  <i className="fa-solid fa-circle-plus"></i>
           </div>
           <div className='player-center'>
               <div className='controls'>
                 <i className="fa-solid fa-backward "></i>
                 <i style={{color:'black'}}className={` fa-solid play-pause ${isPlaying?"fa-pause":"fa-play"} `}
                 onClick={togglePlay}
                 ></i>
                 <i className="fa-solid fa-forward"></i>
               </div>
               
               <input
                type='range'
                value={progress}
                onChange={handleSeek}
                style={{ "--progress": `${progress}%` }}
                />
                <div className="time">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

           </div>

           <div className='player-right'>
              <i 
              className={`fa-solid ${volume==0?"fa-volume-xmark":"fa-volume-high"}`}
              onClick={toggleMute}
              ></i>
              <input
              type='range'
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolume}
              style={{ "--volume": `${volume * 100}%` }}
              />
           </div>
        </div>
    )
}
export default MusicPlayer;





// import './MusicPlayer.css';
// import { useState, useContext, useEffect } from 'react';
// import { MyContext } from './MyContext';

// function MusicPlayer() {
//   const { currentSong, audioUrl, setAudioUrl, audioRef } = useContext(MyContext);

//   const [isPlaying, setIsPlaying] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [currentTime, setCurrentTime] = useState(0);
//   const [duration, setDuration] = useState(0);
//   const [volume, setVolume] = useState(1);

//   const togglePlay = () => {
//     if (!audioRef.current) return;
//     if (isPlaying) {
//       audioRef.current.pause();
//     } else {
//       audioRef.current.play();
//     }
//     setIsPlaying(!isPlaying);
//   };

//   const handleTimeUpdate = () => {
//     if (!audioRef.current) return;
//     const current = audioRef.current.currentTime;
//     const dur = audioRef.current.duration;
//     if (!dur) return;
//     setCurrentTime(current);
//     setDuration(dur);
//     setProgress((current / dur) * 100);
//   };

//   const handleSeek = (e) => {
//     const value = e.target.value;
//     if (!audioRef.current || !duration) return;
//     audioRef.current.currentTime = (value / 100) * duration;
//     setProgress(value);
//   };

//   const formatTime = (time) => {
//     if (!time) return "00:00";
//     const minutes = Math.floor(time / 60);
//     const seconds = Math.floor(time % 60);
//     return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
//   };

//   const handleVolume = (e) => {
//     const value = parseFloat(e.target.value);
//     setVolume(value);
//     audioRef.current.volume = value;
//   };

//   const toggleMute = () => {
//     const newVolume = volume === 0 ? 1 : 0;
//     setVolume(newVolume);
//     audioRef.current.volume = newVolume;
//   };

//   useEffect(() => {
//     if (!currentSong) return;

//     if (audioRef.current) {
//       audioRef.current.pause();
//       audioRef.current.src = "";
//       setCurrentTime(0);
//       setProgress(0);
//     }

//     const fetchAudio = async () => {
//       try {
//         const res = await fetch(`http://localhost:3000/stream`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(currentSong),
//         });
//         const data = await res.json();
//         setAudioUrl(data.audioUrl);
//       } catch (err) {
//         setAudioUrl("");
//         console.log("Stream fetch error:", err);
//       }
//     };

//     fetchAudio();
//   }, [currentSong]);

//   useEffect(() => {
//     if (audioUrl && audioRef.current) {
//       audioRef.current.play();
//       setIsPlaying(true);
//       setProgress(0);
//     }
//   }, [audioUrl]);

//   return (
//     <div className='music-player'>

//       {/*
//         ✅ KEY FIX: crossOrigin="anonymous" is removed here.
        
//         Since /proxy is on the SAME origin as your frontend's API calls
//         (localhost:3000), the browser doesn't need CORS headers at all.
//         Adding crossOrigin="anonymous" would actually cause a preflight
//         OPTIONS request and could break things. Leave it off.
        
//         The Web Audio API (MagicRings) will now work because the audio
//         element's src is your own backend (/proxy), not a foreign CDN.
//       */}
//       <audio
//         src={audioUrl || null}
//         ref={audioRef}
//         onTimeUpdate={handleTimeUpdate}
//       />

//       <div className='player-left'>
//         <img src={currentSong?.thumbnail || "./cover"} alt="thumbnail" />
//         <div className='player-left-text'>
//           <p style={{ margin: 0 }}>{currentSong?.title || "No song"}</p>
//           <span>{currentSong?.uploader || ""}</span>
//         </div>
//         <i className="fa-solid fa-circle-plus"></i>
//       </div>

//       <div className='player-center'>
//         <div className='controls'>
//           <i className="fa-solid fa-backward"></i>
//           <i
//             style={{ color: 'black' }}
//             className={`fa-solid play-pause ${isPlaying ? "fa-pause" : "fa-play"}`}
//             onClick={togglePlay}
//           ></i>
//           <i className="fa-solid fa-forward"></i>
//         </div>

//         <input
//           type='range'
//           value={progress}
//           onChange={handleSeek}
//           style={{ "--progress": `${progress}%` }}
//         />
//         <div className="time">
//           <span>{formatTime(currentTime)}</span>
//           <span>{formatTime(duration)}</span>
//         </div>
//       </div>

//       <div className='player-right'>
//         <i
//           className={`fa-solid ${volume === 0 ? "fa-volume-xmark" : "fa-volume-high"}`}
//           onClick={toggleMute}
//         ></i>
//         <input
//           type='range'
//           min={0}
//           max={1}
//           step={0.01}
//           value={volume}
//           onChange={handleVolume}
//           style={{ "--volume": `${volume * 100}%` }}
//         />
//       </div>
//     </div>
//   );
// }

// export default MusicPlayer;