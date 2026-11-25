import React from 'react';
import {Composition, registerRoot} from 'remotion';
import edit from '../edit.json';
import {RainNight} from './RainNight';

function Root() {
  return <Composition id="RainNight" component={RainNight}
    width={edit.width} height={edit.height} fps={edit.fps} durationInFrames={edit.durationInFrames}
    defaultProps={{subtitles:true,narrationVolume:1,ambientVolume:1}}/>;
}
registerRoot(Root);
