/*
 * Plutonium React-State-Animator v1.0.5
 * (c) 2019 Jesse Dalessio
 * Released under the MIT license
*/
PU_Animator=function(t){let e=this;function n(t){t.target.frames.tween(t)}function i(t,n){n=n||{};var i=e.animations;for(let e in i)n.filter&&!n.filter(i[e])||i[e][t]()}function r(t){document.hidden?e.pause():e.play({filter:t=>t.paused})}e.animations={},e.add=function(t,i,r,a){let o;a=a||{},isNaN(i)||(i*=1e3),a.duration=i||a.duration,"string"==typeof r&&(o=r,r=null);for(let t in r){var s=r[t]||"";s.keys||(r[t]={keys:{to:s.hasOwnProperty("val")?s.val:s},tween:s.tween})}o=o||"PU"+Object.keys(e.animations).length+1;let u=e.animations[o]=new function(t,e){e=e||{};let n,i,r=this;function a(t){r.timers.delay=setTimeout(o,r.tDelay),r.dTrack.start=Date.now()}function o(t){l(),r.dTrack.done=1,s()}function s(e){r.isAnimated=!0;let n,a=1;if(e){let i,o=(n=r.lFrame=r.frames.getFrame(e)).data.status;o.isLast&&(a=0),o.iteration&&(t.event.fire(r,"iterate",{frame:n}),i=!r.isAnimated),i||t.event.fire(r,"frameChange",{frame:n})}r.isAnimated&&(a?i=requestAnimationFrame(s):(r.ended=1,r.stop(),t.event.fire(r,"end",{frame:n})))}function u(e,n){if(null!=(n=n||{}).lock&&(r.lock=n.lock),cancelAnimationFrame(i),r.timers.delay){let t=r.dTrack;t.exp=(t.exp||0)+Date.now()-t.start,l()}else r.isAnimated&&r.frames[e]();r.isAnimated=!1,n.skipFire||t.event.fire(r,e,{})}function l(){clearTimeout(r.timers.delay),delete r.timers.delay}r.params=e,r.animator=t,r.id=e.id,r.props={},r.timers={},r.isAnimated=!1,r.direction="forwards",r.dTrack={},r.sync=e.sync,r.init=function(){n={running:r.play,paused:r.pause,stopped:r.stop},r.frames=new function(t){let e=this;e.animation=t;let n=t.animator;e.timestamp=0,e.startTime=0,e.time=0,e.reverseTime=null,e.opposite=0,e.reverse=!1,e.paused=!1,e.stopped=!0,e.lastDir="forwards",e.loop=new function(t){let e=this;e.isInfinite=!1,e.alternate=!1,e.max=1,e.cur=1,e.setValue=function(t){e.isInfinite=!("infinite"!==t);let n=parseInt(t);e.max=isNaN(n)?1:n},e.reset=function(){e.cur=1},e.canAdvance=function(){return e.isInfinite||e.cur<e.max},e.advance=function(n){e.cur++,e.alternate&&t.changeDirection()}}(e);let i=/[-]{0,1}[\d]*[.]{0,1}[\d]/g;function r(){return e.opposite?!e.reverse:e.reverse}function a(){return e.reverseTime?e.time=e.reverseTime-e.startTime-(e.timestamp-e.reverseTime):e.time=e.timestamp-e.startTime,e.time}function o(e,n){let r=e.PU_data;if(r||(r=e.PU_data={isElm:e instanceof Element,vals:{},tweens:{}}),n){let n=r.vals[t.id]=(e.state||{})[t.id]||t.params.vals;for(let t in n){let a=n[t];if(r.isElm){let n,r=(a.tween||{}).applyAs,o=a.iVal="attribute"===r?e.getAttributeNS(null,t):e.style[t];null!==o&&""!==o||null===(n=a.keys[Object.keys(a.keys)[0]])||(n="string"==typeof n?n.replace(i,"0"):0,a.iVal=n)}else a.iVal=a.val}r.tweens[t.id]={}}return r}function s(t,n){let i=n.keys||n,r={},a=r.vals={},o=t.pos,s=0,l=0,c=Object.keys(i);for(let t=0;t<c.length;t++){let e=i[c[t]];r.zone=t+1;let f=u(c[t]);if(!(o>=f)){a.start=n.iVal,a.end=e,r.bKeys=1,l=f,r.zone=0;break}{let n,p=t<c.length-1?c[t+1]:null;if(!p||o<(n=u(p))){s=f||0,a.start=e;let t=p?i[p]:e;l=n||f||0,a.end=t,p||(r.aKeys=1,l=100);break}}}t.status.isLast&&!e.fillModeMatches()&&(a.start=a.end=n.iVal);let f=l-s;return r.duration=f/100*t.duration,r.time=(o-s)/100*t.duration,t.keyPos=f?(o-s)/f*100:0,r}function u(t){return"from"===t?0:"to"===t?100:parseFloat(t.substring(t.indexOf("_")+1))}e.reset=function(){e.loop.reset(),e.reverse=!1,e.reverseTime=null,e.timestamp=0,e.startTime=0,e.time=0},e.play=function(){e.reverseTime=null,e.paused?e.startTime=e.timestamp-e.time:(r()?e.startTime=e.timestamp-e.animation.props.duration:e.startTime=e.timestamp,e.time=0),e.applyDirection(),e.stopped=!1,e.paused=!1},e.pause=function(){e.paused=!0},e.stop=function(){e.stopped=!0},e.fillModeMatches=function(){let n=t.props.fillMode;if(n&&(/both/i.test(n)||n.toLowerCase()===e.lastDir))return!0},e.changeDirection=function(){e.reverse=!e.reverse,e.applyDirection()},e.applyDirection=function(){r()?(e.reverseTime||(e.reverseTime=e.timestamp),e.lastDir="backwards"):(e.reverseTime&&(e.startTime=e.timestamp-e.time,e.reverseTime=null),e.lastDir="forwards")},e.getPos=function(e){let n=a(),i=n/(e||t.props.duration);return!isNaN(i)&&isFinite(i)||(i=0),i},e.changeDuration=function(n,i){i=i||t.props.duration;let r=e.getPos(i),o=n*r;e.moveToTime(o),a()},e.moveToTime=function(t){t=t||0,e.startTime=e.timestamp-t,e.reverseTime&&(e.reverseTime=e.timestamp)},e.getFrame=function(n,i){let o=e.timestamp=n||e.timestamp;i||!e.paused&&!e.stopped||e.play();let s=a(),u={},l=t.props,c=l.duration,f=s<=0,p=s>=c;if(f||p)if(f&&r()||p&&!r())if(e.loop.canAdvance()){u.iteration=e.loop.cur,e.loop.advance(),e.play();let t=Math.abs(s-(p?c:0));r()?e.startTime+=t:e.startTime-=t,s=a()}else s=f?0:c,u.isLast=!0;else u.isFirst=!0;return{animation:e,data:{time:s,stamp:o,pos:s/c*100||0,timing:l.timing,duration:c,iterationCount:e.loop.cur-1,status:u}}},e.tween=function(e){let a=t.objects;for(let u=0;u<a.length;u++){let l=a[u],c=e.frame.data,f=c.status.isFirst,p=o(l,f),m=p.vals[t.id];for(let e in m){let a=m[e],o=s(c,a),u=o.vals,d=u.start,h=u.end;f&&(p.tweens[t.id][e]={initVals:n.util.cloneObj(m)});let y=p.tweens[t.id][e],v=y.lastZone!==o.zone;if(v||c.startVal!==h){let t=r()?h:d,s=a.tween||{};if(!s.disabled)if(isNaN(d)||isNaN(h)){if(s.isPath){if(d!==h&&d&&h){if(v){const t=n.morph;y.ipol=t.interpolate([t.parsePath(d),t.parsePath(h)])}t=y.ipol({timing:c.timing,time:o.time,duration:o.duration})}}else if(/\d/.test(d)&&/\d/.test(h)){let e=d.match(i),r=h.match(i),a=(e.length>r.length?r:e).length,u=new Array(a);for(let t=0;t<a;t++)u[t]=n.tween({startVal:parseFloat(e[t]),endVal:parseFloat(r[t]),timing:c.timing,time:o.time,duration:o.duration}),u[t]=n.util.round(u[t],6);let l=0;t=d.replace(i,t=>{if(l<a){let e=u[l];t=s.modify?s.modify(e):e,l++}return t})}}else t=n.tween({startVal:d,endVal:h,timing:c.timing,time:o.time,duration:o.duration}),t=n.util.round(t,6),t=s.modify?s.modify(t):t;a.val=t,p.isElm&&("attribute"===s.applyAs?l.setAttributeNS(null,e,t):l.style[e]=t)}y.lastZone=o.zone}l.isReactComponent&&l.setState(l.state)}}}(r),r.objects=t.util.addToNewArray(e.objects),r.setProps(e.props)},r.addListener=function(e,n,i){t.event.addListener(r,e,n,i)},r.removeListener=function(e,n,i){t.event.removeListener(r,e,i)},r.s_duration=function(t,e){e=e||{},t=r.parse.MS(t);let n=(e.prevProps||{}).duration;r.frames.stopped||r.frames.changeDuration(t,n),r.props.duration=t},r.s_delay=function(t){r.props.delay=r.parse.MS(t)},r.s_timing=function(t){t=r.parse.timing(t),r.props.timing=t||{}},r.s_direction=function(t){r.frames.loop.alternate=!!/alternate/i.test(t);let e=function(){let t=/rev/i.test(r.props.direction),e=r.frames.loop;if(e.alternate){let n=e.cur,i=n/2===parseInt(n/2);t=i!==t}return t}();!!r.frames.reverse!==e&&r.frames.changeDirection()},r.s_iterationCount=function(t){r.frames.loop.setValue(t)},r.s_synchro_enabled=function(t){r.synchro=t},r.s_synchro_direction=function(t,e){r.synchro&&r.frames.applyDirection()},r.s_playState=function(t){(n[t]||r[t]||r.stop)()},r.setProps=function(t){if(t){let e=r.props||{};r.props={duration:0,timing:{type:"quadratic",direction:"inout"},delay:0,iterationCount:1,direction:"normal",fillMode:"none",synchro_enabled:null,synchro_direction:"normal",synchro_interationCount:1,playState:"running"};for(let n in r.props){let i=null!=t[n]?t[n]:r.props[n];r.props[n]=i;let a=r["s_"+n];a&&a(i,{prevProps:e})}}},r.seek=function(e){e=(e<0?0:e>100?100:e)/100,r.frames.moveToTime(r.props.duration*e),t.event.fire(r,"frameChange",{frame:r.frames.getFrame(null,!0)})},r.reset=function(){r.stop({skipFire:1}),r.s_direction(r.props.direction),r.play(e),t.event.fire(r,"reset",{})},r.play=function(e){if(e=e||{},r.ended=0,!r.isAnimated&&(!r.lock||e.unlock)&&(!r.synchro||e.synchro)){l(),r.lock=0,r.paused=0,null!=e.opposite&&(r.frames.opposite=e.opposite);let n=r.dTrack,o=r.props.delay;e.skipDelay||!o||n.done?(s(r.sync||e.sync),delete r.sync):(r.tDelay=n.exp?o-n.exp:o,i=requestAnimationFrame(a),r.isAnimated=!0),t.event.fire(r,"play",{})}},r.pause=function(t){r.isAnimated&&(u("pause",t),r.paused=1)},r.toggle=function(t){r.isAnimated?u("pause",t):r.play(t)},r.stop=function(t){u("stop",t),r.dTime={},r.frames.reset(),r.paused=0},r.changeDirection=function(){r.frames.changeDirection()},this.parse=new function(){this.timing=function(t){let e=t;if("string"==typeof t)if(/linear/i.test(t))e={};else{let n=t.split("-")||[],i=n[0],r=n[1]||"inout";n[2]&&(r="inout"),e={type:"ease"===i?"quadratic":i,direction:r}}return e},this.MS=function(t){let e=parseFloat(t||0);return/s/i.test(t)&&(/ms/i.test(t)||(e*=1e3)),e}},r.init()}(e,{id:o,objects:t,props:a,vals:r});return e.event.addListener(u,"frameChange",n,e),u},e.remove=function(t){delete e.animations[t]},e.play=function(t){i("play",t)},e.pause=function(t){i("pause",t)},e.toggle=function(t){i("toggle",t)},e.stop=function(t){i("stop",t)},e.reset=function(t){i("reset",t)},e.seek=function(t){i("seek",t)},e.changeDirection=function(t){i("changeDirection",t)},e.setProps=function(t){i("setProps",t)},e.event=new function(t){let e=this;function n(t,e){let n=this;var i={};n.addEvent=function(t,e,n){let r=i[t]=i[t]||[{}];if(n){let t=!0;if(!0!==n)for(let e=0;e<r.length;e++){let i=r[e];if(i.req===n){t=!1;break}}t&&r.push({fn:e,req:n})}else r[0]={fn:e}},n.removeEvent=function(t,e){if(e){let n=i[t]||[];for(let t=0;t<n.length;t++){let i=n[t];i.req===e&&(n.splice(t,1),t--)}}else delete i[t]},n.fire=function(n,r){r=t.util.addToNewArray(r);let a=i[n]||[];for(let t=0;t<a.length;t++){let n=a[t].fn;n&&n.apply(e,r)}}}e.addListener=function(e,i,r,a){if(e){let o=t.util.addToNewArray;i=o(i),e=o(e);for(let o=0;o<e.length;o++)for(let s=0;s<i.length;s++){let u=e[o],l=u.PU_eventStore||(u.PU_eventStore=new n(t,u));l.addEvent(i[s],r,a)}}},e.removeListener=function(t,e,n){let i=t.PU_eventStore;i&&(e?i.removeEvent(e,n):delete t.PU_eventStore)},e.fire=function(t,e,n){let i=t.PU_eventStore;if(i)return n?n.isArray?"object"!=typeof n[0]&&(n[0]={}):n=[n]:n=[{}],n[0].type=e,n[0].target=t,i.fire(e,n)}}(e),e.tween=function(t){let n,i=n=t.startVal,r=t.endVal,a=t.duration||0,o=t.timing||{};if(i!==r&&0!==a){let s=e.timing["_"+o.direction]||e.timing._linear;n=(s[o.type]||s._||s.quadratic)(t.time,i,r-i,a)}return n},e.timing=new function(t){let e=this;e._linear={_:function(t,e,n,i){return n*t/i+e}},e._in={quadratic:function(t,e,n,i){return n*(t/=i)*t+e},cubic:function(t,e,n,i){return n*(t/=i)*t*t+e},quartic:function(t,e,n,i){return n*(t/=i)*t*t*t+e},quintic:function(t,e,n,i){return n*(t/=i)*t*t*t*t+e},sinusoidal:function(t,e,n,i){return-n*Math.cos(t/i*(Math.PI/2))+n+e},exponential:function(t,e,n,i){return 0===t?e:n*Math.pow(2,10*(t/i-1))+e},circular:function(t,e,n,i){return-n*(Math.sqrt(1-(t/=i)*t)-1)+e},elastic:function(t,e,n,i,r,a){if(r=0,0===t)return e;if(1==(t/=i))return e+n;let o;return a||(a=.3*i),r<Math.abs(n)?(r=n,o=a/4):o=a/(2*Math.PI)*Math.asin(n/r),-r*Math.pow(2,10*(t-=1))*Math.sin((t*i-o)*(2*Math.PI)/a)+e},back:function(t,e,n,i,r){return void 0===r&&(r=1.70158),n*(t/=i)*t*((r+1)*t-r)+e},bounce:function(e,n,i,r){return i-t.timing._out.bounce(r-e,0,i,r)+n}},e._out={quadratic:function(t,e,n,i){return-n*(t/=i)*(t-2)+e},cubic:function(t,e,n,i){return n*((t=t/i-1)*t*t+1)+e},quartic:function(t,e,n,i){return-n*((t=t/i-1)*t*t*t-1)+e},quintic:function(t,e,n,i){return n*((t=t/i-1)*t*t*t*t+1)+e},sinusoidal:function(t,e,n,i){return n*Math.sin(t/i*(Math.PI/2))+e},exponential:function(t,e,n,i){return t===i?e+n:n*(1-Math.pow(2,-10*t/i))+e},circular:function(t,e,n,i){return n*Math.sqrt(1-(t=t/i-1)*t)+e},elastic:function(t,e,n,i,r,a){if(r=0,0===t)return e;if(1==(t/=i))return e+n;let o;return a||(a=.3*i),r<Math.abs(n)?(r=n,o=a/4):o=a/(2*Math.PI)*Math.asin(n/r),r*Math.pow(2,-10*t)*Math.sin((t*i-o)*(2*Math.PI)/a)+n+e},back:function(t,e,n,i,r){return void 0===r&&(r=1.70158),n*((t=t/i-1)*t*((r+1)*t+r)+1)+e},bounce:function(t,e,n,i){return(t/=i)<1/2.75?n*(7.5625*t*t)+e:t<2/2.75?n*(7.5625*(t-=1.5/2.75)*t+.75)+e:t<2.5/2.75?n*(7.5625*(t-=2.25/2.75)*t+.9375)+e:n*(7.5625*(t-=2.625/2.75)*t+.984375)+e}},e._inout={quadratic:function(t,e,n,i){return(t/=i/2)<1?n/2*t*t+e:-n/2*(--t*(t-2)-1)+e},cubic:function(t,e,n,i){return(t/=i/2)<1?n/2*t*t*t+e:n/2*((t-=2)*t*t+2)+e},quartic:function(t,e,n,i){return(t/=i/2)<1?n/2*t*t*t*t+e:-n/2*((t-=2)*t*t*t-2)+e},quintic:function(t,e,n,i){return(t/=i/2)<1?n/2*t*t*t*t*t+e:n/2*((t-=2)*t*t*t*t+2)+e},sinusoidal:function(t,e,n,i){return-n/2*(Math.cos(Math.PI*t/i)-1)+e},exponential:function(t,e,n,i){return 0===t?e:t===i?e+n:(t/=i/2)<1?n/2*Math.pow(2,10*(t-1))+e:n/2*(2-Math.pow(2,-10*--t))+e},circular:function(t,e,n,i){return(t/=i/2)<1?-n/2*(Math.sqrt(1-t*t)-1)+e:n/2*(Math.sqrt(1-(t-=2)*t)+1)+e},elastic:function(t,e,n,i,r,a){if(r=0,0===t)return e;if(2==(t/=i/2))return e+n;let o;return a||(a=i*(.3*1.5)),r<Math.abs(n)?(r=n,o=a/4):o=a/(2*Math.PI)*Math.asin(n/r),t<1?r*Math.pow(2,10*(t-=1))*Math.sin((t*i-o)*(2*Math.PI)/a)*-.5+e:r*Math.pow(2,-10*(t-=1))*Math.sin((t*i-o)*(2*Math.PI)/a)*.5+n+e},back:function(t,e,n,i,r){return void 0===r&&(r=1.70158),(t/=i/2)<1?n/2*(t*t*((1+(r*=1.525))*t-r))+e:n/2*((t-=2)*t*((1+(r*=1.525))*t+r)+2)+e},bounce:function(e,n,i,r){return e<r/2?.5*t.timing._in.bounce(2*e,0,i,r)+n:.5*t.timing._out.bounce(2*e-r,0,i,r)+.5*i+n}}}(e),e.util=new function(t){let e=this;e.uids={},e.errorLog=new function(e){let n=this;n.items=[],n.log=function(e){let i=n.items;i.unshift(e),i.length>100&&(i.length=100),t.event.fire(n,"error",{data:e}),window.console&&console.log("animator Error: "+(e.msg||e.error))}}(e),e.isArray=function(t){return t&&t instanceof Array&&Array.isArray(t)},e.addToNewArray=function(t){return e.isArray(t)?t:[t]},e.cloneObj=function(t){return t?JSON.parse(JSON.stringify(t)):t},e.round=function(t,e){let n=e?Math.pow(10,e):1;return Math.round(t*n)/n},e.getPointDist=function(t,e,n,i){let r=t-n;var a=e-i;return Math.sqrt(r*r+a*a)}}(e),function(){for(let n in t){let i=e[n]||t[n];i&&!0!==i&&(e[n]=new i(e))}document.addEventListener("visibilitychange",r)}()};