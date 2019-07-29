# Plutonium [react-state-animator]
### Ultra lightweight React / JavaScript Animation Library
Full featured animation library built specifically for React and vanilla JavaScript. Tween any React component state properties or DOM styles and attributes. An advanced normalizing SVG morphing plugin for paths is included!

Gain precision control over your animations with custom event listeners and an advanced API that includes pausing, seeking, repeating, direction change, delays, duration, fill modes, and much more.

Animations work in all modern browsers including Edge, plus many older browsers.


### Script Size
File | Uncompressed | Compressed
:--- | :---: | :---:
plutonium | 14K | 5K
morph plugin | 6K | 3K
**total** | **20K** | **8K**


### Links

* [Animator Home](https://plutonium.dev/wp/?page_id=285)
   * [Documentation](https://plutonium.dev/wp/?page_id=548)
   * [API](https://plutonium.dev/wp/?page_id=554)


### Bookmarks
* [Installation](#Installation)
* [Usage](#Usage)
   * [Module](#Module)
   * [Local Script Tags](#Local-Script-Tags)
   * [CDN Script Tags](#CDN-Script-Tags)
* [Instantiation](#Instantiation)
* [Adding React State Properties](#Adding-React-State-Properties)
* [Animating React State Properties](#Animating-React-State-Properties)
* [Animating DOM Elements](#Animating-DOM-Elements)
* [API Control](#API-Control)
* [License](#License)


### <a id="Installation"></a>Installation
```
> npm install react-state-animator
```

**[:arrow_up_small:](#bookmarks)**	

### <a id="Usage" style="color:yellow;"></a>Usage

* <a id="Module"></a>**Module**
   
   In ES6 the code example below imports the core animator library plus the SVG morph plugin.
   ```javascript
   import Animator, {morph} from 'react-state-animator';
   ```
   Or when using CommonJS...
   ```javascript
   const Animator = require('react-state-animator').animator;
   const morph = require('react-state-animator').morph;
   ```
   
* <a id="Local-Script-Tags"></a>**Local Script Tags**
   
   Add the core animator library and optional plugin scripts directly to a web page. 
   ```javascript
   &lt;script src="lib/min/animator.js"&gt;&lt;/script&gt;
   &lt;script src="lib/min/morph.js"&gt;&lt;/script&gt;
   ```

* <a id="CDN-Script-Tags"></a>**CDN Script Tags**
   
   Add the core animator library and optional plugin scripts directly to a web page. 
   ```javascript
   &lt;script src="https://cdn.jsdelivr.net/npm/react-state-animator@1/lib/min/animator.min.js"&gt;&lt;/script&gt;
   &lt;script src="https://cdn.jsdelivr.net/npm/react-state-animator@1/lib/min/morph.min.js"&gt;&lt;/script&gt;
   ```

**[:arrow_up_small:](#bookmarks)**	
   
### <a id="Instantiation"></a>Instantiation
Instantiate a new animator object with the desired plugins. Each animator instance can have any number of animations added to it, and can be controlled as a group (play, pause, etc...).
```javascript
//example 1: module (reference names can be customized using import 'as')
var myAnimator = new Animator({
    morph:morph
});

//example 2: script tags ('PU_Animator' is a global window property and plugin names are predefined)
var myAnimator = new PU_Animator({
    morph:true
});
```

**[:arrow_up_small:](#bookmarks)**	

### <a id="Adding-React-State-Properties"></a>Adding React State Properties
Animation keys can be added to the state properties of any React component.  The easiest way to do this is in the constructor of the component as shown below.
```
constructor (props) {
    super(props);
    this.state = {
        //a custom rotate animatmion property
        myAnimation:{
            rotate:{val:0, keys:{
                from: 0,
                to: 360
            }},
        }
    }
}
```
Optionally specify key positions as follows.
```
rotate:{val:0, keys:{
    "pos_0": 0,
    "pos_50": 180
    "pos_100": 360
}},
```

To apply the animated rotate state property shown above, reference it in your components JSX as you would any other custom state property.
```
render() {
    return &lt;div
        style={{
            position:'fixed',
            top:'25%',
            left:'25%',
            width:'50%'
            height:'50%'
            backgroundColor:'red',
            //reference the 'val' property, this is what will get tweened by the animator
            transform:'rotate('+this.state.myAnimation.rotate.val+')',
        }}
    &gt;;
}
```

**[:arrow_up_small:](#bookmarks)**	

### <a id="Animating-React-State-Properties"></a>Animating React State Properties
In your react component constructor add a new animation to the animator object you created earlier.

The add method takes 4 arguments (objects, duration, id, props). Set the 'id' to match the custom id used to define the animation keys in the state and set 'objects' to this react component.

```
var myAnimation = myAnimator.add(this, 2, 'myAnimation', {
    timing:'ease',
    delay:0,
    direction:'alternate',
    iterationCount:'infinite',
    fillMode:'both',
    playState:'running'
});
```
Test in the browser, if everything was setup correctly you will see a red DIV rotating back and forth.
The animation properties and functionality such as timing, delay, etc..., mimic standard CSS animation properties.

**[:arrow_up_small:](#bookmarks)**	

### <a id="Animating-DOM-Elements"></a>Animating DOM Elements
Animating DOM elements is similar to animating React components with one difference. Instead of specifying a state property id for the third argument we supply an object of values to animate.
```
//example 1: Animate an element ('myElm') over a 2 second duration to the specified value.
var myAnimation = myAnimator.add(myElm, 2, {transform:'rotate(360deg)'});

//example 2: Animate from the specified style value to the current style value by reversing the direction.
var myAnimation = myAnimator.add(myElm, 2, {transform:'rotate(360deg)'}, {
    direction:'reverse'
});

//example 3: Animate using the provided keys.
var myAnimation = myAnimator.add(myElm, 2, {
    transform:{
        keys:{
            from:'rotate(0deg)',
            to:'rotate(360deg)'
        }
    }
});

//example 4: Add optional properties as needed.
var myAnimation = myAnimator.add(myElm, 2, {transform:'rotate(360deg)'}, {
    timing:'ease',
    delay:0,
    direction:'alternate',
    iterationCount:'infinite',
    fillMode:'both',
    playState:'running'
});
```
When animating using a single value instead of keys a matching initial attribute or inline style value should be applied to your DOM element. If the corresponding initial value is not found the animator will create an initial value of 0 to tween to or from.

**[:arrow_up_small:](#bookmarks)**	

### <a id="API-Control"></a>API Control
Below are a few quick examples of how to control your animations.
```javascript
//example 1: Pause the animation.
myAnimation.pause();

//example 2: Optionally use 'setProps' to change any of the animation properties.
myAnimation.setProps({
    playState:'paused'
});

//example 3: Set the direction with setProps.
myAnimation.setProps({
    direction:'reverse'
});

//example 4: Change the direction with the changeDirection method.
myAnimation.changeDirection();
```

### <a id="License"></a>License

Released under the [MIT license](LICENSE.md)

Author: Jesse Dalessio

**[:arrow_up_small:](#bookmarks)**	