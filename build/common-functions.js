// This file does not depend on any other files
// All inputs are provided as input to the functions
const globalTCpropFile = __dirname + '/../../common/global-tibco-cloud.properties';

// Display opening
displayOpeningMessage = function() {
	//var pjson = require('./package.json');
	//console.log(process.env.npm_package_version);
		const version = require('../package.json').version;
		console.log('\x1b[35m%s\x1b[0m', '# |-------------------------------------------|');
		console.log('\x1b[35m%s\x1b[0m', '# |  *** T I B C O    C L O U D   C L I ***   |');
		console.log('\x1b[35m%s\x1b[0m', '# |            V' + version + '                         |');
		console.log('\x1b[35m%s\x1b[0m', '# |-------------------------------------------|');
		console.log('\x1b[35m%s\x1b[0m', '# |For more info see: https://cloud.tibco.com');
}

// function to view the global connection configuration, and display's none if not set
displayGlobalConnectionConfig = function(){
	// console.log('Global Connection Config: ');
	var re = false;
	log(INFO,'Global Tibco Cloud Propfile: ' + globalTCpropFile);
		//Global Prop file is __dirname (build folder in the global prop)
	    // This folder ../../../ --> is the main node modules folder
		//         is: /Users/hpeters@tibco.com/.npm-global/lib
		//             /Users/hpeters@tibco.com/.npm-global/lib/node_modules/@tibco-tcstk/cloud-cli/build
		// Global: 	/node_modules/@tibco-tcstk/global/
		// ../../global/global-tibco-cloud.properties

	// Check if global connection file exists
		if (doesFileExist(globalTCpropFile)) {
			re = true;
			//file exists
			const PropertiesReader = require('properties-reader');
			const propsG = PropertiesReader(globalTCpropFile).path();
			var passType = "STORED IN PLAIN TEXT !";
			if(propsG.CloudLogin.pass === ""){
				passType = "NOT STORED";
			}
			if(propsG.CloudLogin.pass.charAt(0) == '#'){
				passType = "OBFUSCATED";
			}
			log(INFO,'Global Connection Configuration:');
			var globalConfig = {
				"CLOUD HOST": propsG.cloudHost,
				"EMAIL": propsG.CloudLogin.email,
				"CLIENT ID": propsG.CloudLogin.clientID,
				"PASSWORD TYPE": passType
			};

			console.table(globalConfig);
		} else {
			log(INFO,'No Global Configuration Set...');
		}

	// Returns true if the global file exists and false if it does not exists.
	return re;
}

// function to set the global connection configuration
updateGlobalConnectionConfig = async function(){
	console.log('Update Connection Config: ');
	// update the config.
	// Check if the global propfile exists, if not create one
	if (!doesFileExist(globalTCpropFile)) {
		// Create Global config from template
		copyFile(__dirname + '/../template/global-tibco-cloud.properties', globalTCpropFile);
	}
	// Get Cloud Environment
	await updateRegion(globalTCpropFile);
	// Get the login details
	await updateCloudLogin(globalTCpropFile);

}

// Function to get an indexed object wiht a String
indexObj = function (obj,is, value) {
	if (typeof is == 'string')
		return indexObj(obj,is.split('.'), value);
	else if (is.length==1 && value!==undefined)
		return obj[is[0]] = value;
	else if (is.length==0)
		return obj;
	else
		return indexObj(obj[is[0]],is.slice(1), value);
}

const PropertiesReader = require('properties-reader');
let globalProperties;
let propFileNameGl;
let propertiesGl;
let propsGl;
let globalMultipleFileName;
// Function to get a property
getProp = function(propName){
	log(DEBUG, 'Getting Property: ' + propName);
	if(propsGl == null) {
		propertiesGl = PropertiesReader(propFileNameGl);
		propsGl = propertiesGl.path();
	}
	let re;
	if(propsGl != null){
		re = indexObj(propsGl, propName);
		log(DEBUG, 'Returning Property: ' , re);
		if(re == 'USE-GLOBAL'){
			if (doesFileExist(globalTCpropFile)) {
				if (globalProperties == null){
					globalProperties = PropertiesReader(globalTCpropFile).path();
				}
				re =  indexObj(globalProperties, propName);
				log(DEBUG, 'Got Property From Global: ' , re);
			} else {
				log(DEBUG,'No Global Configuration Set...');
				return false;
			}
		}
	} else {
		log(ERROR, 'Property file not set yet...')
	}
	return re;
}

setPropFileName = function(propFileName){
	propFileNameGl = propFileName;
	log(DEBUG, 'Usring Property File: ' + propFileNameGl);
}
getPropFileName = function () {
	return propFileNameGl;
}
setMultipleFileName = function(mFileName){
	globalMultipleFileName = mFileName;
	log(DEBUG, 'Usring Multiple File: ' + globalMultipleFileName);
}
getMultipleFileName = function () {
	return globalMultipleFileName;
}

