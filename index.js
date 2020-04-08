require("babel-register")({
	"presets": [
		["env"],
		"react",
		"stage-2",
	],
	'plugins': [
		[
			'babel-plugin-transform-require-ignore',
			{
				extensions: ['.less']
			}
		]
	]
});
require("./src/server");
