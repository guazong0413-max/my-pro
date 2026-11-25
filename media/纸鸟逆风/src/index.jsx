import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Film} from './Film';
import {fps,length} from './motion.cjs';
function Root(){return <Composition id="PaperWings" component={Film} durationInFrames={fps*length} fps={fps} width={1920} height={1080} defaultProps={{water:1,ferry:1,foley:1,music:1}}/>;}
registerRoot(Root);
