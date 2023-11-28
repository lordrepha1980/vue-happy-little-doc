"use strict";
const Generator = require("yeoman-generator");
const Chalk = require("chalk");
const Main = require("./main");
const FilesActions = require("./fileActions");
const DefaultTemplate = require("./defaultTemplate");
const Fs = require("fs");
const Path = require("path");
module.exports = class extends Generator {
	async asyncTask() {

	}

	async prompting() {
		const dirname = this.destinationPath(`./`)

		if (this.args.length !== 1)
			throw new Error(
			"Please set argument build (yo vue-happy-little-doc build)"
		);
		
		let configFile = null
		if ( Fs.existsSync(Path.join(dirname, 'hld-config.json')) )
			configFile = JSON.parse(Fs.readFileSync(Path.join(dirname, 'hld-config.json')).toString())

		await Main.writeTitle()
		const files = FilesActions.readProject({ dirname, configFile });
		const content = FilesActions.readFiles({ files, dirname });
		DefaultTemplate.create({ content, configFile })
		console.log(Chalk.green('Happy Little Docs generated'))
		// let prompts = [
		// 	{
		// 		type: "input",
		// 		name: "projectFolder",
		// 		message: `Is this your vue project folder?`,
		// 		default: '.'
		// 	}
		// ];

		// return this.prompt(prompts).then(props => {
		// 	// To access props later use this.props.someAnswer;
		// 	this.props = props;
		// 	const files = FilesActions.readProject({ path: this.props.projectFolder, dirname });
		// 	const content = FilesActions.readFiles({ files, dirname });
		// 	DefaultTemplate.create({ content })
		// 	console.log(props)
		// });
	}
}