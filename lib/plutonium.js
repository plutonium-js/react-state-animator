/*
 * Plutonium-js v1.0.7
 * (c) 2019 Jesse Dalessio
 * Released under the MIT license
*/
//Plutonium - Animation Library for React or Plain JavaScript
exports.plutonium = function(plugins) {
	
	var t = this;
	t.animations = {};
	
	//initialize plutonium (called at the end)
	function _init(){
		for (let i in plugins) t[i] = new (t[i]||plugins[i])(t);
		document.addEventListener("visibilitychange", _handle_visibility_change);
	}
		
	//animate to the provided values
	t.to = function(objects, duration, vals, props) {
		return _add('to', objects, duration, vals, props);
	}
		
	//animate from the provided values
	t.from = function(objects, duration, vals, props) {
		return _add('from', objects, duration, vals, props);
	}
	
	//animate the provided vals (each val should be an object containing keys)
	t.keys = function(objects, duration, vals, props) {
		return _add('keys', objects, duration, vals, props);
	}
	
	//add the to, from, or keys animation
	function _add(type, objects, duration, vals, props) {
		if (/to|from/.test(type)) {
			for (let i in vals) {
				let val = {keys:{}};
				val.keys[type] = vals[i].hasOwnProperty('val')?vals[i].val:vals[i];
				val.tween = vals[i].tween;
				vals[i] = val;
			}
		}
		props = props||{};
		if (!isNaN(duration)) duration = duration*1000;
		props.duration = duration||props.duration;
		return t.add({
			objects:objects,
			props:props,
			vals:vals
		});
	}
		
	//add an animation
	t.add = function(p) {
		//get or create the animation object
		let id = p.id||'PU'+Object.keys(t.animations).length+1;
		let anim = t.animations[id]; if (!anim) {
			anim = t.animations[id] = new _animation(t, p);
			t.event.addListener(anim,"frameChange",_g_a,t);
		}
		return anim;
		
		//this function is not inline to help reduce garbage collection
		function _g_a(e) {
			e.target.frames.tween(e);
		}
	}
	
	//remove an animation
	t.remove = function(id) {
		delete t.animations[id];
	}
	
	//play, pause, stop all animations
	t.play = function(p) {_action('play', p)}
	t.pause = function(p) {_action('pause', p)}
	t.stop = function(p) {_action('stop', p)}
	t.reset = function(p) {_action('reset', p)}
	t.seek = function(p) {_action('seek', p)}
	t.changeDirection = function(p) {_action('changeDirection', p)}
	t.setProps = function(p) {_action('setProps', p)}
	
	//perform an action on all animations (play, pause, stop)
	function _action(type, p) {
		p = p||{};
		var animations = t.animations; for (let i in animations) {
			if (!p.filter||p.filter(animations[i])) animations[i][type]();
		}
	}
	
	//handle visibility change
	function _handle_visibility_change(e) {
		document.hidden?t.pause():t.play({filter:animation=>{
			return animation.paused;
		}});
	}
	
	//animation object
	function _animation(plutonium, p) {

		p = p||{};
		var t = this;
		t.params = p;
		t.plutonium = plutonium;
		t.id = p.id;
		t.props = {};
		t.timers = {};
		t.isAnimated = false;
		var mapStates;
		var requestFrameId;
		t.direction = 'forwards';
		t.dTrack = {};
		t.sync = p.sync;
		
		//init after object creation (called at the end of this object)
		t.init = function() {
			//map playState names to methods
			mapStates = {
				running:t.play,
				paused:t.pause,
				stopped:t.stop
			}
			t.frames = new _frames(t);
			t.objects = plutonium.util.addToNewArray(p.objects);
			t.setProps(p.props);
		}

		//add event listener API shortcut
		t.addListener = function(name, func, requestingObj) {
			plutonium.event.addListener(t, name, func, requestingObj);
		}
		
		//remove event listener API shortcut
		t.removeListener = function(name, func, requestingObj) {
			plutonium.event.removeListener(t, name, requestingObj);
		}
		
		//set prop - duration
		t.s_duration = function(duration, p) {
			p = p||{};
			duration = t.parse.MS(duration);
			let prevDuration = (p.prevProps||{}).duration;
			if (!t.frames.stopped) t.frames.changeDuration(duration, prevDuration);
			t.props.duration = duration;
		}

		//set prop - delay
		t.s_delay = function(delay) {
			t.props.delay = t.parse.MS(delay);
		}

		//set prop - timing
		t.s_timing = function(timing) {
			timing = t.parse.timing(timing);
			t.props.timing = timing||{};
		}

		//set prop - direction
		t.s_direction = function(direction) {
			t.frames.loop.alternate = !!/alternate/i.test(direction);
			let reverse = _get_reverse_status();
			if ((!!t.frames.reverse)!==reverse) t.frames.changeDirection();
		}

		//returns true if the animation should be in reverse
		function _get_reverse_status() {
			let rev = /rev/i.test(t.props.direction);
			let loop = t.frames.loop; if (loop.alternate) {
				let lc = loop.cur;
				let isEven = (lc/2)===parseInt(lc/2);
				rev = isEven!==rev;
			}
			return rev;
		}

		//set prop - iteration count
		t.s_iterationCount = function(value) {
			t.frames.loop.setValue(value);
		}

		//set prop - synchronous enabled
		t.s_synchro_enabled = function(enabled) {
			t.synchro = enabled;
		}

		//set prop - synchronous direction
		t.s_synchro_direction = function(direction, p) {
			if (t.synchro) {
				//t.frames.opposite = t.srcData.nodeObj.synchroM.getRev(direction);
				t.frames.applyDirection();
			}
		}

		//set prop - playstate
		t.s_playState = function(playState) {
			//execute the map state func ('play', 'pause', 'stop', 'reset' etc...)
			(mapStates[playState]||t[playState]||t.stop)();
		}

		//set properties (it's safe to set properties while animating, changes will be seamlessly adopted)
		t.setProps = function(props) {
			if (props) {
				let prevProps = t.props||{};
				t.props = {
					duration:0,
					timing:{"type":"quadratic","direction":"inout"},
					delay:0,
					iterationCount:1,
					direction:'normal',
					fillMode:'none',
					synchro_enabled:null,
					synchro_direction:'normal',
					synchro_interationCount:1,
					playState:'running'
				};
				for (let i in t.props) {
					let val = props[i]!=null?props[i]:t.props[i];
					t.props[i] = val;
					let setFunc = t['s_'+i]; if (setFunc) {
						setFunc(val, {
							prevProps:prevProps
						});
					}
				}
			}
		}

		//seek a position (this works regardless of play, paused, or stopped status)
		t.seek = function(pos) {
			pos = (pos<0?0:pos>100?100:pos)/100;
			t.frames.moveToTime(t.props.duration*pos);
			plutonium.event.fire(t, "frameChange", {
				frame:t.frames.getFrame(null, true)
			});
		}

		//reset (this stops, then plays the animation)
		t.reset = function() {
			t.stop({skipFire:1});
			t.s_direction(t.props.direction);
			t.play(p);
			plutonium.event.fire(t, "reset", {});
		}

		//play the animation
		t.play = function(p) {
			p = p||{};
			t.ended = 0;
			//if not already animated continue
			if (!t.isAnimated&&(!t.lock||p.unlock)&&(!t.synchro||p.synchro)) {
				_kill_delay_timer();
				t.lock = 0;
				t.paused=0;
				if (p.opposite!=null) t.frames.opposite = p.opposite;
				let dTrack = t.dTrack;
				let delay = t.props.delay;
				//run immediatly or on a delay
				if (!p.skipDelay && delay && !dTrack.done) {
					t.tDelay = dTrack.exp?delay-dTrack.exp:delay;
					requestFrameId = requestAnimationFrame(_g_a);
					t.isAnimated = true;
				}
				else {
					_run(t.sync||p.sync);
					delete t.sync;
				}
				plutonium.event.fire(t, "play", {});
			}
		}
		
		//this function is not inline to help reduce garbage collection
		function _g_a(e) {
			t.timers.delay = setTimeout(_g_b, t.tDelay);
			t.dTrack.start = Date.now();
		}

		//this function is not inline to help reduce garbage collection
		function _g_b(e) {
			_kill_delay_timer();
			t.dTrack.done = 1;
			_run();
		}

		//recursively run the animation
		function _run(timestamp) {
			t.isAnimated = true;
			let recurse = 1, frame;
			//note: timestamp is only null on the very first frame unless we a synchronizing with a timestamp from a different animation
			if (timestamp) {
				//get the animation frame at the timestamp
				frame = t.lFrame = t.frames.getFrame(timestamp);
				let status = frame.data.status;
				if (status.isLast) recurse=0;
				//fire events
				plutonium.event.fire(t, "frameChange", {
					frame:frame
				});
				if (status.iteration) {
					plutonium.event.fire(t, "iterate", {
						frame:frame
					});
				}
			}
			if (recurse) {
				requestFrameId = requestAnimationFrame(_run);
			}
			else {
				t.ended = 1;
				t.stop();
				plutonium.event.fire(t, "end", {
					frame:frame
				});
			}
		}

		//pause the animation
		t.pause = function(p) {
			if (t.isAnimated) {
				_pause_or_stop("pause", p);
				t.paused = 1;
			}
		}

		//stop the animation
		t.stop = function(p) {
			_pause_or_stop("stop", p);
			t.dTime = {};
			t.frames.reset();
			t.paused = 0;
		}

		//pause or stop (NOTE!!!: do not call directly, use t.stop or t.pause)
		function _pause_or_stop(type, p) {
			p = p||{};
			//note: when locked, animations will not play unless an unlock param is sent to t.play
			if (p.lock!=null) t.lock = p.lock
			cancelAnimationFrame(requestFrameId);
			if (t.timers.delay) {
				let dTrack = t.dTrack;
				dTrack.exp = (dTrack.exp||0)+Date.now()-dTrack.start;
				_kill_delay_timer();
			}
			else if (t.isAnimated) {
				//pause or stop the animation
				t.frames[type]();
			}
			t.isAnimated = false;
			//fire animation pause or stop event
			if (!p.skipFire) plutonium.event.fire(t, type, {});
		}
		
		//change the play direction
		this.changeDirection = function() {
			t.frames.changeDirection();
		}

		//kill the delay timer
		function _kill_delay_timer() {
			clearTimeout(t.timers.delay); delete t.timers.delay;
		}

		//tween a value	(note: everything that animates passes through here, this is truly the most basic and core portion of all the animation code. the tween value is calculated from the provided start value, end value, duration, time, and timing/easing function)
		t.tween = function(p) {
			let rVal;
			let sv = rVal = p.startVal; let ev = p.endVal; let dur = p.duration||0;
			let timing = p.timing||{};
			if (sv!==ev && dur!==0) {
				let tDirection = t.timing["_"+timing.direction]||t.timing._linear;
				let timingFunc = tDirection[timing.type]||tDirection._||tDirection.quadratic;
				rVal = timingFunc(p.time, sv, ev-sv, dur);
			}
			return rVal;
		}

		//easing / timing functions
		//eslint-disable-next-line
		t.timing = new _timing(t); function _timing(animation) {

			var t = this;
		
			//linear type function
			t._linear = {
				_: function(t,b,c,d){return c*t/d+b;}
			};

			//in type functions
			t._in = {
				quadratic: function(t,b,c,d){return c*(t/=d)*t+b;},
				cubic: function(t,b,c,d){return c*(t/=d)*t*t + b;},
				quartic: function(t,b,c,d){return c*(t/=d)*t*t*t + b;},
				quintic: function(t,b,c,d){return c*(t/=d)*t*t*t*t + b;},
				sinusoidal: function(t,b,c,d){return -c * Math.cos(t/d * (Math.PI/2)) + c + b;},
				exponential: function(t,b,c,d){return (t===0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;},
				circular: function(t,b,c,d){return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;},
				elastic: function(t,b,c,d,a,p){a=0;
					if (t===0) return b;  if ((t/=d)===1) return b+c;  if (!p) p=d*.3;
					let s; if (a < Math.abs(c)) { a=c; s=p/4; }
					else s = p/(2*Math.PI) * Math.asin (c/a);
					return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
				},
				back: function(t,b,c,d,s){if (s === undefined) s = 1.70158;return c*(t/=d)*t*((s+1)*t - s) + b;},
				bounce: function(t,b,c,d){return c - animation.timing._out.bounce (d-t, 0, c, d) + b;}
			};
			//out type functions
			t._out = {
				quadratic: function(t,b,c,d){return -c *(t/=d)*(t-2) + b;},
				cubic: function(t,b,c,d){return c*((t=t/d-1)*t*t + 1) + b;},
				quartic: function(t,b,c,d){return -c * ((t=t/d-1)*t*t*t - 1) + b;},
				quintic: function(t,b,c,d){return c*((t=t/d-1)*t*t*t*t + 1) + b;},
				sinusoidal: function(t,b,c,d){return c * Math.sin(t/d * (Math.PI/2)) + b;},
				exponential: function(t,b,c,d){return (t===d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;},
				circular: function(t,b,c,d){return c * Math.sqrt(1 - (t=t/d-1)*t) + b;},
				elastic: function(t,b,c,d,a,p){a=0;
					if (t===0) return b;  if ((t/=d)===1) return b+c;  if (!p) p=d*.3;
					let s; if (a < Math.abs(c)) { a=c; s=p/4; }
					else s = p/(2*Math.PI) * Math.asin (c/a);
					return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
				},
				back: function(t,b,c,d,s){if (s === undefined) s = 1.70158;return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;},
				bounce: function(t,b,c,d){
					if ((t/=d) < (1/2.75)) {
						return c*(7.5625*t*t) + b;
					} else if (t < (2/2.75)) {
						return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
					} else if (t < (2.5/2.75)) {
						return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
					} else {
						return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
					}
				}
			};
			//inout type functions
			t._inout = {
				quadratic: function(t,b,c,d){if ((t/=d/2) < 1) return c/2*t*t + b;return -c/2 * ((--t)*(t-2) - 1) + b;},
				cubic: function(t,b,c,d){if ((t/=d/2) < 1) return c/2*t*t*t + b;return c/2*((t-=2)*t*t + 2) + b;},
				quartic: function(t,b,c,d){if ((t/=d/2) < 1) return c/2*t*t*t*t + b;return -c/2 * ((t-=2)*t*t*t - 2) + b;},
				quintic: function(t,b,c,d){if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;return c/2*((t-=2)*t*t*t*t + 2) + b;},
				sinusoidal: function(t,b,c,d){return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;},
				exponential: function(t,b,c,d){if (t===0) return b;if (t===d) return b+c;if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;},
				circular: function(t,b,c,d){if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;},
				elastic: function(t,b,c,d,a,p){a=0;
					if (t===0) return b;  if ((t/=d/2)===2) return b+c;  if (!p) p=d*(.3*1.5);
					let s; if (a < Math.abs(c)) { a=c; s=p/4; }
					else s = p/(2*Math.PI) * Math.asin (c/a);
					if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
					return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
				},
				back: function(t,b,c,d,s){
					if (s === undefined) s = 1.70158;
					if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
					return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
				},
				bounce: function(t,b,c,d){
					if (t < d/2) return animation.timing._in.bounce (t*2, 0, c, d) * .5 + b;
					return animation.timing._out.bounce (t*2-d, 0, c, d) * .5 + c*.5 + b;
				}
			};
		}
		
		//parsing functions
		//eslint-disable-next-line
		this.parse = new function() {

			var t = this;

			//parse timing value (returns a timing object with the type and direction as properties)
			t.timing = function(val) {
				let rVal = val;
				if (typeof val=="string") {
					if (/linear/i.test(val)) {
						rVal = {};
					}
					else {
						let split = val.split("-")||[];
						let type = split[0];
						let direction = split[1]||'inout';
						if (split[2]) direction = 'inout';
						rVal = {
							type:type==="ease"?"quadratic":type,
							direction:direction
						}
					}
				}
				return rVal;
			}

			//parse milliseconds (converts seconds to milliseconds if necessary)
			t.MS = function(val) {
				let rVal = parseFloat(val||0);
				if (/s/i.test(val)) {
					if (!/ms/i.test(val)) {
						rVal = rVal*1000;
					}
				}
				return rVal;
			}
		}
		
		//initialize the animation object
		t.init();
	}

	//frames object (This is the animation engine.)
	function _frames(animation) {

		var t = this;
		t.animation = animation;
		var plutonium = animation.plutonium;
		t.timestamp=0;										//the current time stamp (set on request animation frame from the animations run function)
		t.startTime=0;										//the animation start time (in timestamp time)
		t.time=0;											//the animation time (this is from 0 to the length of time into the duration)
		t.reverseTime = null;								//the time at which the animation direction was switched into reverse (in timestamp time)
		t.opposite=0;										//if true animate opposite to the set direction (e.g. if 'forward' animate in 'reverse')
		t.reverse = false;
		t.paused = false;
		t.stopped = true;
		t.lastDir = 'forwards';
		t.loop = new _loop(t);
		var regex_1 = /[-]{0,1}[\d]*[.]{0,1}[\d]/g;
		
		//reset the animation object
		this.reset = function() {
			t.loop.reset();
			t.reverse = false;
			t.reverseTime = null;
			t.timestamp=0;
			t.startTime=0;
			t.time=0;
		}

		//play the animation (play from the beginning or the paused time)
		this.play = function() {
			t.reverseTime = null;
			if (t.paused) {
				//adjust the start time (subtract the time from now)
				t.startTime = t.timestamp-t.time;
			}
			else {
				if (_is_reverse()) {
					//set the start time to now minus the duration (so we start at the end)
					t.startTime = t.timestamp-t.animation.props.duration;
				}
				else {
					//set the start time to now
					t.startTime = t.timestamp;
				}
				t.time = 0;
			}
			t.applyDirection();
			t.stopped = false;
			t.paused = false;
		}

		//pause the animation
		this.pause = function() {
			t.paused = true;
		}

		//stop the animation
		this.stop = function() {
			t.stopped = true;
		}

		//returns true if the fill mode matches the play direction ('both', 'forwards', 'backwards')
		this.fillModeMatches = function() {
			let fillMode = animation.props.fillMode; if (fillMode) {
				if (/both/i.test(fillMode) || fillMode.toLowerCase()===t.lastDir) return true;
			}
		}

		//return true if the play direction is reversed
		function _is_reverse() {
			return t.opposite?!t.reverse:t.reverse;
		}

		//change the direction (can be changed while animating)
		this.changeDirection = function() {
			t.reverse = !t.reverse;
			t.applyDirection();
		}

		//apply the direction
		this.applyDirection = function() {
			if (_is_reverse()) {
				if (!t.reverseTime) t.reverseTime = t.timestamp;
				t.lastDir = 'backwards';
			}
			else {
				if (t.reverseTime) {
					t.startTime = t.timestamp-t.time;
					t.reverseTime = null;
				}
				t.lastDir = 'forwards';
			}
		}

		//set the time
		function _set_time() {
			if (t.reverseTime) {
				t.time = (t.reverseTime-t.startTime)-(t.timestamp-t.reverseTime);
			}
			else {
				t.time = t.timestamp-t.startTime;
			}
			return t.time;
		}

		//returns the position expressed as a fraction of the duration (between 0 and 1)
		this.getPos = function(duration) {
			let time = _set_time();
			let pos = time/(duration||animation.props.duration);
			if (isNaN(pos) || !isFinite(pos)) pos = 0;
			return pos;
		}

		//change the duration (can be changed while animating)
		this.changeDuration = function(newDuration, curDuration) {
			curDuration = curDuration||animation.props.duration
			let pos = t.getPos(curDuration);
			let newTime = newDuration*pos;
			t.moveToTime(newTime);
			_set_time();
		}

		//move to a time in milliseconds (can move while animating)
		this.moveToTime = function(time) {
			time = time||0;
			t.startTime = t.timestamp-time;
			if (t.reverseTime) t.reverseTime = t.timestamp;
		}

		//get the frame data at the provided time stamp
		this.getFrame = function(timestamp, skipPlay) {
			let tStamp = t.timestamp = timestamp||t.timestamp;
			if (!skipPlay&&(t.paused||t.stopped)) t.play();
			let time = _set_time();
			let status = {};
			let props = animation.props;
			let duration = props.duration;
			let atStart = time<=0;
			let atEnd = time>=duration;
			if (atStart||atEnd) {
				//if on the last loop frame continue
				if ((atStart&&_is_reverse())||(atEnd&&!_is_reverse())) {
					if (t.loop.canAdvance()) {
						t.loop.advance();
						status.iteration = t.loop.cur-1;
						t.play();
						//adjust the time (NOTE!!!: This was tricky, don't mess with it.)
						let adj = Math.abs(time-(atEnd?duration:0)); _is_reverse()?t.startTime+=adj:t.startTime-=adj;
						time = _set_time();
					}
					else {
						time = atStart?0:duration;
						status.isLast=true;
					}
				}
				else {
					status.isFirst=true;
				}
			}
			return {
				animation:t,
				data:{
					time:time,
					stamp:tStamp,
					pos:((time/duration)*100)||0,
					timing:props.timing,
					duration:duration,
					iterationCount:t.loop.cur-1,
					status:status
				}
			};
		}
	
		//tween the objects associated with this animation using the provided frame data
		t.tween = function(p) {
			//loop the objects
			let objects = animation.objects; for (let i=0;i<objects.length;i++) {
				let object = objects[i];
				let frameData = p.frame.data;
				let isFirst = frameData.status.isFirst;
				let objData = _get_object_data(object, isFirst);
				//loop the vals data (if there is a state object containing vals with this animation id then this is a react component)
				let valsData = objData.vals[animation.id]; for (let j in valsData) {
					let valData = valsData[j];
					let keyData = _get_key_data(frameData, valData);
					let vals = keyData.vals
					let startVal = vals.start;
					let endVal=vals.end;
					//get or init the object data tween object (this is save data for this specific tween)
					if (isFirst) objData.tweens[animation.id][j] = {initVals:plutonium.util.cloneObj(valsData)};
					let objTween = objData.tweens[animation.id][j];
					let zoneChange = objTween.lastZone!==keyData.zone;
					//if the zone has changed or the start and end vals differ continue
					if (zoneChange || frameData.startVal!==endVal) {
						let tweenVal = _is_reverse()?endVal:startVal;
						let tweenData = valData.tween||{};
						if (!tweenData.disabled) {
							//if both vals are numbers continue
							if (!isNaN(startVal) && !isNaN(endVal)) {
								tweenVal = animation.tween({
									startVal:startVal,
									endVal:endVal,
									//timing:keyData.timing||frameData.timing,
									timing:frameData.timing,
									time:keyData.time,
									duration:keyData.duration
								});
								tweenVal = plutonium.util.round(tweenVal, 6);
								tweenVal = tweenData.modify?tweenData.modify(tweenVal):tweenVal; 
							}
							else {
								if (tweenData.isPath) {
									if (startVal!==endVal && startVal && endVal) {
										if (zoneChange) {
											//create a morph interpolation from the start and end path data
											const morph = plutonium.morph; 
											objTween.ipol = morph.interpolate([
												morph.parsePath(startVal),
												morph.parsePath(endVal)
											]);
										}
										//interpolate at the position (this creates the morphed shape for the frame position)
										tweenVal = objTween.ipol(frameData.pos/100);
									}
								}
								else {
									//continue if both the start and end vals contain a number
									if (/\d/.test(startVal)&&/\d/.test(endVal)) {
										let pStart = startVal.match(regex_1);
										let pEnd = endVal.match(regex_1);
										let pSmallerLen = (pStart.length>pEnd.length?pEnd:pStart).length;
										let tweenVals = new Array(pSmallerLen); 
										for (let k=0;k<pSmallerLen;k++) {
											//get the tween val
											tweenVals[k] = animation.tween({
												startVal:parseFloat(pStart[k]),
												endVal:parseFloat(pEnd[k]),
												//timing:keyData.timing||frameData.timing,
												timing:frameData.timing,
												time:keyData.time,
												duration:keyData.duration
											});
											tweenVals[k] = plutonium.util.round(tweenVals[k], 6);
										}
										//replace the start val string vals with the tweened vals
										let index=0; tweenVal = startVal.replace(regex_1,(match)=>{
											if (index<pSmallerLen) {
												let tweenVal = tweenVals[index];
												match = tweenData.modify?tweenData.modify(tweenVal):tweenVal; 
												index++;
											}
											return match;
										});
									}
								}
							}
						}
						//apply the tween val to the valData (note: when the object is a react component this is mutating the state which is OK because we are going to set the state after this)
						valData.val = tweenVal;
						if (objData.isElm) {
							if (tweenData.applyAs==='attribute') object.setAttributeNS(null, j, tweenVal);
							else object.style[j] = tweenVal;
						}
					}
					objTween.lastZone = keyData.zone;
				}
				//set the component state (this tells react to render the state changes)
				if (object.isReactComponent) object.setState(object.state);
			}
		}
		
		//get or initialize plutonium data on the object (objects are react components, or dom elements)
		function _get_object_data(obj, isFirst) {
			let data = obj.PU_data; if (!data) {
				data = obj.PU_data = {
					isElm:(obj instanceof Element),
					vals:{},
					tweens:{}
				};
			}
			if (isFirst) {
				let vals = data.vals[animation.id] = (obj.state||{})[animation.id]||animation.params.vals;
				//loop and set the initial value
				for (let i in vals) {
					let valData = vals[i];
					if (data.isElm) {
						let applyAs = (valData.tween||{}).applyAs;
						let iVal = valData.iVal = applyAs==='attribute'?obj.getAttributeNS(null,i):obj.style[i];
						//if an initial val 'iVal' was not found set the value to the first key and change all numbers to 0
						let firstKeyVal; if ((iVal===null||iVal==="") && (firstKeyVal=valData.keys[Object.keys(valData.keys)[0]])!==null) {
							if (typeof firstKeyVal=="string") {
								firstKeyVal = firstKeyVal.replace(regex_1,"0");
							}
							else firstKeyVal=0;
							valData.iVal = firstKeyVal;
						}
					}
					else {
						valData.iVal = valData.val;
					}
				}
				data.tweens[animation.id] = {};
			}
			return data;
		}
		
		//returns key data (start and end vals, time, duration, etc...)
		function _get_key_data(frameData, valData) {
			let keys = valData.keys||valData;
			let rData = {};
			let rVals = rData.vals = {};
			let pos = frameData.pos;
			let startPos=0, endPos=0;
			let isLast = frameData.status.isLast;
			//loop key names
			let keyNames = Object.keys(keys); for (let i=0;i<keyNames.length;i++) {
				let key = keys[keyNames[i]];
				rData.zone = i+1;
				//get the key pos from the key id (e.g. 'start', 'end', 'pos_12.5', etc...)
				let keyPos = _get_key_pos_from_id(keyNames[i]);
				if (pos>=keyPos) {
					let nextKeyName = (i<keyNames.length-1)?keyNames[i+1]:null;
					//if there is not a next key name or the pos is less then the next key pos continue
					let nextKeyPos; if (!nextKeyName||pos<(nextKeyPos=_get_key_pos_from_id(nextKeyName))) {
						startPos = keyPos||0; rVals.start = key;
						//rData.timing = key.timing;
						let eKey = nextKeyName?keys[nextKeyName]:key;
						endPos = nextKeyPos||keyPos||0; rVals.end = eKey;
						if (!nextKeyName) {
							//we only get here when we are after the last key
							if (!isLast) rVals.end = valData.iVal;
							rData.aKeys = 1;
							endPos=100;
						}
						break;
					}
				}
				else {
					//we only get here when we are before the first key
					if (!isLast) rVals.start = valData.iVal;
					rVals.end = key;
					rData.bKeys = 1;
					endPos = keyPos;
					rData.zone = 0;
					break;
				}
			}
			if (frameData.status.isLast&&!t.fillModeMatches()) {
				rVals.start = rVals.end = valData.iVal;
			}
			//the zoneSize is the distance between the current start and end key
			let zoneSize = endPos-startPos;
			rData.duration = (zoneSize/100)*frameData.duration;
			rData.time = ((pos-startPos)/100)*frameData.duration;
			frameData.keyPos = zoneSize?((pos-startPos)/zoneSize)*100:0;
			return rData;
		}
		
		//get the key pos from the id (e.g. 'start', 'end', 'pos_12.5', 'pos_50', etc...)
		function _get_key_pos_from_id(id) {
			return id==='from'?0:id==='to'?100:parseFloat(id.substring(id.indexOf('_')+1));
		}
	
		//loop object (manages looping / iteration counts)
		function _loop(frames) {

			var t = this;
			t.isInfinite = false;
			t.alternate = false;
			t.max = 1;
			t.cur = 1;

			//set value (integer or 'infinite')
			t.setValue = _set_value; function _set_value(value) {
				t.isInfinite = !!(value==="infinite");
				let parsedValue = parseInt(value);
				t.max = !isNaN(parsedValue)?parsedValue:1;
			}

			//reset the object
			t.reset = function() {
				t.cur = 1;
			}

			//returns true if the loop can advance
			t.canAdvance = function(){
				return t.isInfinite||t.cur<t.max;
			}

			//advance the loop
			t.advance = function(status) {
				t.cur++;
				if (t.alternate) frames.changeDirection();
			}
		}
	}
	
	//custom event handling
	//eslint-disable-next-line
	t.event = new _event(t); function _event(plutonium) {
		
		var t = this;
		
		//add a custom event listener (fn=function to execute, reqestingObj: can be true or the object requesting the event, allows a single event name to be used multiple times on a single object, or once per reqestingObj)
		t.addListener=function(srcObjs, evtNames, fn, requestingObj) {
			if (srcObjs) {	
				let addToNewArray = plutonium.util.addToNewArray;
				evtNames = addToNewArray(evtNames);
				srcObjs = addToNewArray(srcObjs);
				for (let i=0;i<srcObjs.length;i++) {
					for (let j=0;j<evtNames.length;j++) {
						let srcObj = srcObjs[i];
						//get or create a new event store object (the event store is added to the src object and is responsible for firing events)
						let eventStore = srcObj.Plutonium_eventStore||(srcObj.Plutonium_eventStore=new _event_store(plutonium, srcObj));
						eventStore.addEvent(evtNames[j], fn, requestingObj);
					}
				}
			}
		}
		
		//remove a custom event listener
		t.removeListener=function(src, evtName, requestingObj) {
			let es = src.Plutonium_eventStore; if (es) {
				if (evtName) {
					//remove the specific event or specific event with the matching requesting object
					es.removeEvent(evtName, requestingObj);
				}
				else {
					//remove the entire event store
					delete src.Plutonium_eventStore;
				}
			}
		}
			
		//fire a custom event (src=object, evt=event name to fire, args=object of custom properties to include in the returned event object)
		t.fire=function(srcObj, evtName, args) {
			let eventStore = srcObj.Plutonium_eventStore; if (eventStore) {
				if (args) {
					if (!args.isArray) args=[args];
					else if (typeof args[0]!="object") args[0]={};
				}
				else args=[{}];
				args[0].type=evtName;
				args[0].target=srcObj;
				return eventStore.fire(evtName, args);
			}
		}
		
		//event store object (note: the event store gets attached to the target object as an eventStore property 'Plutonium_eventStore'. the event store is called upon to fire events for the src object it is attached to.)
		function _event_store (plutonium, src) {
		
			var t = this;
			var events={};
			
			//add event
			t.addEvent = function(name, fn, requestingObj) { 
				//get or init the event functions object (init the event name array with an empty object - this is so that if the first event is added with a requesting object it is not put in the index 0 slot and overwritten later by an event without a requestingObj)
				let eventFns = events[name] = events[name]||[{}]; 
				if (requestingObj) {
					let add = true; if (requestingObj!==true) {
						for (let i=0; i<eventFns.length; i++) {
							let fnObj = eventFns[i];
							if (fnObj.req === requestingObj) {
								add = false;
								break;
							}
						}
					}
					if (add) {
						eventFns.push({
							fn:fn,
							req:requestingObj
						});
					}
				}
				else eventFns[0] = {fn:fn}
			}
			
			//remove an event from the eventStore (remove the entire event name, or if a requesting object is provided it looks for and removes the specific requesting object)
			t.removeEvent = function(evtName, requestingObj) {
				if (!requestingObj) {
					delete events[evtName];
				}
				else {
					//get the event functions array and loop
					let eventFns = events[evtName]||[]; for (let i=0; i<eventFns.length; i++) {
						let eventFn = eventFns[i];
						if (eventFn.req === requestingObj) {
							eventFns.splice(i,1); i--;
						}
					}
				}
			}
			
			//fire event
			t.fire=function(name, args) {
				args = plutonium.util.addToNewArray(args);
				let eventFns = events[name]||[]; for (let i=0; i<eventFns.length; i++) {
					let fn = eventFns[i].fn; if (fn) {
						fn.apply(src, args);
					}
				}
			}
		}
	}
	
	//utility functions
	//eslint-disable-next-line
	t.util = new _util(t); function _util(plutonium) {
		
		var t = this;
		t.uids = {};
		
		//error log
		//eslint-disable-next-line
		t.errorLog = new _error_log(t); function _error_log(util) {
			
			var t = this;
			t.items = [];
			
			//log an error
			t.log = function(data) {
				let items = t.items;
				items.unshift(data);
				if (items.length>100) items.length=100;
				plutonium.event.fire(t, 'error', {
					data:data
				});
				if (window.console) console.log('Plutonium Error: '+(data.msg||data.error));
			}
		}
		
		//return true if the provided object is an array
		t.isArray = function(obj) {
			return obj&&(obj instanceof Array)&&Array.isArray(obj);
		}
		
		//add the object to a new array if it's not already an array
		t.addToNewArray = function(obj) {
			return t.isArray(obj)?obj:[obj];
		}
		
		//clone an object
		t.cloneObj = function(obj) {
			//return the clone
			return obj?JSON.parse(JSON.stringify(obj)):obj;
		}
		
		//round a number (if places is specified round the decimal number to the number of decimal places)
		t.round = function(num, places) {
			let md = places?Math.pow(10, places):1;
			return Math.round(num*md)/md;
		}
	
		//get the distance between two points
		t.getPointDist = function(x1, y1, x2, y2) {
			let a = x1 - x2; var b = y1 - y2;
			return Math.sqrt(a*a + b*b);
		}
	}
	_init();
}

//polymorph (note: this source code is copyright polymorph and distributed under an MIT license - https://github.com/notoriousb1t/polymorph - this source code has been modified to fix bugs and work with Plutonium - see comments for changes)
//This code is responsible for morphing SVG paths. The code interpolates and fills in points as needed creating a smooth transition between two or more shapes regardless of differences in point quantity.
exports.morph = function(plutonium) {

	var _ = undefined;
	var V = 'V', H = 'H', L = 'L', Z = 'Z', M = 'M', C = 'C', S = 'S', Q = 'Q', T = 'T', A = 'A';
	var EMPTY = ' ';
	var util = plutonium.util;
	
	function isString(obj) {
		return typeof obj === 'string';
	}

	function renderPath(data, formatter) {
		var ns = data.ns;
		if (isString(ns)) {
			return ns;
		}
		var result = [];
		for (var i = 0; i < ns.length; i++) {
			var n = ns[i];
			result.push(M, formatter(n[0]), formatter(n[1]), C);
			var lastResult = void 0;
			for (var f = 2; f < n.length; f += 6) {
				var p0 = formatter(n[f]);
				var p1 = formatter(n[f + 1]);
				var p2 = formatter(n[f + 2]);
				var p3 = formatter(n[f + 3]);
				var dx = formatter(n[f + 4]);
				var dy = formatter(n[f + 5]);
				var isPoint = p0 === dx && p2 === dx && p1 === dy && p3 === dy;
				if (!isPoint || lastResult !== (lastResult = ('' + p0 + p1 + p2 + p3 + dx + dy))) {
					result.push(p0, p1, p2, p3, dx, dy);
				}
			}
			//close the sub path if applicable
			if (data.z[i]) result.push(Z);
		}
		return result.join(EMPTY);
	}

	var math = Math;
	var abs = math.abs;
	var min = math.min;
	var max = math.max;
	var floor = math.floor;
	var sqrt = math.sqrt;
	var pow = math.pow;
	var cos = math.cos;
	var asin = math.asin;
	var sin = math.sin;
	var tan = math.tan;
	var PI = math.PI;
	var quadraticRatio = 2.0 / 3;
	var EPSILON = pow(2, -52);

	function fillObject(dest, src) {
		for (var key in src) {
			if (!dest.hasOwnProperty(key)) {
				dest[key] = src[key];
			}
		}
		return dest;
	}

	function createNumberArray(n) {
		return new (window.Float32Array?Float32Array:Array)(n);
	}

	//fill path segments/sub paths (note: this adds segments/sub paths so both paths have an equal number of segments/sub paths)
	function fillSegments(larger, smaller, origin) {
		var largeLen = larger.length;
		var smallLen = smaller.length;
		if (largeLen < smallLen) {
			return fillSegments(smaller, larger, origin);
		}
		smaller.length = largeLen;
		for (var i = smallLen; i < largeLen; i++) {
			var l = larger[i];
			var d = createNumberArray(l.d.length);
			for (var k=0;k<l.d.length;k+=2) {
				//center all points in the larger space (note: this has been modified by Plutonium to center the point vs. the default origin positioning)
				d[k] = l.x+(l.w/2);
				d[k+1] = l.y+(l.h/2);
			}
			smaller[i] = fillObject({d:d}, l);
		}
	}

	//rotate points (note: this has been modified by Plutonium)
	function rotatePoints(ns, count) {
		var len = ns.length;
		var rightLen = len - count;
		var buffer = createNumberArray(count);
		var i;
		for (i = 0; i < count; i++) {
			buffer[i] = ns[i];
		}
		for (i = count; i < len; i++) {
			ns[i - count] = ns[i];
		}
		for (i = 0; i < count; i++) {
			ns[rightLen + i] = buffer[i];
		}
	}
	
	//reverse points direction form clockwise to counter clockwise or vice versa (part of normalization)
	//NOTE: this is a plutonium added feature
	function _reverse_points_direction(ns) {
		var reversed = [];
		//loop the buffer
		var px=ns[0],py=ns[1]; for (let i=2;i<ns.length;i=i+6) {
			//add the cubic bezier points to the beginning of the return array
			reversed.unshift(ns[i+2], ns[i+3], ns[i], ns[i+1], px, py);
			//save previous x and y
			px = ns[i+4]; py = ns[i+5];
		}
		//add the start 'M' point
		reversed.unshift(ns[0],ns[1]);
		//loop the reversed array and update the segements array
		for (let i=0;i<reversed.length;i++) ns[i] = reversed[i];
	}
	
	//normalize points (note: normalization roates and changes point flow direction)
	//NOTE: normalization has been modified by Plutonium
	function normalizePoints(ns) {
		//get the buffer array and length
		var buffer = ns.slice(2); var len = buffer.length;
		//init the area
		var area=0;
		//init min vars and loop the buffer
		var minIndex, minAmount; for (let i=0;i<len;i+=6) {
			//get x and y
			var x = buffer[i]; var y = buffer[i+1];
			//get the distance between the point and the origin
			var dist = util.getPointDist(0, 0, x, y);
			//set the index to the min distance if applicable
			if (minAmount === _ || dist < minAmount) {
				minAmount = dist;
				minIndex = i;
			}
			//get the next point index and points
			var nextI = (i+6)%len; var nextX = buffer[nextI]; var nextY = buffer[nextI+1];
			//add or substract from the area
			area += x * nextY;
			area -= nextX * y;
		}
		//rotate the points
		rotatePoints(buffer, minIndex);
		//set the segements to the buffer
		ns[0] = buffer[len - 2];
		ns[1] = buffer[len - 1];
		for (let i = 0; i < len; i++) {
			ns[i + 2] = buffer[i];
		}
		//get the clockwise status and change the point direction if not true
		var cw = area/2>0; if (!cw) _reverse_points_direction(ns);
	}
	
	function fillPoints(matrix, addPoints) {
		var ilen = matrix[0].length;
		for (var i = 0; i < ilen; i++) {
			var left = matrix[0][i];
			var right = matrix[1][i];
			var totalLength = max(left.length+addPoints, right.length+addPoints);
			matrix[0][i] = fillSubpath(left, totalLength);
			matrix[1][i] = fillSubpath(right, totalLength);
		}
	}
	
	function fillSubpath(ns, totalLength) {
		var totalNeeded = totalLength-ns.length;
		var ratio = Math.ceil(totalNeeded/ns.length);
		var result = createNumberArray(totalLength);
		result[0] = ns[0];
		result[1] = ns[1];
		var k = 1, j = 1;
		while (j < totalLength - 1) {
			result[++j] = ns[++k];
			result[++j] = ns[++k];
			result[++j] = ns[++k];
			result[++j] = ns[++k];
			var dx = result[++j] = ns[++k];
			var dy = result[++j] = ns[++k];
			if (totalNeeded) {
				//note: Plutonium changed f = ratio to f <= ratio (this edit fixed a bug where not all the fill sub path data was bieng added correctly for some morphs)
				for (var f = 0; f <= ratio && totalNeeded; f++) {
					result[j + 5] = result[j + 3] = result[j + 1] = dx;
					result[j + 6] = result[j + 4] = result[j + 2] = dy;
					j += 6;
					totalNeeded -= 6;
				}
			}
		}
		return result;
	}

	function sizeDesc(a, b) {
		return b.p - a.p;
	}
	
	//normalize paths
	function normalizePaths(left, right, options) {
		var leftPath = getSortedSegments(left);
		var rightPath = getSortedSegments(right);
		if (leftPath.length !== rightPath.length) {
			fillSegments(leftPath, rightPath, options.origin);
		}
		var matrix = Array(2);
		matrix[0] = leftPath.map(toPoints);
		matrix[1] = rightPath.map(toPoints);
		for (var i = 0; i < leftPath.length; i++) {
			if (leftPath[i].z||rightPath[i].z) {
				normalizePoints(matrix[0][i]);
				normalizePoints(matrix[1][i]);
			}
		}
		fillPoints(matrix, options.addPoints*6);
		return matrix;
	}
	
	function getSortedSegments(path) {
		return path.data.slice().sort(sizeDesc);
	}
	
	function toPoints(p) {
		return p.d;
	}

	var defaultOptions = {
		addPoints: 0,
		origin: { x: 0, y: 0 }
	};
	
	function interpolatePath(paths, options) {
		options = fillObject(options, defaultOptions);
		var hlen = paths.length - 1;
		var items = Array(hlen);
		for (var h = 0; h < hlen; h++) {
			//set the item to the path interpolator function
			items[h] = getPathInterpolator(paths[h], paths[h + 1], options);
		}
		return function (offset) {
			var d = hlen * offset;
			var flr = min(floor(d), hlen - 1);
			//if (items[flr]) 
			return renderPath(items[flr]((d - flr) / (flr + 1)), formatter);
		};
	}
	
	//format numbers to 6 decimal places
	//note: this was added by Plutonium
	function formatter(n) {return util.round(n,6);}
	
	//node: this method was modifed by Plutonium to account for closing sub paths
	function getPathInterpolator(left, right, options, z) {
		var matrix = normalizePaths(left, right, options);
		var n = matrix[0].length;
		return function (offset) {
			if (abs(offset - 0) < EPSILON) {
				return {ns:left.path};
			}
			if (abs(offset - 1) < EPSILON) {
				return {ns:right.path};
			}
			//createe a z data array
			var zData = Array(n);
			//init the array and loop
			var ns = Array(n); for (var h = 0; h < n; h++) {
				//mix the points
				ns[h] = mixPoints(matrix[0][h], matrix[1][h], offset);
				//get the z command status for the segment
				var z = left.data[h]?left.data[h].z:null||right.data[h]?right.data[h].z:null;
				//add the z command ture or false to the cooresponding z data array item
				zData[h] = z;
			}
			//return ns;
			return {ns:ns, z:zData}
		};
	}
	
	//note: a and b are segments
	function mixPoints(a, b, o) {
		var alen = a.length;
		var results = createNumberArray(alen);
		for (var i = 0; i < alen; i++) {
			results[i] = a[i] + (b[i] - a[i]) * o;
		}
		return results;
	}

	function coalesce(current, fallback) {
		return current === _ ? fallback : current;
	}

	var _120 = PI * 120 / 180;
	var PI2 = PI * 2;
	function arcToCurve(x1, y1, rx, ry, angle, large, sweep, dx, dy, f1, f2, cx, cy) {
		if (rx <= 0 || ry <= 0) {
			return [x1, y1, dx, dy, dx, dy];
		}
		var rad = PI / 180 * (+angle || 0);
		var cosrad = cos(rad);
		var sinrad = sin(rad);
		var recursive = !!f1;
		if (!recursive) {
			var x1old = x1;
			var dxold = dx;
			x1 = x1old * cosrad - y1 * -sinrad;
			y1 = x1old * -sinrad + y1 * cosrad;
			dx = dxold * cosrad - dy * -sinrad;
			dy = dxold * -sinrad + dy * cosrad;
			var x = (x1 - dx) / 2;
			var y = (y1 - dy) / 2;
			var h = x * x / (rx * rx) + y * y / (ry * ry);
			if (h > 1) {
				h = sqrt(h);
				rx = h * rx;
				ry = h * ry;
			}
			var k = (large === sweep ? -1 : 1) *
				sqrt(abs((rx * rx * ry * ry - rx * rx * y * y - ry * ry * x * x) / (rx * rx * y * y + ry * ry * x * x)));
			cx = k * rx * y / ry + (x1 + dx) / 2;
			cy = k * -ry * x / rx + (y1 + dy) / 2;
			f1 = asin((y1 - cy) / ry);
			f2 = asin((dy - cy) / ry);
			if (x1 < cx) {
				f1 = PI - f1;
			}
			if (dx < cx) {
				f2 = PI - f2;
			}
			if (f1 < 0) {
				f1 += PI2;
			}
			if (f2 < 0) {
				f2 += PI2;
			}
			if (sweep && f1 > f2) {
				f1 -= PI2;
			}
			if (!sweep && f2 > f1) {
				f2 -= PI2;
			}
		}
		var res;
		if (abs(f2 - f1) > _120) {
			var f2old = f2;
			var x2old = dx;
			var y2old = dy;
			f2 = f1 + _120 * (sweep && f2 > f1 ? 1 : -1);
			dx = cx + rx * cos(f2);
			dy = cy + ry * sin(f2);
			res = arcToCurve(dx, dy, rx, ry, angle, 0, sweep, x2old, y2old, f2, f2old, cx, cy);
		}
		else {
			res = [];
		}
		var t = 4 / 3 * tan((f2 - f1) / 4);
		res.splice(0, 0, 2 * x1 - (x1 + t * rx * sin(f1)), 2 * y1 - (y1 - t * ry * cos(f1)), dx + t * rx * sin(f2), dy - t * ry * cos(f2), dx, dy);
		if (!recursive) {
			for (var i = 0, ilen = res.length; i < ilen; i += 2) {
				var xt = res[i], yt = res[i + 1];
				res[i] = xt * cosrad - yt * sinrad;
				res[i + 1] = xt * sinrad + yt * cosrad;
			}
		}
		return res;
	}

	var argLengths = { M: 2, H: 1, V: 1, L: 2, Z: 0, C: 6, S: 4, Q: 4, T: 2, A: 7 };
	function addCurve(ctx, x1, y1, x2, y2, dx, dy) {
		var x = ctx.x;
		var y = ctx.y;
		ctx.x = coalesce(dx, x);
		ctx.y = coalesce(dy, y);
		ctx.p.push(coalesce(x1, x), (y1 = coalesce(y1, y)), (x2 = coalesce(x2, x)), (y2 = coalesce(y2, y)), ctx.x, ctx.y);
		ctx.lc = ctx.c;
	}
	function convertToAbsolute(ctx) {
		var c = ctx.c;
		var t = ctx.t;
		var x = ctx.x;
		var y = ctx.y;
		if (c === V) {
			t[0] += y;
		}
		else if (c === H) {
			t[0] += x;
		}
		else if (c === A) {
			t[5] += x;
			t[6] += y;
		}
		else {
			for (var j = 0; j < t.length; j += 2) {
				t[j] += x;
				t[j + 1] += y;
			}
		}
	}
	
	//note: this function has been modified by Plutonium to fix a bug where move commands with additional line commands included in the move command were not bieng dealt with and causing issues
	//note: support for exponential number notation was also added by Plutonium
	function parseSegments(d) {
		//split the string by command
		d=d.replace(/[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)/g,function(val){return util.round(val,6);})
		.replace(/[\^\s]*([mhvlzcsqta]|-?\d*\.?\d+)[,$\s]*/gi, ' $1')
		.replace(/([mhvlzcsqta])/gi, ' $1')
		.trim()
		.split('  ')
		//loop the split string array
		for (var i=0;i<d.length;i++) {
			//split the terms
			var terms = d[i].split(EMPTY).map(parseCommand);
			//get the commnad
			var command = terms[0];
			//if the segment command is m continue
			if (/m/i.test(command)) {
				//get the lowercase command
				var commandLC = command.toLowerCase();
				//loop extra xy pairs in the move command, these are line commands
				var count=1; for (var j=3;j<terms.length;j=j+2) {
					//create the line segment
					var lineSeg = (commandLC===command?'l':'L')+' '+terms[j]+' '+terms[j+1];
					//add the line segment
					d.splice(i+count,0,lineSeg);
					//incrament the count
					count++;
				}
				//remove the line segments from the move command
				terms = terms.slice(0,3);
			}
			//set the terms
			d[i] = terms;
		}
		return d;
	}
	
	function parseCommand(str, i) {
		return i === 0 ? str : +str;
	}
	
	function parsePoints(d) {
		//init ctx
		var ctx = {
			x: 0,
			y: 0,
			s: [],
			z:[]
		};
		//parse the segments
		var segments = parseSegments(d);
		//loop the segments
		for (var i = 0; i < segments.length; i++) {
			var terms = segments[i];
			var commandLetter = terms[0];
			var command = commandLetter.toUpperCase();
			var isRelative = command !== Z && command !== commandLetter;
			ctx.c = command;
			var maxLength = argLengths[command];
			var t2 = terms;
			var k = 1;
			do {
				ctx.t = t2.length === 1 ? t2 : t2.slice(k, k + maxLength);
				if (isRelative) {
					convertToAbsolute(ctx);
				}
				var n = ctx.t;
				var x = ctx.x;
				var y = ctx.y;
				var x1 = void 0, y1 = void 0, dx = void 0, dy = void 0, x2 = void 0, y2 = void 0;
				if (command === M) {
					ctx.s.push((ctx.p = [(ctx.x = n[0]), (ctx.y = n[1])]));
					//add an initial false item z commands (note: this is a Plutonium added feature to deal with sub paths)
					ctx.z.push(0);
				}
				else if (command === H) {
					addCurve(ctx, _, _, _, _, n[0], _);
				}
				else if (command === V) {
					addCurve(ctx, _, _, _, _, _, n[0]);
				}
				else if (command === L) {
					addCurve(ctx, _, _, _, _, n[0], n[1]);
				}
				else if (command === Z) {
					addCurve(ctx, _, _, _, _, ctx.p[0], ctx.p[1]);
					//set the z command status true (note: this is a Plutonium added feature to deal with sub paths)
					ctx.z[ctx.z.length-1]=1;
				}
				else if (command === C) {
					addCurve(ctx, n[0], n[1], n[2], n[3], n[4], n[5]);
					ctx.cx = n[2];
					ctx.cy = n[3];
				}
				else if (command === S) {
					var isInitialCurve = ctx.lc !== S && ctx.lc !== C;
					x1 = isInitialCurve ? _ : x * 2 - ctx.cx;
					y1 = isInitialCurve ? _ : y * 2 - ctx.cy;
					addCurve(ctx, x1, y1, n[0], n[1], n[2], n[3]);
					ctx.cx = n[0];
					ctx.cy = n[1];
				}
				else if (command === Q) {
					var cx1 = n[0];
					var cy1 = n[1];
					dx = n[2];
					dy = n[3];
					addCurve(ctx, x + (cx1 - x) * quadraticRatio, y + (cy1 - y) * quadraticRatio, dx + (cx1 - dx) * quadraticRatio, dy + (cy1 - dy) * quadraticRatio, dx, dy);
					ctx.cx = cx1;
					ctx.cy = cy1;
				}
				else if (command === T) {
					dx = n[0];
					dy = n[1];
					if (ctx.lc === Q || ctx.lc === T) {
						x1 = x + (x * 2 - ctx.cx - x) * quadraticRatio;
						y1 = y + (y * 2 - ctx.cy - y) * quadraticRatio;
						x2 = dx + (x * 2 - ctx.cx - dx) * quadraticRatio;
						y2 = dy + (y * 2 - ctx.cy - dy) * quadraticRatio;
					}
					else {
						x1 = x2 = x;
						y1 = y2 = y;
					}
					addCurve(ctx, x1, y1, x2, y2, dx, dy);
					ctx.cx = x2;
					ctx.cy = y2;
				}
				else if (command === A) {
					var beziers = arcToCurve(x, y, n[0], n[1], n[2], n[3], n[4], n[5], n[6]);
					for (var j = 0; j < beziers.length; j += 6) {
						addCurve(ctx, beziers[j], beziers[j + 1], beziers[j + 2], beziers[j + 3], beziers[j + 4], beziers[j + 5]);
					}
				}
				k += maxLength;
			} while (k < t2.length);
		}
		return ctx;
	}

	function perimeterPoints(pts) {
		var n = pts.length;
		var x2 = pts[n - 2];
		var y2 = pts[n - 1];
		var p = 0;
		for (var i = 0; i < n; i += 6) {
			p += util.getPointDist(pts[i], pts[i + 1], x2, y2);
			x2 = pts[i];
			y2 = pts[i + 1];
		}
		return floor(p);
	}

	//parse path data (note: this method has been modified by Plutonium to deal with sub paths)
	this.parsePath = function(d) {
		try {
			//get the parsed points data
			var data = parsePoints(d);
			//get the segements and loop
			var segments = data.s; for (var i=0;i<segments.length;i++) {
				//get the points
				var points = segments[i];
				//get points data
				var xmin = points[0];
				var ymin = points[1];
				var ymax = ymin;
				var xmax = xmin;
				for (var j = 2; j < points.length; j += 6) {
					var x = points[j + 4];
					var y = points[j + 5];
					xmin = min(xmin, x);
					xmax = max(xmax, x);
					ymin = min(ymin, y);
					ymax = max(ymax, y);
				}
				//save the segment
				segments[i] = {
					d: points,
					x: xmin,
					y: ymin,
					w: xmax - xmin,
					h: ymax - ymin,
					p: perimeterPoints(points),
					z: data.z[i]
				};
			}
			//return the path data
			return {
				path:d.trim(),
				data:segments
			};
		}
		catch(e){
			//log the error
			util.errorLog.log({code:3, error:e, msg:'cannot parse path - '+e});
		}
	}

	//interpolate two or more paths (only two are ever used by Plutonium) (note: this returns a function that accepts a single offset argument from 0 to 1 that will generate the resulting shape, e.g. var interpolation=interpolate([paths], options); var resultPath=interpolation(.5); )
	this.interpolate = function(paths, options) {
		return interpolatePath(paths, options || {});
	}
}