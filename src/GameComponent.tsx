import {Application, Assets, Container} from 'pixi.js';
import {useEffect, useRef, useState} from 'react';
import {Game} from "./Game";
import {GameRecordsStorage} from "./GameRecordsStorage";
import {cls, switchCase} from './utils';
import {Editor} from "@monaco-editor/react";

enum GameStatus {
    PREPARING = 'PREPARING',
    BATTLE = 'BATTLE',
    FINISHED = 'FINISHED',
}

export const GameComponent = () => {
    const [gameStatus, setGameStatus] = useState(GameStatus.PREPARING);
    const [algorithmCode, setAlgorithmCode] = useState<string>('// variable "arguments" is available here\n// you can use it to create your own AI algorithm\n// have fun =)\n\nconsole.log(arguments[0]);');
    const [codeEditorOpen, setCodeEditorOpen] = useState<boolean>(false);

    const stageRef = useRef<HTMLDivElement>();

    const init = async () => {
        const app = new Application();
        const boardContainer = new Container({x: 60, y: 60});

        await app.init({background: '#111827', resizeTo: stageRef.current, antialias: true, clearBeforeRender: true});

        stageRef.current.appendChild(app.canvas);
        app.stage.addChild(boardContainer);

        Game.init(boardContainer);
        GameRecordsStorage.init();

        // center board container on the screen
        boardContainer.x = (app.screen.width - boardContainer.width) / 2;
        boardContainer.y = (app.screen.height - boardContainer.height) / 2;
    }

    useEffect(() => {
        stageRef.current.innerHTML = '';

        init();
    }, []);

    return (
        <div
            className='w-[100vw] h-[100dvh] overflow-hidden flex flex-col items-start justify-center bg-gray-900 select-none font-default'
        >
            <div
                className='shrink-0 rounded-b-3xl w-full h-20 bg-gray-700/50 border border-gray-700 flex items-center justify-center text-white text-2xl font-semibold'
            >
                {switchCase({
                    [GameStatus.PREPARING]: 'Preparing to battle... put ships on your board!',
                    [GameStatus.BATTLE]: 'Battle started!',
                    [GameStatus.FINISHED]: 'Battle finished!',
                })(gameStatus)}

                <div className={cls('absolute right-6 grid gap-2', {
                    'grid-cols-2': codeEditorOpen,
                    'grid-cols-1': !codeEditorOpen,
                })}>
                    {codeEditorOpen ? (
                        <>
                            <button
                                title="Run"
                                onClick={() => {
                                    GameRecordsStorage.getRecords().then(records => {
                                        const func = new Function(algorithmCode);
                                        func.call(null, records);
                                    })
                                }}
                                className='icon-btn active:scale-90 text-white hover:text-gray-300 transition-all duration-300 ease-in-out'
                            >
                                ▶
                            </button>

                            <button
                                title="Close code editor"
                                onClick={() => setCodeEditorOpen(false)}
                                className='icon-btn active:scale-90 text-white hover:text-gray-300 transition-all duration-300 ease-in-out'
                            >
                                ❌
                            </button>
                        </>
                    ) : (
                        <button
                            title="Open code editor"
                            onClick={() => setCodeEditorOpen(v => !v)}
                            className='icon-btn active:scale-90 text-white hover:text-gray-300 transition-all duration-300 ease-in-out'
                        >
                            📝
                        </button>
                    )}
                </div>
            </div>

            <div
                className="absolute w-1/3 top-20 left-1/2 -translate-x-1/2 text-white  rounded-3xl p-6 pb-8 flex flex-col items-center justify-center"
            >
                {switchCase({
                    [GameStatus.PREPARING]: (
                        <button
                            onClick={() => {
                                setGameStatus(GameStatus.BATTLE);
                                Game.startBattle();
                            }}
                            className='active:scale-90 px-6 rounded-2xl py-2.5 font-semibold text-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-pink-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 transition-all duration-150 ease-in-out shadow-lg'
                        >
                            Start the battle!
                        </button>
                    ),
                    [GameStatus.BATTLE]: (
                        <button
                            onClick={() => {
                                setGameStatus(GameStatus.FINISHED);
                                Game.endBattle();
                            }}
                            className='px-6 rounded-2xl py-2.5 font-semibold text-xl bg-gradient-to-r from-red-500 to-yellow-500 text-white hover:from-yellow-500 hover:to-red-500 active:from-yellow-700 active:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-50 transition-all duration-150 ease-in-out shadow-lg'
                        >
                            Finish
                        </button>
                    ),
                    [GameStatus.FINISHED]: (
                        <button
                            onClick={() => {
                                setGameStatus(GameStatus.PREPARING);
                                Game.startNewGame();
                            }}
                            className='px-6 rounded-2xl py-2.5 font-semibold text-xl bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-blue-500 hover:to-green-500 active:from-blue-700 active:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50 transition-all duration-300 ease-in-out shadow-lg'
                        >
                            New game
                        </button>
                    ),
                })(gameStatus)}
            </div>

            <div className='flex w-full h-full flex-1 items-center justify-center overflow-hidden'>
                <div className='w-full h-full' ref={stageRef}/>

                <div className={cls('h-full transition-all rounded-xl absolute top-20 w-1/3', {
                    'right-0': codeEditorOpen,
                    '-right-full': !codeEditorOpen,
                })}>
                    <Editor
                        value={algorithmCode}
                        onChange={setAlgorithmCode}
                        height="100%"
                        width='100%'
                        theme='vs-dark'
                        defaultLanguage="javascript"
                        defaultValue="// some comment"
                    />
                </div>
            </div>
        </div>
    )
};