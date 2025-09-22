// webserial api https://developer.chrome.com/docs/capabilities/serial

let count = 0;
const counterElement = document.getElementById("counter");
const logElement = document.getElementById("log");
const asciiDecoder = new TextDecoder("ascii");

if ("serial" in navigator) {
	console.log("serial supported");
}

document.getElementById('serial-button').addEventListener('click', async () => {
	try {
		// esp32 dev board vendorid:productid = 1a86:7523 QinHeng Electronics CH340 serial converter
		await readSerial();
	} catch (error) {
		logElement.textContent = error;
	}
});

var lastDistance = 0.0;
var latestBytes = new ArrayBuffer(16);

function latestDistance() {
	// find last 4 consecutive 255s
	var count = 0;
	for (var i = 15; i >= 0; i--) {
		if (latestBytes[i] == 255) {
			count++;
		} else {
			count = 0;
		}

		if (count >= 4) {
			let floatBytes = latestBytes.slice(i - 4, i);

			// swapsies

			let view = new DataView(floatBytes.buffer);
			let float = view.getFloat32(0);
			return float;
		}
	}
	return 0;
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

		let distance = latestDistance();
		console.log(distance);
		counterElement.textContent = distance.toFixed(1) + "mm";
	}
}