trim = function (value){
	return value.replace(/^\s*/, "").replace(/\s*$/, "");
}


// Function to copy a file
copyFile = function (fromFile, toFile) {
	log(INFO, 'Copying File from: ' + fromFile + ' to: ' + toFile);
	const fs = require('file-system');
	fs.copyFileSync(fromFile, toFile);
}

let inquirerF = require('inquirer');
// function to ask a question
askQuestion = async function (question, type = 'input') {
	var re = 'result';
	// console.log('Type: ' , type);
	await inquirerF.prompt([{
		type: type,
		name: 'result',
		message: question,
		filter: function (val) {
			return val;
		}
	}]).then((answers) => {
		logO(DEBUG, answers);
		re = answers.result;
	});
	return re;
}

// function to ask a question
askMultipleChoiceQuestion = async function (question, options) {
	let re = 'result';
	await inquirerF.prompt([{
		type: 'list',
		name: 'result',
		message: question,
		choices: options,
		filter: function (val) {
			return val;
		}
	}]).then((answers) => {
		logO(DEBUG, answers);
		re = answers.result;
		//return answers.result;
	});
	//let name = require.resolve('inquirer');
	//delete require.cache[name];
	//console.log(re);
	return re;
}

var gOptions = [];
// Ask a question to a user, and allow the user to search through a possilbe set of options
askMultipleChoiceQuestionSearch = async function (question, options) {
	gOptions = options;
	var re = 'result';
	inquirerF.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
	await inquirerF.prompt([{
		type: 'autocomplete',
		name: 'command',
		suggestOnly: false,
		message: question,
		source: searchAnswerF,
		pageSize: 4/*,
            validate: function (val) {
                return val ? true : 'Type something!';
            }*/
	}]).then((answers) => {
		// console.log('answers: ' , answers);
		logO(DEBUG, answers);
		re = answers.command;
	});
	return re;
}

const _F = require('lodash');
const fuzzyF = require('fuzzy');

//User interaction
searchAnswerF = function (answers, input) {
	input = input || '';
	return new Promise(function (resolve) {
		setTimeout(function () {
			var fuzzyResult = fuzzyF.filter(input, gOptions);
			resolve(
				fuzzyResult.map(function (el) {
					return el.original;
				})
			);
		}, _F.random(30, 60));
	});
}

// Update the cloud login properties
updateCloudLogin = async function(propFile){
	// Client ID
	log('INFO', 'Get yout client ID from https://cloud.tibco.com/ --> Settings --> Advanced Settings --> Display Client ID (See Tutorial)');
	// TODO: did not get question for  client ID... ???
	console.log('CLIENT ID');
	var cid = await askQuestion('What is your Client ID ?');
	addOrUpdateProperty(propFile, 'CloudLogin.clientID', cid);
	// Username & Password (obfuscate)
	var email = await askQuestion('What is your User Name (Email) ?');
	addOrUpdateProperty(propFile, 'CloudLogin.email', email);
	log('INFO', 'Your password will be obfuscated, but is not unbreakable (press enter to skip and enter manually later)');
	var pass = await askQuestion('What is your Password ?', 'password');
	if(pass != '') {
		addOrUpdateProperty(propFile, 'CloudLogin.pass', obfuscatePW(pass));
	}
}

// Obfuscate a password
obfuscatePW = function (toObfuscate){
	// TODO: use stronger obfuscation
	return '#' + Buffer.from(toObfuscate).toString('base64');
}


// function to update the tenant
updateRegion = async function (propFile) {
	var re = await askMultipleChoiceQuestionSearch('Which Region would you like to use ? ', ['US - Oregon', 'EU - Ireland', 'AU - Sydney']);
	switch (re) {
		case 'US - Oregon':
			addOrUpdateProperty(propFile, 'cloudHost', 'liveapps.cloud.tibco.com');
			addOrUpdateProperty(propFile, 'Cloud_URL', 'https://liveapps.cloud.tibco.com/');
			break;
		case 'EU - Ireland':
			addOrUpdateProperty(propFile, 'cloudHost', 'eu.liveapps.cloud.tibco.com');
			addOrUpdateProperty(propFile, 'Cloud_URL', 'https://eu.liveapps.cloud.tibco.com/');
			break;
		case 'AU - Sydney':
			addOrUpdateProperty(propFile, 'cloudHost', 'au.liveapps.cloud.tibco.com');
			addOrUpdateProperty(propFile, 'Cloud_URL', 'https://au.liveapps.cloud.tibco.com/');
			break;
	}
}

updateTCLI = function(){
	log(INFO, 'Updating Cloud CLI) Current Version: ' + require('../package.json').version);
	run('npm -g install @tibco-tcstk/cloud-cli');
	log(INFO, 'New Cloud CLI Version: ');
	run('tcli -v')
}

updateTCLIwrapper = function() {
	return new Promise(async function (resolve, reject) {
		updateTCLI();
		resolve();
	});
}

