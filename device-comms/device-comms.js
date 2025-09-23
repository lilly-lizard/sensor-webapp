// web-serial api https://developer.chrome.com/docs/capabilities/serial
// web-bluetooth api https://developer.chrome.com/docs/capabilities/bluetooth

const counterElement = document.getElementById("counter-serial");
const logElement = document.getElementById("log-serial");

if ("serial" in navigator) {
	console.log("serial supported");
}

document.getElementById('button-serial').addEventListener('click', async () => {
	try {
		// esp32 dev board vendorid:productid = 1a86:7523 QinHeng Electronics CH340 serial converter
		await readSerial();
	} catch (error) {
		logElement.textContent = error;
		console.error(error);
	}
});

var latestBytesSerial = new ArrayBuffer(16);
var serialCount = 0;

function latestDistanceSerial() {
	// find last 4 consecutive 255s
	var serialCount = 0;
	for (var i = 15; i >= 0; i--) {
		if (latestBytesSerial[i] == 255) {
			serialCount++;
		} else {
			serialCount = 0;
		}

		if (serialCount >= 4) {
			let floatBytes = latestBytesSerial.slice(i - 4, i);

			let view = new DataView(floatBytes.buffer);
			let float = view.getFloat32(0);
			return float;
		}
	}
	return -1;
}

async function readSerial() {
	const filters = [
		{ usbVendorId: 0x1a86, usbPoductId: 0x7523 },
		{ usbVendorId: 0x2341, usbPoductId: 0x0043 }
	];
	const port = await navigator.serial.requestPort({ filters });
	await port.open({ baudRate: 9600 });
	const reader = port.readable.getReader();

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;

		const serialLen = value.length;
		if (serialLen >= 16) {
			latestBytes = value.slice(-16);
		} else {
			// shift old bytes back
			for (var i = serialLen; i < 16; i++) {
				latestBytes[i - serialLen] = latestBytes[i];
			}
			// append new bytes
			for (var i = 0; i < serialLen; i++) {
				latestBytes[16 - serialLen + i] = value[i];
			}
		}

		let distance = latestDistanceSerial();
		console.log(distance);
		if (distance != -1) {
			counterElement.textContent = distance.toFixed(1) + "mm";
		}
	}
}
document.getElementById('button-BLE').addEventListener('click', async () => {
	readBluetooth();
});

function readBluetooth() {
	navigator.bluetooth.requestDevice({
		filters: [{
			services: ["8bac7fbb-9890-4fef-8e2a-05c75fabe512"]
		}]
	})
	.then(device => {
		
	})
	.catch(error => {
		console.error(error);
	});
}
