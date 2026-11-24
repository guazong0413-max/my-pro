"use strict";

const fs=require("node:fs");
const {createCanvas,painter,installFont}=require("./draw.cjs");
const {cast}=require("./character.cjs");

installFont(process.env.APARTMENT_FONT);
const canvas=createCanvas(1600,936);
const b=painter(canvas), {body,head}=cast(b);
const {rect,box,ell,line,text,grad,at}=b;
const roles=[
  {id:"yu",name:"小宇",color:"#78889a",scale:2.21,dir:1,pose:"alert",label:"警觉",front:true},
  {id:"mei",name:"小美",color:"#bc985f",scale:2.17,dir:-1,pose:"worry",label:"担心"},
  {id:"son",name:"小旭",color:"#6a97b7",scale:1.56,dir:1,pose:"surprise",label:"吃惊"},
  {id:"uncle",name:"大叔",color:"#8a9375",scale:2.25,dir:-1,pose:"sad",label:"低落"}
];

rect(0,0,1600,936,grad(180,0,1320,936,[[0,"#1c2532"],[.58,"#15212d"],[1,"#111a24"]]));
text("隔门一瓶水",76,87,43,"#f0e9da",{weight:610});
text("角色造型与表情",78,127,19,"#adb7bd",{weight:490});
line([[75,154],[1525,154]],"#364553",1);

for(const [i,role] of roles.entries()){
  const x=75+i*368,mid=x+173;
  box(x,180,346,694,13,"#202c39","#364453",1);
  rect(x+1,410,344,210,grad(x,410,x,620,[[0,"#202c39"],[1,"#25313b"]]));
  line([[x+34,616],[x+312,616]],"#43515c",1.2);
  body(role.id,{x:mid,y:615,scale:role.scale,dir:role.dir,pose:"rest",headTilt:role.id==="son"?-.075:0});
  text(role.name,mid,675,30,"#eee6d8",{weight:600,align:"center"});
  line([[mid-14,696],[mid+14,696]],role.color,2.6);
  for(const [j,pose] of ["rest",role.pose].entries()){
    const cx=mid-73+146*j;
    ell(cx,772,54,53,"#293644","#3d4a57",1);
    at(cx,775,role.dir*1.86,1.86,0,()=>head(role.id,0,0,j?(role.id==="son"?-.12:.045):0,
      {pose,front:role.front}));
    text(j===0?"平静":role.label,cx,850,17,"#ccd0cc",{weight:500,align:"center"});
  }
}
const out=process.argv[2]||"characters.png";
fs.writeFileSync(out,canvas.toBuffer("image/png"));
console.log(out);