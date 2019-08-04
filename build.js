const fs = require('fs');
const {minify} = require('uglify-es');
const pkg = require('./package');
const date = new Date();

const banner = `/*
 * Plutonium React-State-Animator v${pkg.version}
 * (c) ${date.getFullYear()} Jesse Dalessio - https://plutonium.dev
 * Released under the MIT license
*/`;

//src file data
const fData = [
	{
		src:"src/animator.js",
		name:"animator"
	},
	{
		src:"src/morph.js",
		name:"morph"
	}
]

//get the code and write the files
_get_all_code((code)=>{
	fs.writeFile('lib/animator.esm.js', `${banner}\n${code.esm}`, 'utf8', err => {
		if (err) return console.error(err);
		else {
			fs.writeFile('lib/animator.js', `${banner}\n${code.com}`, 'utf8', err => {
				if (err) return console.error(err);
				else {
					console.info('build success!');
				}
			});
		}
	});
});

//recusively combine the code files
function _get_all_code(callback) {
	let index = 0;
	let code = {com:'',esm:''};
	let keys = Object.keys(fData);
	_recurse();
		
	function _recurse() {
		var fItem = fData[keys[index]];
		fs.readFile(fItem.src, 'utf8', (err, content) => {
			if (err) {return console.error(err);}
			else {
				//build / concatenate the commonJS and esm content
				content = content.replace(/[\n]+$|[\r\n]+$/,"");
				if (index>0) content = `\n\n`+content;
				code.com += content.replace(/export default/, `exports.${fItem.name} =`);
				code.esm += index>0?content.replace(/export default/, `export var ${fItem.name} =`):content;
				//write the individual minified file to the ./lib/min folder
				content = content.replace(/export default/,index>0?"PU_Animator.prototype."+fItem.name+" =":"PU_Animator =");
				let minResult = minify(content);
				if (minResult.error) return console.error(minResult.error);
				fs.writeFile('lib/min/'+fItem.name+'.js', `${banner}\n${minResult.code}`, 'utf8', err => {
					if (err) return console.error(err);
				});
				//recurse or execute the callback
				index++; if (index<keys.length) _recurse();
				else callback(code);
			}
		});
	}
};



















