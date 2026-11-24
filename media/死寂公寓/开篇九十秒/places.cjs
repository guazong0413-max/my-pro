"use strict";
const {rect,round,ell,line,poly,path,grad,glow,text,place,rand,lerp,ease,clamp}=require("./drawing.cjs");
function city(c,t,night=false) {
  rect(c,-300,-190,1560,750,grad(c,0,0,0,510,night?[[0,"#182538"],[.75,"#344257"],[1,"#424957"]]:[[0,"#b8b1aa"],[.63,"#e5ccb1"],[1,"#b7a398"]]));
  if(!night){glow(c,137,159,274,175,"rgba(249,223,176,.48)");ell(c,150,145,29,29,"#ded0ae");}
  for(let band=0;band<3;band++){
    const base=368+band*42, pace=77+band*20;
    for(let i=-3;i<17;i++){
      const seed=i+15+band*35,x=i*pace+rand(seed)*12-29*band,h=43+rand(seed+71)*(111+band*13),w=52+rand(seed+7)*(29+band*10);
      const y=base-h, fill=night?["#2e3b4b","#263446","#213040"][band]:["#aeb0ad","#92969b","#777e89"][band];
      rect(c,x,y,w,h+190,fill);rect(c,x+7,y-3,w-13,3,fill);
      if(i%3===0){rect(c,x+w*.58,y-7,11,7,fill);line(c,[[x+w*.65,y-7],[x+w*.65,y-15]],fill,1.6);}
      if(band>0){const ink=night?"#1c2839":band===1?"#7f858c":"#56606f";
        for(let row=0;row<Math.min(7,Math.floor((h-14)/18));row++)
          for(let col=0;col<Math.floor((w-9)/15);col++)
            if(rand(seed+col*17+row*2)>.23)rect(c,x+8+col*15,y+9+row*17,7,9,ink);
      }
    }
  }
  if(!night){
    for(const [x,y,k] of [[44,240,.8],[730,239,1.12],[845,280,.66]]){
      for(let i=0;i<5;i++)ell(c,x+14*i+Math.sin(t*.07+i)*4*k,y-21*i*k,(9+i*4)*k,(13+i*4)*k,"rgba(102,102,111,.10)");
    }
  }
}
function tower(c,x,y,s,t,night=false){
  place(c,x,y,s,()=>{
    const wall=night?"#394352":"#d9c9af",side=night?"#2c3747":"#b6a58e";
    poly(c,[[0,0],[151,0],[177,8],[177,330],[151,336],[0,336]],side);
    rect(c,0,0,151,336,wall);rect(c,-4,-4,160,6,night?"#59606a":"#e8dac3");
    rect(c,21,-14,76,10,night?"#3c4854":"#bfae93");rect(c,31,-20,12,6,side);
    line(c,[[134,-3],[134,-37],[124,-37],[144,-37]],night?"#555e6a":"#7d7e7c",1.4);
    for(let r=0;r<12;r++){
      const yy=8+r*26.4;
      rect(c,0,yy+17.7,151,1.4,night?"#414b58":"#c2af92");
      for(let j=0;j<4;j++){
        const xx=10+j*35,lit=r===3&&j===2;
        rect(c,xx-1.7,yy-1.5,24.4,16.7,night?"#49505b":"#b6a993");
        rect(c,xx,yy,21,13.5,lit?(night?"#e6b76e":"#e8c687"):(night?"#263143":"#555e6d"));
        if(!lit||night)rect(c,xx+10,yy,1.15,13.5,lit?"#98794e":night?"#394353":"#77808a");
        rect(c,xx-2,yy+13.1,25,2.4,night?"#4d5560":"#e2d2b4");
        if(!lit&&!night&&(r+j)%7===1){rect(c,xx+1,yy+.4,18.9,4.1,"#a5a39b");}
        if(lit&&night)glow(c,xx+11,yy+8,32,24,"rgba(255,201,118,.26)");
      }
      rect(c,156,yy+2,9,12,night?"#273443":"#85868a");
    }
    rect(c,55,314,42,22,night?"#263445":"#55545a");rect(c,60,315,13,20,night?"#2e394a":"#70737a");
    rect(c,111,294,17,5,night?"#434952":"#aca28f");
  });
}
function pedestrian(c,x,y,s,i,t){
  const phase=t*(.63+rand(i)*.25)+i*2.17, stride=Math.sin(phase)*2.6;
  const col=["#6d7166","#6e6469","#59646b","#77756a","#6e6977"][i%5],skin=["#a7ae8c","#a1a890","#a3aa8d","#939d85"][i%4];
  place(c,x,y,s,()=>{
    line(c,[[-1,-21],[-3+stride,-11],[-4+stride,0]],"#4a5057",4.1);
    line(c,[[2,-20],[3-stride,-10],[2-stride,0]],"#58575c",4.5);
    path(c,"M-4 -38 Q0 -40 4 -35 L6 -21 Q2 -18 -5 -20Z",col);
    const reach=3.5*rand(i+17);
    line(c,[[2,-34],[8,-30],[13+reach,-30+Math.sin(phase)*1.1]],col,3);
    ell(c,14+reach,-30+Math.sin(phase)*1.1,1.75,1.5,skin);
    ell(c,2,-42,4.4,5.35,skin);path(c,"M-2 -42 Q-4 -49 2 -48 Q6 -48 6 -45 Q2 -46 .4 -43Z","#59605a");
  },i%5===0);
}
function traffic(c,t){
  line(c,[[-12,120],[260,153],[520,142],[795,172],[980,141]],"#5b6470",2);
  line(c,[[-12,127],[260,160],[520,149],[795,179],[980,148]],"#67707a",1.1);
  rect(c,742,79,7,328,"#5b6269");
  line(c,[[744,118],[586,118],[574,128]],"#535c68",6);
  round(c,566,124,26,64,8,"#454c56");for(let k=0;k<3;k++)ell(c,579,137+k*18,6.7,6.7,["#6e5457","#71675c","#5d6c64"][k]);
}
function apartment(c,t,night=false) {
  rect(c,0,0,960,448,grad(c,0,0,890,445,night?[[0,"#1c2a3b"],[.62,"#344051"],[1,"#263345"]]:[[0,"#dad2be"],[.69,"#e0d7c5"],[1,"#b7b5ac"]]));
  rect(c,0,438,960,12,night?"#263140":"#a8a59a");rect(c,0,450,960,100,night?"#222d3c":"#96948c");
  rect(c,0,451,960,4,night?"#344252":"#b5afa2");
  for(let i=0;i<6;i++)line(c,[[30+i*199,455],[-72+i*213,540]],night?"#263443":"#a19c91",1);
}
function pane(c,x,y,w,h,t,night=false){
  rect(c,x-9,y-7,w+18,h+19,night?"#404957":"#b5afa1");
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
  c.translate(x,y);c.scale(w/850,h/390);city(c,t,night);c.restore();
  rect(c,x,y,w,5,night?"#515767":"#ded8c9");rect(c,x,y,5,h,night?"#515767":"#ded8c9");
  rect(c,x+w*.51,y,6,h,night?"#4a5161":"#d7d3c7");
  rect(c,x,y+h*.55,w,4,night?"#4a5161":"#d7d3c7");
  rect(c,x-14,y+h-1,w+28,8,night?"#515969":"#e8e2d3");
}
function bathroom(c,t){
  rect(c,0,0,960,436,grad(c,0,0,960,440,[[0,"#a0b0b1"],[.58,"#81969e"],[1,"#667e8b"]]));
  for(let j=0;j<4;j++)line(c,[[0,138+j*72],[960,138+j*72]],"rgba(223,230,215,.15)",1.4);
  for(let j=0;j<3;j++)for(let i=-1;i<9;i++){
    const x=136*i+(j%2)*68;line(c,[[x,140+72*j],[x,209+72*j]],"rgba(222,230,213,.14)",1.3);
  }
  rect(c,0,421,960,10,"#637e87");rect(c,0,431,960,109,"#677a82");rect(c,0,431,960,2,"#9aa6a3");
  for(let i=0;i<9;i++)line(c,[[i*142-14,435],[i*156-103,540]],"#70838a",1.1);
  for(let i=0;i<2;i++)line(c,[[0,457+48*i],[960,457+48*i]],"#72858b",1);
}
function bottle(c,x,y,s){
  place(c,x,y,s,()=>{
    path(c,"M-4 -33 L4 -33 L4 -28 Q8 -26 9 -21 L9 -3 Q9 0 6 0 L-7 0 Q-9 0 -9 -4 L-9 -22 Q-8 -26 -4 -28Z","#b4cdd1","#647f89",.8);
    path(c,"M-8 -18 Q0 -16 8 -18 L8 -4 Q8 -1 6 -1 L-6 -1 Q-8 -1 -8 -4Z","#8fb6bd");
    rect(c,-8.6,-14.6,17.2,7.5,"#dbe1d5");rect(c,-9,-9.5,18,2,"#658995");
    round(c,-5,-36,10,4.6,1.2,"#718895");line(c,[[-5.3,-22],[-5.3,-17]],"#e1e7dc",1.2);
  });
}
function bread(c,x,y,s){
  place(c,x,y,s,()=>{
    path(c,"M-27 -3 L-24 -29 L-15 -35 L-17 -44 L-5 -41 L1 -45 L4 -35 Q23 -33 26 -18 L27 -2Z","#bfab88","#8d806f",.9);
    path(c,"M-19 -6 L-18 -22 Q-13 -32 0 -33 Q14 -34 19 -26 L21 -7Z","#a57856");
    path(c,"M-16 -14 Q-12 -31 1 -29 Q12 -29 16 -23 Q12 -18 3 -15Z","#c39368");
    path(c,"M-11 -22 Q-8 -28 -5 -28 M2 -24 Q5 -29 8 -28",null,"#e6c29a",1.7);
    line(c,[[-18,-34],[4,-35]],"#745e52",2.2);
    path(c,"M-26 -3 L-17 -7 M12 -5 L26 -3 M18 -27 L22 -14",null,"#e1d1af",1);
  });
}
function candle(c,x,y,s,t){
  place(c,x,y,s,()=>{
    const fl=.9+.06*Math.sin(t*7.1)+.04*Math.sin(t*10.7);
    glow(c,0,-42,91*fl,89*fl,"rgba(241,184,102,.31)");
    ell(c,0,.5,16,3.1,"#887657");ell(c,0,-.3,13.8,2.1,"#b19a70");
    path(c,"M-5 -28 Q0 -26 5 -29 L5 -1 Q0 0 -5 -1Z","#ded1a6");path(c,"M1 -28 L1 -21 Q3 -19 3 -25 L5 -27",null,"#baab85",1);
    line(c,[[0,-28],[.3,-32]],"#65554e",1.3);
    c.save();c.translate(0,-31);c.scale(fl,fl);
    path(c,"M0 1 C-5 -1 -5 -6 -.4 -14 Q-.8 -9 2 -7 Q7 -2 0 1Z","#f0bd72");ell(c,.2,-2,1.6,3.3,"#fff0bd");c.restore();
  });
}
function hallDoor(c,x,y,w,h,night=true){
  const jamb=night?"#475465":"#738489",leaf=night?"#344254":"#61737e",edge=night?"#4a5767":"#7a8992";
  rect(c,x-11,y-9,w+22,h+12,"#202d3b");rect(c,x-8,y-6,w+16,h+8,jamb);rect(c,x-2,y-1,w+5,h+4,"#202b39");
  rect(c,x,y,w,h,leaf);rect(c,x+2,y+2,2,h-4,edge);
  round(c,x+w*.12,y+h*.11,w*.76,h*.43,2,leaf,edge,1.1);round(c,x+w*.12,y+h*.60,w*.76,h*.31,2,leaf,edge,1.1);
  const eye=[x+w*.51,y+h*.38];ell(c,...eye,4.2,4.2,"#8d8d83");ell(c,...eye,2.35,2.35,"#1e2934");ell(c,eye[0]-.65,eye[1]-.7,.65,.65,"#b3a38a");
  const hx=x+w*.12,hy=y+h*.61;
  round(c,hx-3,hy-7,8,23,2,"#797a72");round(c,hx,hy,18,4.8,2,"#a79a7e");ell(c,hx+1,hy+10,1.15,1.5,"#3a444c");
  // The left bracket is fixed to the jamb, the eye plate to the closed door.
  const a=[x-2,y+h*.48],b=[x+16,y+h*.48+1];
  for(const p of [a,b]){round(c,p[0]-2.8,p[1]-4.1,5.6,8.2,1.3,"#827a68");ell(c,p[0],p[1]-2.3,.59,.59,"#b8a686");}
  for(let i=0;i<9;i++){const u=i/8;ell(c,lerp(a[0],b[0],u),lerp(a[1],b[1],u)+5.35*Math.sin(Math.PI*u),i%2?1.3:1.8,i%2?2:1.45,null,"#ad9c7b",.84);}
  return eye;
}
module.exports={city,tower,pedestrian,traffic,apartment,pane,bathroom,bottle,bread,candle,hallDoor};
