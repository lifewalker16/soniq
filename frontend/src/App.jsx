import './App.css';
import { useState ,useRef} from 'react';
import {MyContext} from './MyContext.jsx';
import NavBar from "./NavBar.jsx";
import SideBar from './SideBar.jsx';
import Results from './Results.jsx';
import MusicPlayer from './MusicPlayer.jsx';
import AudioWindow from './AudioWindow.jsx';

function App() {
  
    const [sideBar,setSideBar]=useState(false);
    const [results,setResults]=useState([]);
    const [query,setQuery]=useState("");
    const [currentSong, setCurrentSong] = useState(null);
    const [audioUrl,setAudioUrl]=useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [showRecent,setShowRecent]=useState(false);
    const [recentSongs,setRecentSongs]=useState([]);
    const audioRef =useRef(null);
    const inputRef=useRef(null);


    const providerValues={
      sideBar,setSideBar,
      results,setResults,
      query,setQuery,
      currentSong, setCurrentSong,
      audioUrl,setAudioUrl,
      isPlaying, setIsPlaying,
      showRecent,setShowRecent,
      recentSongs,setRecentSongs,
      audioRef,
      inputRef
    }

  return (
    <div className='app'>
      <MyContext.Provider value={providerValues}>
          <SideBar/>
          <NavBar/>
          { 
          (results.length > 0 || showRecent)  && <Results/>
          }
          <AudioWindow/> 
          <MusicPlayer/>
          
      </MyContext.Provider>

    </div>
  );
}
export default App;