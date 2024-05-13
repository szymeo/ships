import {Application, Container, Graphics, GraphicsContext} from 'pixi.js';
import {useEffect, useRef} from 'react';
import {Game} from "./Game";

export const MyComponent = () => {
    const stageRef = useRef<HTMLDivElement>();

    const init = async () => {
        // Create a PixiJS application.
        const app = new Application();
        const boardContainer = new Container({
            x: 50,
            y: 50
        });

        // Intialize the application.
        await app.init({ background: '#1f2937', resizeTo: window });

        stageRef.current.appendChild(app.canvas);
        app.stage.addChild(boardContainer);

        // Load the bunny texture.
        // const texture = await Assets.load('https://pixijs.com/assets/bunny.png');

        Game.init(boardContainer);

        // Add an animation loop callback to the application's ticker.
        app.ticker.add((time) =>
        {
            /**
             * Just for fun, let's rotate mr rabbit a little.
             * Time is a Ticker object which holds time related data.
             * Here we use deltaTime, which is the time elapsed between the frame callbacks
             * to create frame-independent transformation. Keeping the speed consistent.
             */
            // bunny.rotation += 0.1 * time.deltaTime;
        });
    }

    useEffect(() => {
        stageRef.current.innerHTML = '';

        init();
    }, []);

    return (
        <div style={{ width: '100vw', height: '100dvh', overflow: 'hidden' }} ref={stageRef} />
    )
};