import React from 'react';
import {hot } from 'react-hot-loader/root';
import {GameComponent} from "./GameComponent";

function App() {
    return (
        <div className='font-default'>
            <GameComponent/>

            <div className="fixed bottom-5 right-5 text-white">
                <a href="https://github.com/szymeo/ships" target='_blank'>
                    Github Repository ↗️
                </a>
            </div>
        </div>
    );
}

export default hot(App);
