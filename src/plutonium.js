//Plutonium - Animation Library for React or Plain JavaScript
export default function(plugins) {
	
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













