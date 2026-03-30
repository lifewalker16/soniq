import './Window.css';
function Window(){
    return (
      <div className="window">
         
        <div className="nav">
            <div className="search-container">
                <i className="fa-solid fa-magnifying-glass search-icon"></i>

                <input
                type='text'
                placeholder='Seach..'
                className='search-bar'
                /> 

            </div>
        </div>

      </div>
    )
}

export default Window;