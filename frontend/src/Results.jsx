import './Results.css';
import { MyContext } from './MyContext';
import { useContext, useRef, useEffect,useCallback } from 'react';
import { useState } from 'react';

function Results(){
    const resultsRef=useRef(null);

    const {setCurrentSong,query, results,setResults,inputRef,recentSongs,setRecentSongs,setShowRecent}=useContext(MyContext);

    

    const handleCancel = useCallback(() => {
        setResults([]);
        setShowRecent(false);
    }, [setResults, setShowRecent]);
        
    useEffect(()=>{
        const handleClickOutside=(e)=>{
            if(resultsRef.current&&!resultsRef.current.contains(e.target)&&inputRef.current&&!inputRef.current.contains(e.target)){
                handleCancel();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    },[handleCancel]);
    
    const handleDelete=async(id)=>{
     
        try{
            await fetch(`http://localhost:3000/recent/${id}`,{
                method:"DELETE"
            });
            setRecentSongs(prev => prev.filter(song => song.songId !== id));

        }catch(err){
            console.error("Delete failed:", err);
        }


    }

    return (
        <div className="results" ref={resultsRef}> 
            {query.trim() === "" && recentSongs.length > 0 && (
                <p className="recent-title">Recent Searches</p>
            )}
            
                <div className={query.trim() === "" ? "songs-list scrollable" : "songs-list"}>
                    { query.trim()==""?
                    (  
                            recentSongs.map(song=>(
                            <div key={song.songId} className='video-card'>
                                <img src={song.thumbnail} alt={song.title}/>
                                <div className='card-text-container' onClick={()=>setCurrentSong(song)}>
                                    <p>{song.title}</p>
                                    <span>{song.uploader}</span>
                                </div>
                                <div className='add-song' onClick={() => song.songId && handleDelete(song.songId)} >
                                    <i className="fa-solid fa-x"></i>
                                </div>
                            </div>
                        ))

                    ):
                    (
                        results.map(video=>(
                            <div key={video.id} className='video-card'>
                                <img src={video.thumbnail}/>
                                <div className='card-text-container' onClick={()=>setCurrentSong(video)}>
                                    <p>{video.title}</p>
                                    <span>{video.uploader}</span>
                                </div>
                                <div className='add-song' >
                                <i className="fa-solid fa-circle-plus"></i>
                                </div>
                            </div>
                        ))
                    )
                    }
                </div>


        </div>
    )
}

export default Results;


