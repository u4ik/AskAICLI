#!/usr/bin/env node
import CFonts from 'cfonts';
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pkg from 'kleur';
import prompts from 'prompts';
import { Configuration, OpenAIApi } from "openai";
const cRequire = createRequire(import.meta.url); // construct the require method
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const { green, red, blue } = pkg
const { version } = cRequire('./package.json') // use the require method
console.clear();
const commandPrompts = {
	mainMenu: [{
		type: 'select',
		name: 'MenuSelection',
		message: 'Choose an option',
		choices: [
			{ title: '🗨️ Start', description: '', value: 'Start' },
			{ title: 'ℹ️ About', description: '', value: 'About' },
			{ title: '🛠️ Setup', description: 'Initial Setup Required', value: 'Setup' },
			{ title: '❌ Delete Config File', description: 'Delete the config file', value: 'DelConfig' },
		].filter(i => {
			if (!fs.existsSync(`${__dirname}` + "/config.json" || !JSON.parse(fs.readFileSync(`${__dirname}` + '/config.json')).cache[0])) {
				return i.value == 'Setup' || i.value == 'About'
			}
			else if (!fs.existsSync(`${__dirname}` + "/config.json")) {
				return i.value !== 'DelConfig'

			} else {
				return i.value !== 'Setup'
			}
		}),
		initial: 0,
	}],
	addKey: [{
		type: 'text',
		name: 'AddKey',
		message: 'Enter your secret key here',
	}],
	confirmDelete: [{
		type: 'toggle',
		name: 'ConfirmDelete',
		message: '',
		initial: true,
		active: 'Yes',
		inactive: 'No',
		onRender(kleur) {
			this.msg = kleur.red('Are you sure you want to delete?');
		}
	}],
	sendPrompt: [{
		type: 'text',
		name: 'SendPrompt',
		message: '',
	}],
}
const menuSelectionActions = async () => {
	let menuSelectionRes = await (prompts(commandPrompts.mainMenu, { onCancel }))
	const { MenuSelection } = menuSelectionRes;
	if (MenuSelection === 'About') {
		console.log(red(`
			AskAI ${version} \n`) + '\n' +

			'* Utilizes the OpenAI chat API\n'
		)

		main();
	}
	return MenuSelection
}

const displayTitle = () => {
	CFonts.say('AskAI', {
		font: 'simple',              // define the font face
		align: 'center',              // define text alignment
		colors: ['red'],         // define all colors
		background: 'transparent',  // define the background color, you can also use `backgroundColor` here as key
		letterSpacing: 1,           // define letter spacing
		lineHeight: 1,              // define the line height
		space: true,                // define if the output text should have empty lines on top and on the bottom
		maxLength: '0',             // define how many character can be on one line
		gradient: ['#8b0000', 'blue', '#841922'],            // define your two gradient colors
		independentGradient: false, // define if you want to recalculate the gradient for each new line
		transitionGradient: true,  // define if this is a transition between colors directly
		env: 'node'                 // define the environment CFonts is being executed in
	}
	);
}

displayTitle();
const main = async () => {
	try {
		const menuChoice = await menuSelectionActions()
		if (menuChoice === 'Start') {
			const configuration = new Configuration({ apiKey: JSON.parse(fs.readFileSync(`${__dirname}` + '/config.json')).cache[0] });
			const openai = new OpenAIApi(configuration);
			console.log("Type in a prompt to begin");
			while (true) {
				try {
					let menuSelectionRes = await (prompts(commandPrompts.sendPrompt, { onCancel }))
					console.log(blue('Loading...'));
					const { SendPrompt } = menuSelectionRes;
					const response = await openai.createCompletion({
						model: "text-davinci-003",
						prompt: SendPrompt,
						temperature: 0,
						top_p: 1,
						frequency_penalty: 0,
						presence_penalty: 0,
						max_tokens: 1024
					})
					console.clear();
					displayTitle();
					console.log(green(SendPrompt));
					console.log(response.data.choices[0].text + '\n')
				} catch (err) {
					console.log(red(err))
					// continue;
					onCancel();
				}
			}
		}

		if (menuChoice === 'Setup') {
			console.log('\nNavigate to https://openai.com/api/ and signup/login');
			console.log('\nOnce you have signed in create a key here https://beta.openai.com/account/api-keys')
			console.log(green('\nThis key will be saved locally on your computer within the config file(config.json) in the root directory of this app\n'))

			let menuSelectionRes = await (prompts(commandPrompts.addKey, { onCancel }))
			const { AddKey } = menuSelectionRes;

			fs.writeFileSync(`${__dirname}/config.json`, JSON.stringify({ cache: [AddKey] }));
		}
		if (menuChoice === 'DelConfig') {
			let menuSelectionRes = await (prompts(commandPrompts.confirmDelete, { onCancel }))
			let { ConfirmDelete } = menuSelectionRes;
			if (ConfirmDelete) {
				fs.unlink(`${__dirname}/config.json`, (err) => {
					if (err) {
						console.log(err);
					} else {
						console.log(red('\nConfig file removed\n'))
					}
				})
			} else {
				console.clear();
				displayTitle();
				main();
			}
		}
	} catch (err) {
		console.log({ err });
	};
};

const onCancel = () => {
	console.clear();
	console.log(red('Exiting...'))
	process.exit();
}

main();