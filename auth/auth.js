// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

	'facebookAuth' : {
		'clientID'          : '174520085947452', // your App ID
		'clientSecret'      : '715edbe0ef90ec306f7d401870eda0ea', // your App Secret
		'callbackURL'       : 'http://bluemantis.ddns.net:1337/auth/facebook/callback'
	},

	'twitterAuth' : {
		'consumerKey'       : 'Gs6IvlzFvPtjttGRVuKyPyK4x',
		'consumerSecret'    : 'shwzgR0X6ZZvs8sF4l4XNj7Y2tHaF9MkbzlmpqafQe0veqCJ5H',
		'callbackURL'       : 'http://bluemantis.ddns.net:1337/auth/twitter/callback'
	},

	'googleAuth' : {
		'clientID'          : '592282716416-h6ddhevn3cm83gi8r0nlljago938ubjf.apps.googleusercontent.com',
		'clientSecret'      : 'XWcRGIRwHkq5xcH-mEV58KSx',
		'callbackURL'       : 'http://bluemantis.ddns.net:1337/auth/google/callback'
	},

	'deviantArt' : {
		'clientID'          : '3879',
		'clientSecret'      : 'f3e9709cc4e56bb510641d94c3edd18e',
		'callbackURL'       : 'http://bluemantis.ddns.net:1337/auth/deviantart/callback'
	}

};