// Function to add or update property to a file
addOrUpdateProperty = function (location, property, value) {
	log(INFO, 'Updating: ' + property + ' to: ' + value + ' (in:' + location + ')');
	// Check if file exists
	const fs = require('fs');
	try {
		if (fs.existsSync(location)) {
			//file exists
			log(DEBUG, 'Property file found: ' + location);
			// Check if file contains property
			var data = fs.readFileSync(location, 'utf8');
			var reg = new RegExp(property + '\\s*=\\s*(.*)');
			if (data.search(reg) > -1) {
				// We found the property
				log(DEBUG, 'Property found: ' + property + ' We are updating it to: ' + value);
				var regRes = new RegExp(property + '\\s*=\\s*(.*)');
				var result = data.replace(regRes, property + '=' + value);
				fs.writeFileSync(location, result, 'utf8');
			} else {
				// append prop to the end.
				log(DEBUG, 'Property NOT found: ' + property + ' We are adding it and set it to: ' + value);
				var result = data + '\n' + property + '=' + value;
				fs.writeFileSync(location, result, 'utf8');
			}

		} else {
			log(ERROR, 'Property File does not exist: ' + location);
		}
	} catch (err) {
		console.error(err)
	}
}





// Get the global configuration
// TODO: Get rid of this function
getGlobalConfig = function(){
	// const globalTCpropFile = __dirname + '/../../common/global-tibco-cloud.properties';
	if (doesFileExist(globalTCpropFile)) {
		const PropertiesReader = require('properties-reader');
		return propsG = PropertiesReader(globalTCpropFile).path();
	} else {
		log(INFO,'No Global Configuration Set...');
		return false;
	}
}

// Run an OS Command
const execSync = require('child_process').execSync;
run = function (command) {
	return new Promise(function (resolve, reject) {
		log(DEBUG, 'Executing Command: ' + command);
		try {
			execSync(
				command,
				{stdio: 'inherit'}
			);
		} catch (err) {
			reject(err);
		}
		resolve();
	}).catch(
		(reason => {
			logO(ERROR, reason);
			process.exit(1);
		})
	);
}

// Delete a folder
const del = require('del');
deleteFolder = function (folder) {
	log(INFO, 'Deleting Folder: ' + folder);
	return del([
		folder
	]);
}

const fs = require('file-system');
// Create a directory if it does not exists
mkdirIfNotExist = function (dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
}

// Check if a file exists
doesFileExist = function(checkFile){
	const fsCom = require('fs');
	log(DEBUG, "Checking if file exists: " + checkFile);
	try {
		if (fsCom.existsSync(checkFile)) {
			return true;
		}else{
			return false;
		}
	} catch(err) {
		console.error(err);
	}
}

// function to deternmine enabled tasks for workspace
determineEnabledTasks = function(cliTaskConfig){
	var cTsks = cliTaskConfig.cliTasks;
	var re = [];
	for(cliTask in cTsks){
	    console.log(cliTask + ' (' + cTsks[cliTask].description + ')');
		var allowed = false;
		if(cTsks[cliTask].availableOnOs != null){
			for(allowedOS of cTsks[cliTask].availableOnOs){
				console.log('OS:' + allowedOS);
				if(allowedOS == process.platform || allowedOS == 'all'){
					allowed = true;
				}
			}
		}
	    if(cTsks[cliTask].enabled && allowed) {
	        re.push(cliTask + ' (' + cTsks[cliTask].description + ')');
	    }
	}
	return re;
}

isPortAvailable = async function(port){
	log(DEBUG, 'Checking Port Availability: ' + port);
	const tcpPortUsed = require('tcp-port-used');
	const pUsed = await tcpPortUsed.check(port, '127.0.0.1');
	return !pUsed;
}


//Common log function
global.INFO = 'INFO';
global.DEBUG = 'DEBUG';
global.ERROR = 'ERROR';
//const useDebug = (propsF.Use_Debug == 'true');
let useDebug = false;

setLogDebug = function(debug){
	// console.log('Setting debug to: ' + debug)
	useDebug = (debug == 'true');
}

log = function (level, ...message) {
	// console.log('LOG: ' ,useDebug , level, message);
	if (!(level == DEBUG && !useDebug)) {
		var timeStamp = new Date();
		//console.log('(' + timeStamp + ')[' + level + ']  ' + message);

		if(level == global.ERROR){
			console.log('\x1b[31m%s\x1b[0m', 'TIBCO CLOUD CLI] (' + level + ') ' ,'\x1b[31m' , ...message);
		} else {
			console.log('\x1b[35m%s\x1b[0m', 'TIBCO CLOUD CLI] (' + level + ') ' , ...message);
		}
	}
}
logO = function (level, message) {
	if (!(level == DEBUG && !useDebug)) {
		console.log(message);
	}
}

//Function to log on one line...
logLine = function (message) {
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	process.stdout.write(message);
}


