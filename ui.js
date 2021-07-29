'use strict';
const child = require('child_process');
const { cpuUsage } = require('process');
let diskspace = require('diskspace');
const fs = require('fs');
let os = require('os-utils');
let _os = require('os');
const React = require('react');
const { render, useFocus, Text, Box } = require('ink');
const Divider = require('ink-divider');
const Gradient = require('ink-gradient')
const BigText = require('ink-big-text');
// const Ascii = require('ink-ascii')
const Spinner = require('ink-spinner')
const cliSpinners = require('cli-spinners');

const App = () => {
	const [cpuInfo, setCpuInfo] = React.useState('');
	const [diskInfo, setDiskInfo] = React.useState({});
	const [diskArr, setDiskArr] = React.useState([]);
	const [memInfo, setMemInfo] = React.useState('');
	const [font, setFont] = React.useState('');


	const [fonts, setFonts] = React.useState([
		'block',
		'slick',
		'tiny',
		'grid',
		'pallet',
		'shade',
		'simple',
		'simpleBlock',
		'3d',
		'simple3d',
		'chrome',
		'huge',
	])

	React.useEffect(() => {
		setInterval(() => {
			checkSys();
			checkFreeMem();

		}, 500)
	}, [])


	let cacheArr = [];
	let currentPath = __dirname + '/cache.json';

	const readCacheConfig = () => {
		try {
			let parsed = JSON.parse(fs.readFileSync(currentPath));
			let { cache } = parsed;
			cacheArr = cache;
			return cacheArr
		} catch (error) {
			return cacheArr;
		}
	};

	const checkCPUFree = async () => {
		getCPUUsage(i => {
			let formatted = Math.floor(i * 100)
			// return 'CPU Free: ' + `${formatted} %`;
			setCpuInfo('CPU Free: ' + `${formatted} %`);

		}, true)
	};

	const checkFreeMem = async () => {
		let formatted = Math.floor(os.freememPercentage() * 100)
		setMemInfo('Mem Free: ' + `${formatted} %`);
	};

	const checkSys = async (flag) => {
		readCacheConfig();
		let res = await checkCPUFree()
		if (!res) {
			checkFreeMem()
			getAllDriveSpaces();
		}
	};

	function getAllDriveSpaces() {
		child.exec('wmic logicaldisk get name', (error, stdout) => {

			if (cacheArr.length == 0) {
				let captureDrives = stdout.split('\r\r\n').filter(value => /[A-Za-z]:/.test(value)).map(value => value.trim())
				fs.writeFile(currentPath, JSON.stringify({ cache: captureDrives }), function (err) {
					if (err) {
						return console.log(err);
					}
				});
				captureDrives.forEach(path => getFreeSpace(path))
			} else {
				cacheArr.forEach(path => getFreeSpace(path))
			}
		})
	};

	function getFreeSpace(path) {
		diskspace.check(path, function (err, result) {
			let percent = Math.floor(result.used / result.total * 100)
			let totalByteReducer = Math.floor(result.total / 1000000000)
			let tbr = totalByteReducer.toString()
			if (tbr[0] == 1 && tbr[1] == 0 && tbr.toString().length === 4) {
				totalByteReducer = tbr[0] + 'TB'
			} else if (tbr[0] == 2 && tbr[1] == 5) {
				totalByteReducer = '256' + 'GB'
			}
			else {
				totalByteReducer = tbr + 'GB'
			}
			if (percent) {
				if (!diskInfo[path]) {
					diskInfo[path] = `\\ ` + totalByteReducer + ' ' + `${percent} %`
					diskArr.push(path)
				}
				// console.log(diskInfo)
				// setDiskInfo(path + `\\ ` + totalByteReducer + ' ' + `${percent} %`);
			}
		});
	};
	function getCPUInfo(callback) {
		let cpus = _os.cpus();
		let user = 0;
		let nice = 0;
		let sys = 0;
		let idle = 0;
		let irq = 0;
		let total = 0;
		for (let cpu in cpus) {
			user += cpus[cpu].times.user;
			nice += cpus[cpu].times.nice;
			sys += cpus[cpu].times.sys;
			irq += cpus[cpu].times.irq;
			idle += cpus[cpu].times.idle;
		}
		total = user + nice + sys + idle + irq;
		return {
			'idle': idle,
			'total': total
		};
	}
	function getCPUUsage(callback, free) {
		let stats1 = getCPUInfo();
		let startIdle = stats1.idle;
		let startTotal = stats1.total;

		setTimeout(function () {
			let stats2 = getCPUInfo();
			let endIdle = stats2.idle;
			let endTotal = stats2.total;

			let idle = endIdle - startIdle;
			let total = endTotal - startTotal;
			let perc = idle / total;

			if (free === true)
				callback(perc);
			else
				callback((1 - perc));
		}, 100);
	}
	function driveDisplayMap() {
		return diskArr.map((i, idx) => {
			return (
				<Box key={idx}>
					<Text color="green">{i + diskInfo[i]}</Text>
				</Box>
			)
		})
	}


	return (
		<>
			<Box justifyContent='center' flexDirection='column' borderColor='blueBright' borderStyle='round'>
				{/* <Text color="green">
					<Spinner type="dots" />
					{' Loading'}
				</Text> */}
				<Box justifyContent='center' alignItems='center' flexDirection='column' borderColor='blueBright' borderStyle='round' >
					{/* <Ascii  /> */}
					<Gradient name="mind">
						<BigText font={fonts[2]} lineHeight={1} text="Rsrc" />
					</Gradient>

					{/* <Divider title={'Resource Monitor 1.0'} dividerColor='blue' /> */}
				</Box>

				<Box justifyContent='center'>


					<Box flexDirection='column' alignItems='center' paddingRight='1vw'>
						<Box >
							<Text color="green">{cpuInfo}</Text>
						</Box>
						<Box>
							<Text color="green">{memInfo}</Text>
						</Box>
					</Box>

					<Box flexDirection='column' alignItems='center' paddingLeft='1vw'>
						{driveDisplayMap()}
					</Box>

				</Box>
			</Box>
		</>
	)
};

module.exports = App;
