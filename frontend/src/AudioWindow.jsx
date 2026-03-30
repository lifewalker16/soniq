import './AudioWindow.css';
import { useContext } from 'react';
import MagicRings from './MagicRings';
import { MyContext } from './MyContext';

function AudioWindow(){
    const {audioRef,currentSong,isPlaying}=useContext(MyContext);
    return(
        <div className="audio-window">
            <MagicRings
                audioRef={audioRef}
                color="#F8FAFC"
                colorTwo="#D9EAFD"
                speed={1}
                ringCount={10}
                attenuation={10}
                lineThickness={1}
                baseRadius={0.0001}
                radiusStep={0.001}
                scaleRate={0.3}
                opacity={1}
                noiseAmount={0.1}
                ringGap={1.5}
                fadeIn={0.7}
                fadeOut={0.5}
                followMouse={true}
                mouseInfluence={0.15}
                hoverScale={1.15}
                parallax={0.04}
                clickBurst={true}
            />
              {/* Thumbnail centered inside the rings */}
                {currentSong?.thumbnail && (
                    <img
                    src={currentSong.thumbnail}
                    alt="cover"
                    className={`audio-window-thumbnail ${isPlaying ? 'spinning' : 'paused'}`}
                    />
                )}
                {currentSong && (
                    <div className="audio-window-info">
                    <p className="audio-window-title">{currentSong.title}</p>
                    <span className="audio-window-uploader">{currentSong.uploader}</span>
                    </div>
                )}  

        </div>
    )
}

export default AudioWindow;