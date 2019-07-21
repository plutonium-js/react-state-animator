# Plutonium-JS
### Ultra lightweight React / JavaScript Animation Library
Plutonium is a lightweight full featured animation library built specifically for React and vanilla JavaScript. Tween any React state properties or DOM styles and attributes. An advanced normalizing SVG morphing plugin for paths is included!

Gain precision control over your animations with custom event listeneers and an advanced API that includes pausing, seeking, repeating, direction change, delays, duration, fill modes, and much more.

Animations work in all modern browsers including Edge, plus many older browsers.


### Script Size
File | Uncompressed | Compressed
:--- | :---: | :---:
plutonium | 14K | 5K
morph plugin | 6K | 3K
**total** | **20K** | **8K**


### Bookmarks
* [Installation](#Installation)
* [Usage](#Usage)
   * [Module](#Module)
   * [Script Tags](#Script-Tags)
* [Instantiation](#Instantiation)
* [Adding React State Properties](#Adding-React-State-Properties)
* [Animating React State Properties](#Animating-React-State-Properties)
* [Animating DOM Elements](#Animating-DOM-Elements)
* [Morphing SVG Paths](#Morphing-SVG-Paths)
* [API Control](#API-Control)
* [API Reference](#API-Reference)
   * [to()](#to-from)
   * [from()](#to-from)
   * [keys()](#keys)
   * [add()](#add)
   * [remove()](#remove)
   * [play()](#play-pause)
   * [pause()](#play-pause)
   * [stop()](#play-pause)
   * [reset()](#play-pause)
   * [changeDirection()](#play-pause)
   * [seek()](#seek)
   * [setProps()](#setProps)
   * [animation properties](#animation-properties)
   * [addListener()](#addListener)
   * [removeListener()](#removeListener)
   * [event properties](#event-properties)
   * [frame properties](#frame-properties)
* [License](#License)


### <a id="Installation">Installation</a>
```
> npm install plutonium-js
```

**[:arrow_up_small:](#bookmarks)**	

### <a id="Usage" style="color:yellow;"></a>Usage

* <a id="Module"></a>**Module**
   
   In ES6 the code example below imports the core Plutonium animation module plus the SVG morph plugin.
   ```javascript
   import Plutonium, {morph} from 'plutonium-js';
   ```
   Or when using CommonJS...
   ```javascript
   const Plutonium = require('plutonium-js').plutonium;
   const morph = require('plutonium-js').morph;
   ```
   
* <a id="Script-Tags"></a>**Script Tags**
   
   Add the core Plutonium library and optional plugin scripts directly to a web page. 
   ```javascript
   <script src="lib/min/plutonium.js"></script>
   <script src="lib/min/morph.js"></script>
   ```

**[:arrow_up_small:](#bookmarks)**	
   
### <a id="Instantiation"></a>Instantiation
Instantiate a new Plutonium object with the desired plugins. Each plutonium instance can have any number of animations added to it, and can be controlled as a group (play, pause, etc...).
```javascript
//example 1: module (reference names can be customized using import 'as')
var myPlutonium = new Plutonium({
     morph:morph
});

//example 2: script tags ('Plutonium' is a global window property and plugin names are predefined)
var myPlutonium = new Plutonium({
    morph:true
});
```

**[:arrow_up_small:](#bookmarks)**	

### <a id="Adding-React-State-Properties"></a>Adding React State Properties
Animation keys can be added to the state properties of any React component.  The easiest way to do this is in the constructor of the component as shown below.
```javascript
constructor (props) {
    super(props);
    this.state = {
        //a custom rotate animatmion property
        myAnim:{
            rotate:{val:0, keys:{
                from: 0,
                to: 360
            }},
        }
    }
}
```
Optionally specify key positions as follows.
```javascript
rotate:{val:0, keys:{
    "pos_0": 0,
    "pos_50": 180
    "pos_100": 360
}},
```
To apply the animated rotate state property shown above, reference it in your components JSX as you would any other custom state property.
```javascript
render() {
    return <div
        style={{
            position:'fixed',
            top:'25%',
            left:'25%',
            width:'50%'
            height:'50%'
            backgroundColor:'red',
            //reference the 'val' property, this is what will get tweened by Plutonium
            transform:'rotate('+this.state.myAnim.rotate.val+')',
        }}
    />;
}
```

**[:arrow_up_small:](#bookmarks)**	

### <a id="Animating-React-State-Properties"></a>Animating React State Properties
In your react component constructor add a new animation to the Plutonium object you created earlier. Set the 'id' to match the custom id used to define the animation keys in the state and set 'objects' to this component.
```javascript
var myAnim = myPlutonium.add({
    id:'myAnim',
    objects:this,
    props:{
        timing:'ease',
        delay:0,
        duration:'2s',
        direction:'alternate',
        iterationCount:'infinite',
        fillMode:'both',
        playState:'running'
    }
});
```
Test in the browser, if everything was setup correctly you will see a red DIV rotating back and forth.
The animation properties and functionality such as timing, delay, etc..., mimic standard CSS animation properties.

**[:arrow_up_small:](#bookmarks)**	

### <a id="Animating-DOM-Elements"></a>Animating DOM Elements
Animating DOM elements is simple and syntactically similar to GreenSock and other popular animation libraries.
```javascript
//example 1: Animate an element ('myElm') over a 2 second duration to the specified value.
var myAnim = myPlutonium.to(myElm, 2, {transform:'rotate(360deg)'});

//example 2: Animate from the specified style value to the current style value.
var myAnim = myPlutonium.from(myElm, 2, {transform:'rotate(360deg)'});

//example 3: Animate using the provided keys.
var myAnim = myPlutonium.from(myElm, 2, {
    transform:{
        keys:{
            from:'rotate(0deg)',
            to:'rotate(360deg)'
        }
    }
});

//example 4: Add optional properties as needed.
var myAnim = myPlutonium.from(myElm, 2, {transform:'rotate(360deg)'}, {
    timing:'ease',
    delay:0,
    duration:'2s',
    direction:'alternate',
    iterationCount:'infinite',
    fillMode:'both',
    playState:'running'
});
```
When animating using to() or from() an initial attribute or inline style value should be applied to the element. If the corresponding initial value is not found Plutonium will create an initial value of 0 to tween to or from.

**[:arrow_up_small:](#bookmarks)**	

### <a id="Morphing-SVG-Paths"></a>Morphing SVG Paths
Morphing an SVG path is similar to animating any other style or attribute with Plutonium. The only difference is we need to tell Plutonium that the value is a path. To do this we can add the tween property.
```javascript
//example 1: React state animation property (golfer figure to downhill ski figure)
myAnim:{
    d:{
        val:"",
        keys:{
            from:"m 34.701006,7.7277673 -3.361882,4.8980597 c -0.62568,0.965354 -0.351693,2.248342 0.608188,2.877587 0.953777,0.635386 2.229653,0.37775 2.855333,-0.587602 l 1.966962,-2.830167 29.388681,19.50202 -24.07723,4.358747 c -1.70459,0.287766 -2.93927,2.001909 -2.557756,3.680918 l 5.53216,19.990458 -17.239914,25.943967 c -1.013291,1.744243 -0.399102,3.980982 1.352796,4.981632 1.77021,1.012937 4.012148,0.396009 5.031545,-1.349006 0,0 17.674552,-26.732235 17.740171,-26.90029 0,0 0.91174,3.710982 0.91174,3.728634 l -2.652059,20.056082 c -0.334202,1.996701 1.013283,3.860701 3.016213,4.196809 2.00293,0.336113 3.904358,-1.001313 4.238564,-2.985738 l 2.74228,-20.629519 c 0.08317,-0.527955 -0.02368,-1.684154 -0.143489,-2.193689 L 54.008662,40.311235 69.733773,37.46343 c 1.681695,-0.299276 2.819958,-1.929891 2.52161,-3.626555 v -8.41e-4 C 72.022662,32.51692 70.950004,31.767901 70.884382,31.719557 Z m 6.324826,14.0221377 c -3.409941,0 -6.163676,2.73959 -6.163676,6.109128 0,3.381046 2.753735,6.1152 6.163676,6.1152 3.391633,0 6.146016,-2.733389 6.146016,-6.1152 -6.03e-4,-3.369538 -2.754383,-6.109128 -6.146016,-6.109128 z",
            to:"m 47.157377,12.751174 c -2.073091,0.0059 -4.107874,1.367992 -5.35678,3.893923 -1.100184,2.20503 -1.404388,4.996876 -0.861071,7.257871 l 3.4066,15.146543 -10.284524,4.453244 c -1.289345,0.699565 -2.283467,2.342668 -2.453768,4.353417 -0.266945,2.948568 1.35347,4.896941 3.530859,5.246324 0.497352,0.08155 0.828469,-0.11272 1.289287,-0.268623 L 50.469486,46.52484 c 1.026526,-0.506086 2.158989,-1.892306 2.265059,-3.104354 0.07837,-0.874655 0.285292,-1.617449 0.152115,-2.142723 l -2.136157,-10.368744 8.443309,6.814177 1.021654,9.937842 c 0.08721,1.73652 0.667773,2.985223 1.65305,3.722363 l 11.035266,8.744961 c 1.210966,0.89944 2.734921,0.29354 3.39786,-1.361431 0.667654,-1.642976 0.216354,-3.728871 -0.994615,-4.628313 L 66.582699,47.232393 65.574429,29.525014 C 65.422394,27.40793 64.57562,25.509092 63.336953,24.334622 L 50.7688,14.246541 c -1.109983,-1.01427 -2.367569,-1.498927 -3.611423,-1.495367 z m 24.590388,13.575181 c -2.684169,0 -4.87094,2.948382 -4.87094,6.595715 5.59e-4,3.653729 2.187359,6.620797 4.87094,6.620797 2.697723,0 4.875041,-2.967068 4.875041,-6.620797 0,-3.647333 -2.177318,-6.595715 -4.875041,-6.595715 z M 19.06262,43.950461 18.054349,46.280294 69.346978,87.167609 h -0.0022 c 2.352406,1.892424 5.386598,0.855388 6.790263,-2.342624 l -1.70796,-1.386258 c -0.833241,1.911611 -2.661198,2.516755 -4.056023,1.386258 z"
        },
        tween:{
            isPath:true
        }
    }
}

//example 2: Animate the SVG DOM path element with keys (golfer figure to downhill ski figure)
myPlutonium.keys(document.querySelector('#myPathElm'), 2, {
    d:{
        keys:{
            from:'m 34.701006,7.7277673 -3.361882,4.8980597 c -0.62568,0.965354 -0.351693,2.248342 0.608188,2.877587 0.953777,0.635386 2.229653,0.37775 2.855333,-0.587602 l 1.966962,-2.830167 29.388681,19.50202 -24.07723,4.358747 c -1.70459,0.287766 -2.93927,2.001909 -2.557756,3.680918 l 5.53216,19.990458 -17.239914,25.943967 c -1.013291,1.744243 -0.399102,3.980982 1.352796,4.981632 1.77021,1.012937 4.012148,0.396009 5.031545,-1.349006 0,0 17.674552,-26.732235 17.740171,-26.90029 0,0 0.91174,3.710982 0.91174,3.728634 l -2.652059,20.056082 c -0.334202,1.996701 1.013283,3.860701 3.016213,4.196809 2.00293,0.336113 3.904358,-1.001313 4.238564,-2.985738 l 2.74228,-20.629519 c 0.08317,-0.527955 -0.02368,-1.684154 -0.143489,-2.193689 L 54.008662,40.311235 69.733773,37.46343 c 1.681695,-0.299276 2.819958,-1.929891 2.52161,-3.626555 v -8.41e-4 C 72.022662,32.51692 70.950004,31.767901 70.884382,31.719557 Z m 6.324826,14.0221377 c -3.409941,0 -6.163676,2.73959 -6.163676,6.109128 0,3.381046 2.753735,6.1152 6.163676,6.1152 3.391633,0 6.146016,-2.733389 6.146016,-6.1152 -6.03e-4,-3.369538 -2.754383,-6.109128 -6.146016,-6.109128 z',
            to:'m 47.157377,12.751174 c -2.073091,0.0059 -4.107874,1.367992 -5.35678,3.893923 -1.100184,2.20503 -1.404388,4.996876 -0.861071,7.257871 l 3.4066,15.146543 -10.284524,4.453244 c -1.289345,0.699565 -2.283467,2.342668 -2.453768,4.353417 -0.266945,2.948568 1.35347,4.896941 3.530859,5.246324 0.497352,0.08155 0.828469,-0.11272 1.289287,-0.268623 L 50.469486,46.52484 c 1.026526,-0.506086 2.158989,-1.892306 2.265059,-3.104354 0.07837,-0.874655 0.285292,-1.617449 0.152115,-2.142723 l -2.136157,-10.368744 8.443309,6.814177 1.021654,9.937842 c 0.08721,1.73652 0.667773,2.985223 1.65305,3.722363 l 11.035266,8.744961 c 1.210966,0.89944 2.734921,0.29354 3.39786,-1.361431 0.667654,-1.642976 0.216354,-3.728871 -0.994615,-4.628313 L 66.582699,47.232393 65.574429,29.525014 C 65.422394,27.40793 64.57562,25.509092 63.336953,24.334622 L 50.7688,14.246541 c -1.109983,-1.01427 -2.367569,-1.498927 -3.611423,-1.495367 z m 24.590388,13.575181 c -2.684169,0 -4.87094,2.948382 -4.87094,6.595715 5.59e-4,3.653729 2.187359,6.620797 4.87094,6.620797 2.697723,0 4.875041,-2.967068 4.875041,-6.620797 0,-3.647333 -2.177318,-6.595715 -4.875041,-6.595715 z M 19.06262,43.950461 18.054349,46.280294 69.346978,87.167609 h -0.0022 c 2.352406,1.892424 5.386598,0.855388 6.790263,-2.342624 l -1.70796,-1.386258 c -0.833241,1.911611 -2.661198,2.516755 -4.056023,1.386258 z',
        },
        tween:{
            applyAs:'attribute',
            isPath:true
        }
    }
},{
    direction:'normal',
    iterationCount:1,
    fillMode:'both'
});
```
When applying paths to DOM elements we need to also tell Plutonium to apply the value as an attribute in the tween data (see example 2 above).  This isn't necessary when animating a React component because the state property value is added directly to the JSX as an attribute.

**[:arrow_up_small:](#bookmarks)**	

### <a id="API-Control"></a>API Control
Below are a few quick examples of how to control your animations, see the ['API Reference'](#API-Reference) section below for more details.
```javascript
//example 1: Pause the animation.
myAnim.pause();

//example 2: Optionally use 'setProps' to change any of the animation properties.
myAnim.setProps({
    playState:'paused'
});

//example 3: Set the direction with setProps.
myAnim.setProps({
    direction:'reverse'
});

//example 4: Change the direction with the changeDirection method.
myAnim.changeDirection();
```

**[:arrow_up_small:](#bookmarks)**	

### <a id="API-Reference"></a>API Reference
* **<a id="to-from"></a>to(), from():** Animate DOM element styles to or from the provided values.
   ```javascript
   //example 1
   var myAnim = myPlutonium.to(myElm, 2, {transform:'rotate(360deg)'});

   //example 2
   var myAnim = myPlutonium.from([myElm1,myElm2], 2, {backgroundColor:'rgba(0,255,0,1)'});

   //example 3
   var myAnim = myPlutonium.to(myElm, 2, {
       transform:'scaleX(1)scaleY(1)rotate(360deg)',
       opacity:'1'
   });

   //example 4
   var myAnim = myPlutonium.to(myElm, 2, {
       transform:'scaleX(1)scaleY(1)rotate(360deg)',
       opacity:'1'
   },{
       timing:'ease',
       delay:0,
       duration:'2s',
       direction:'alternate',
       iterationCount:'infinite',
       fillMode:'both',
       playState:'running'
   });
   ```

**[:arrow_up_small:](#bookmarks)**	

* **<a id="keys"></a>keys():** Animate DOM element styles using the provided keys.
   ```javascript
   //example 1
   var myAnim = myPlutonium.keys(myElm, 2, {
       transform:{
           keys:{
               from:'rotate(0deg)',
               to:'rotate(360deg)'
           }
       }
   });

   //example 2
   var myAnim = myPlutonium.keys(myElm, 2, {
       transform:{
           keys:{
               "pos_0":'rotate(0deg)',
               "pos_50":'rotate(180deg)',
               "pos_100":'rotate(360deg)'
           }
       }
   });
   ```

**[:arrow_up_small:](#bookmarks)**	

* **<a id="add"></a>add():** Add an animation. This is typically only used with React.
   ```javascript
   //example 1 - React component: Animation keys are defined in the state property of the component.
   var myAnim = myPlutonium.add({
       id:'myAnim',
       objects:myReactComponent,
       props:{
           timing:'ease',
           delay:0,
           duration:'2s',
           direction:'alternate',
           iterationCount:'infinite',
           fillMode:'both',
           playState:'running'
       }
   });

   //example 2 - DOM elements: Animation keys are set using the 'vals' property.
   var myAnim = myPlutonium.add({
       id:'myAnim',
       objects:[myElm1, myElm2],
       props:{
           timing:'ease',
           delay:0,
           duration:'2s',
           direction:'alternate',
           iterationCount:'infinite',
           fillMode:'both',
           playState:'running'
       },
       vals:{
            transform:{
               keys:{
                   from:'rotate(0deg)',
                   to:'rotate(360deg)'
               }
           }
       }
   });
   ```

**[:arrow_up_small:](#bookmarks)**

* **<a id="remove"></a>remove():** Remove an animation by id.
   ```javascript
   myPlutonium.remove(myAnim.id);
   ```

**[:arrow_up_small:](#bookmarks)**

* **<a id="play-pause"></a>play(), pause(), stop(), reset(), changeDirection():** Control all added animations or an individual animation.
   ```javascript
   //example 1
   myPlutonium.play();

   //example 2
   myPlutonium.pause();

   //example 3
   myPlutonium.stop();

   //example 4
   myPlutonium.reset();

   //example 5
   myPlutonium.changeDirection();
   ```

**[:arrow_up_small:](#bookmarks)**	   

* **<a id="seek"></a>seek():** Seek a position for all animations or an individual animation. Provide a position in the range of 0% to 100%.
   ```javascript
   myPlutonium.seek(50);
   ```

**[:arrow_up_small:](#bookmarks)**
   
* **<a id="setProps"></a>setProps():** Set properties on all added animations or an individual animation. Setting options and functionality mimic CSS animation properties.
   ```javascript
   myPlutonium.setProps({
       timing:'ease-out',
       delay:0,
       duration:'2s',
       direction:'normal',
       iterationCount:'infinite',
       fillMode:'both',
       playState:'running'
   });
   ```
**[:arrow_up_small:](#bookmarks)**
   
* **<a id="animation-properties"></a>animation properties:** The following are valid animation properties and values.
   
   * **duration:** [use a number for milliseconds, or a string with units. for example '1s' or '1000ms']
   * **timing:** ['linear', 'ease', 'quadratic', 'cubic', 'quartic', 'quintic', 'sinusoidal', 'exponential', 'circular', 'elastic', 'back', 'bounce' *(optionally specify timing direction by appending '-in', '-out', or '-inout' to the name)*]
   * **delay:** [use a number for milliseconds, or a string with units. for example '1s' or '1000ms']
   * **iterations:** [a positive whole number or 'infinite']
   * **direction:** ['normal', 'reverse', 'alternate']
   * **fillMode:** ['none', 'forwards', 'backwards', 'both']
   * **playState:** ['running', 'paused', 'stopped', 'reset']
 
**[:arrow_up_small:](#bookmarks)**  

* **<a id="addListener"></a>addListener():** Listen for animation instance events.
   
   * **'frameChange':** triggered when a frame is rendered
   * **'end':** triggered when the animation ends
   * **'iterate':** triggered when the animation iterates / loops
   * **'play':** triggered when the animation plays
   * **'pause':** triggered when the animation is paused
   * **'stop':** triggered when the animation is stopped
   * **'reset':** triggered when the animation is reset
   ```javascript
   //example 1: listen for 'frameChange' event and show frame data in the console
   myAnim.addListener("frameChange", evt => {
       console.log(JSON.stringify(evt.frame.data));
   });
   
   //example 2: listen for 'iterate' (loop) event and show the iteration count in the console
   myAnim.addListener("iterate", evt => {
       console.log(evt.frame.data.iterationCount);
   });
   
   //example 3: listen for 'end' (loop) event and show a message in the console
   myAnim.addListener("end", evt => {
       console.log('the animation ended');
   });
   ```
 
**[:arrow_up_small:](#bookmarks)**
 
* **<a id="removeListener"></a>removeListener():** Remove an event listener from an animation instance.
   ```javascript
   myAnim.removeListener("frameChange");
   ```

**[:arrow_up_small:](#bookmarks)**

* **<a id="event-properties"></a>event properties:** The following are event properties passed to the listener function.
   
   * **type:** the event type name, for example 'frameChange', 'end', etc...
   * **target:** the object that fired the event, for example an animation instance
   * **frame:** if applicable the event will include a frame object with additional animation properties

**[:arrow_up_small:](#bookmarks)**
   
* **<a id="frame-properties"></a>frame properties:** The following are frame properties which are added to the event object for most animation events.
   
   * animation: the animation instance that the frame belongs to
   * data: additional data about the frame
      * **pos:** the position of the frame between 0% and 100%
      * **time:** the frame time between 0 and the animation duration
      * **stamp:** the animation frame time stamp (this can be used to synchronize other animations)
      * **duration:** the animation duration
      * **iterationCount:** the iteration count
      * **status:**
         * **isFirst:** true if this is the first frame  
         * **isLast:** true if this is the last frame
         * **iteration:** a count that is present if this is the first frame of a new iteration

**[:arrow_up_small:](#bookmarks)**		 

		 
### <a id="License"></a>License

Released under the [MIT license](LICENSE.md)

Author: Jesse Dalessio

**[:arrow_up_small:](#bookmarks)**	
