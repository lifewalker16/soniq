import './NavBar.css';
import { useContext } from 'react';
import {MyContext } from './MyContext.jsx';

function NavBar(){
    const {query,setQuery,setSideBar,setResults,inputRef,setShowRecent, recentSongs,setRecentSongs}=useContext(MyContext);
    

    const handleSearch= async()=>{
        if (!query.trim()) return;
       
        try{
            const res=await fetch(`http://localhost:3000/search?q=${query}`);
            const data = await res.json();
            setResults(data);
        }catch(err){
            console.log("search failed",err);
        }
        
    }
    const handleFocus = async () => {
        setShowRecent(true);
        
        if (!query.trim() && recentSongs.length === 0) {
        try {
            const res = await fetch("http://localhost:3000/recent");
            const data = await res.json();
            setRecentSongs(data);
        } catch (err) {
            console.error("Failed to fetch recent songs:", err);
        }
        }
    };

    return (
        <div className="nav-bar">
            <div className='left-btns'>
                <i className="fa-solid fa-ellipsis"></i>
            </div>
                 
            <div className='center-btns'>
                <div className='center-home'>
                      <i className="fa-solid fa-house"></i>
                </div>

                <div className='center-search'>
                   <i className="fa-solid fa-magnifying-glass center-search-btn"></i> 
                   <input 
                   ref={inputRef}
                   type='text' 
                   placeholder='What do you want to play ?' 
                   value={query}
                   onChange={(e)=>setQuery(e.target.value)}
                   onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSearch();
                        }
                    }}
                   onFocus={handleFocus}
                   />
                   {query&&(
                    <i className="fa-solid fa-x center-clr-btn" onClick={()=>setQuery("")}></i>
                   )
                   }
                </div>

            </div>

            <div className='right-btns'>
                <i className="fa-solid fa-circle-user"></i>
            </div>
         



        </div>
    )
}

export default NavBar;