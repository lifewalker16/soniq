import { useState,useContext } from 'react';
import { MyContext } from './MyContext';
import './SideBar.css';

function SideBar(){
  const {sideBar}=useContext(MyContext);
    
    return (
        <div className={`sidebar ${sideBar?"active" : "" }`}>
            <ul className="sidebar-list">
              <li className="sidebar-item first">
                <i className="fa-solid fa-house"></i>
                <span>Home</span>
              </li>
              <li className="sidebar-item ">
                <i className="fa-solid fa-music"></i>
                <span>Playlist</span>
              </li>

              <li className="sidebar-item">
                <i className="fa-solid fa-heart"></i>
                <span>Liked Songs</span>
              </li>
            </ul>

        </div>
    )
}

export default SideBar; 