import {Application, Container} from 'pixi.js';
import {useEffect, useRef, useState} from 'react';
import {Game} from "./Game";

export const GameComponent = () => {
    const [isBattleStarted, setIsBattleStarted] = useState(false);

    const stageRef = useRef<HTMLDivElement>();

    const init = async () => {
        const app = new Application();
        const boardContainer = new Container({x: 60, y: 60});

        await app.init({ background: '#1f2937', resizeTo: window, antialias: true, clearBeforeRender: true });

        stageRef.current.appendChild(app.canvas);
        app.stage.addChild(boardContainer);

        Game.init(boardContainer);
    }

    useEffect(() => {
        stageRef.current.innerHTML = '';

        init();
    }, []);

    return (
        <div className='w-[100vw] h-[100dvh] overflow-hidden flex items-start justify-center bg-gray-800 select-none'>
            <div className='w-full' ref={stageRef}/>

            <div className="absolute top-5 right-5 text-white bg-gray-700 rounded-3xl p-8 flex flex-col items-center justify-center">
                <span className="text-xl text-center font-semibold mb-4 text-white">
                    {isBattleStarted ? 'Battle started!' : 'Prepare for battle!'}
                </span>

                {!isBattleStarted ? (
                    <button
                        onClick={() => {
                            setIsBattleStarted(true);
                            Game.startBattle();
                        }}
                        className='px-6 rounded-2xl py-3 font-semibold text-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-pink-500 hover:to-purple-500 active:from-pink-700 active:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 transition-all duration-300 ease-in-out shadow-lg'
                    >
                        Start the battle!
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            setIsBattleStarted(false);
                            // Game.endBattle();
                        }}
                        className='px-6 rounded-2xl py-3 font-semibold text-2xl bg-gradient-to-r from-red-500 to-yellow-500 text-white hover:from-yellow-500 hover:to-red-500 active:from-yellow-700 active:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-50 transition-all duration-300 ease-in-out shadow-lg'
                    >
                        New battle
                    </button>
                )}
            </div>
        </div>
    )
};