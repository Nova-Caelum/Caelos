// Scratch asset preparation. Reads supplied artwork; writes only local vector assets.
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require('/Users/danieleghdami/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const out=new URL('.',import.meta.url);
const original='/Users/danieleghdami/Downloads/hermes-agent-logo-png-svg.webp';
const {data,info}=await sharp(original).resize(384,384).removeAlpha().raw().toBuffer({resolveWithObject:true});
const w=info.width,h=info.height,black=new Uint8Array(w*h),outside=new Uint8Array(w*h);
for(let i=0;i<w*h;i++) black[i]=data[i*3]<110 && data[i*3+1]<110 && data[i*3+2]<110?1:0;
const queue=[0];outside[0]=1;
for(let q=0;q<queue.length;q++){let i=queue[q],x=i%w,y=Math.floor(i/w);for(const j of [x>0?i-1:-1,x<w-1?i+1:-1,y>0?i-w:-1,y<h-1?i+w:-1])if(j>=0&&!black[j]&&!outside[j]){outside[j]=1;queue.push(j);}}
// Only enclosed negative space becomes cream. The checkerboard and original ink disappear.
const mask=black.map((b,i)=>!b&&!outside[i]?1:0),edges=new Map();
const key=(x,y)=>`${x},${y}`;
function edge(x,y,a,b){const k=key(x,y);const list=edges.get(k)||[];list.push([a,b]);edges.set(k,list);}
for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(!mask[y*w+x])continue;if(y===0||!mask[(y-1)*w+x])edge(x,y,x+1,y);if(x===w-1||!mask[y*w+x+1])edge(x+1,y,x+1,y+1);if(y===h-1||!mask[(y+1)*w+x])edge(x+1,y+1,x,y+1);if(x===0||!mask[y*w+x-1])edge(x,y+1,x,y);}
function simplify(p,epsilon){if(p.length<3)return p;const a=p[0],b=p.at(-1);let max=0,at=0;for(let i=1;i<p.length-1;i++){const dx=b[0]-a[0],dy=b[1]-a[1];const t=Math.max(0,Math.min(1,((p[i][0]-a[0])*dx+(p[i][1]-a[1])*dy)/(dx*dx+dy*dy||1)));const d=Math.hypot(p[i][0]-a[0]-t*dx,p[i][1]-a[1]-t*dy);if(d>max){max=d;at=i;}}return max>epsilon?[...simplify(p.slice(0,at+1),epsilon).slice(0,-1),...simplify(p.slice(at),epsilon)]:[a,b];}
const paths=[];
while(edges.size){const start=edges.keys().next().value;let p=start.split(',').map(Number),points=[p];for(let n=0;n<w*h;n++){const k=key(...p),list=edges.get(k);if(!list)break;p=list.pop();if(!list.length)edges.delete(k);points.push(p);if(key(...p)===start)break;}const area=Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0)/2);if(area<6)continue;const half=Math.floor(points.length/2);const simple=[...simplify(points.slice(0,half+1),.45).slice(0,-1),...simplify(points.slice(half),.45)];paths.push('M'+simple.map(p=>p.map(v=>Number(((v-54)/276*20+2).toFixed(3))).join(' ')).join('L')+'Z');}
const hermes=paths.join('');
const sources=[['ClaudeCode','/Users/danieleghdami/NovaCaelum_Obs/AgentSecretBase/inbox/claudecode-color.svg'],['Codex','/Users/danieleghdami/Downloads/codex.svg']];
let exports="import { forwardRef, type SVGProps } from 'react';\ntype HarnessIconProps = SVGProps<SVGSVGElement> & { size?: number | string };\n";
for(const [name,path] of [...sources,['Hermes',null]]){const d=path?(await fs.readFile(path,'utf8')).match(/ d="([^"]+)"/)[1]:hermes;const transform=name==='Codex'?'translate(2 2) scale(.833333)':'';const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="${d}"${transform?` transform="${transform}"`:''}/></svg>\n`;await fs.writeFile(new URL(name+'.svg',out),svg);exports+=`export const ${name}Icon = forwardRef<SVGSVGElement, HarnessIconProps>(function ${name}Icon({size=24, ...props}, ref) { return <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}><path fillRule="evenodd" d="${d}"${transform?` transform="${transform}"`:''} /></svg>; });\n`;}
await fs.writeFile(new URL('HarnessIcons.tsx',out),exports);
await sharp(Buffer.from(`<svg width="240" height="240" viewBox="0 0 24 24"><rect width="24" height="24" fill="#101020"/><path d="${hermes}" fill="#f7edd0" fill-rule="evenodd"/></svg>`)).png().toFile('/tmp/hermes-vector-proof.png');
console.log('Prepared three currentColor SVGs; Hermes has '+paths.length+' negative-space contours.');
