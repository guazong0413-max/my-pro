"use strict";
const room = require('../../雨夜短片/room.cjs');
const street = require('../../雨夜短片/street.cjs');
const art = require('../../雨夜短片/art.cjs');
const performance = require('../../雨夜短片/performance.json');
const {ease: smooth} = require('../../开篇九十秒/drawing.cjs');

function draw(ctx, shot, t, frame) {
  const lips=performance.lips[frame] ?? 0;
  switch (shot) {
    case 'bed': return room.bed(ctx,t);
    case 'wake': return room.portrait(ctx,t,{lip:lips});
    case 'feet': return room.firstSteps(ctx,t);
    case 'approach': return room.approachWindow(ctx,t,{atGlass:true});
    case 'window': return street.windowPOV(ctx,t,{wideGrip:true});
    case 'balcony': return street.fallScene(ctx,t,{wideGrip:true});
    case 'grip': {
      const closer=smooth(30.03,33.67,t);
      return street.detailScene(ctx,t,{x:543+6*closer,y:117.3+1.0*closer,zoom:10.25+.74*closer});
    }
    case 'planter': return street.planterScene(ctx,t,{wideGrip:true});
    case 'witness': {
      const creep=smooth(41.36,44.49,t);
      // The axis through his back still meets the same sliver of glass.
      let state;
      art.camera(ctx,481+3*creep,296-3*creep,1.16+.06*creep,()=>{state=room.approachWindow(ctx,t,{atGlass:true});});
      return state;
    }
    case 'brace': {
      const shift=smooth(47.13,50.53,t);
      return street.detailScene(ctx,t,{x:612+5*shift,y:468-4.1*shift,zoom:4.67+.22*shift});
    }
    case 'retreat': return room.pullAway(ctx,t);
    case 'listen': return room.portrait(ctx,t,{after:true,lip:lips});
    case 'hide': return room.hide(ctx,t,{behindSofa:true});
    case 'door': return room.door(ctx,t);
    default: throw new RangeError('Unknown drawing shot: '+shot);
  }
}

module.exports = {draw};
