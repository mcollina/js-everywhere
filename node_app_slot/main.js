/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */
/*global */

/*
A simple node.js application intended to blink the onboard LED on the Intel based development boards such as the Intel(R) Galileo and Edison with Arduino breakout board.

MRAA - Low Level Skeleton Library for Communication on GNU/Linux platforms
Library in C/C++ to interface with Galileo & other Intel platforms, in a structured and sane API with port nanmes/numbering that match boards & with bindings to javascript & python.

Steps for installing MRAA & UPM Library on Intel IoT Platform with IoTDevKit Linux* image
Using a ssh client: 
1. echo "src maa-upm http://iotdk.intel.com/repos/1.1/intelgalactic" > /etc/opkg/intel-iotdk.conf
2. opkg update
3. opkg upgrade

Article: https://software.intel.com/en-us/html5/articles/intel-xdk-iot-edition-nodejs-templates
*/

var mraa = require('mraa'); //require mraa
var mqtt = require('mqtt').connect('mqtt://test.mosca.io');
//var mqtt = require('mqtt').connect('mqtt://192.168.240.148');
console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the Intel XDK console

var myOnboardLed = new mraa.Gpio(13); //LED hooked up to digital pin 13 (or built in pin on Galileo Gen1 & Gen2)
myOnboardLed.dir(mraa.DIR_OUT); //set the gpio direction to output

// helper function to go from hex val to dec
function char(x) { return parseInt(x, 16); }



var TSL2561_ADDR = 0x39 // default address

// TSL2561 registers
var TSL2561_CMD           = 0x80
var TSL2561_CMD_CLEAR     = 0xC0
var	TSL2561_REG_CONTROL   = 0x00
var	TSL2561_REG_TIMING    = 0x01
var	TSL2561_REG_THRESH_L  = 0x02
var	TSL2561_REG_THRESH_H  = 0x04
var	TSL2561_REG_INTCTL    = 0x06
var	TSL2561_REG_ID        = 0x0A
var	TSL2561_REG_DATA_0_L  = 0x0C
var	TSL2561_REG_DATA_0_H  = 0x0D
var	TSL2561_REG_DATA_1_L  = 0x0E
var	TSL2561_REG_DATA_1_H  = 0x0F

console.log('creating i2c');

var i2c = new mraa.I2c(0);  
i2c.address(TSL2561_ADDR);  

console.log('i2c created');

function writeCommand(address, value) {   
  var toWrite = new Buffer([(address & 0x0F) | TSL2561_CMD]);
  i2c.write(toWrite);
  if (value) {
    value = Buffer.isBuffer(value) ? value : new Buffer([value]);
    i2c.write(value);
  }
}

function readByte(address) {
  writeCommand(address);
  var buf = i2c.read(1);
  return buf.readUInt8(0);
}

function getId() {
  return readByte(TSL2561_REG_ID);
}

function setTiminig(gain, time) {
    var timing = readByte(TSL2561_REG_TIMING)

    
    console.log('timing before', timing);
    
    // Set gain (0 or 1)
    if (gain)
      timing |= 0x10;
     else
      timing &= ~0x10;

     // Set integration time (0 to 3)
     timing &= ~0x03;
      timing |= (time & 0x03);
    
    console.log('timing after', timing);
    // Write modified timing byte back to device
    writeCommand(TSL2561_REG_TIMING, timing);
}

var integration = 14;
setTiminig(false, integration);

var luxId = getId();
console.log('id is', luxId);

writeCommand(TSL2561_REG_CONTROL, 0x03);

mqtt.publish('edison/lux/id', luxId + '');

function readDoubleReg(lowReg, highReg) {
  var low = readByte(lowReg);
  var high = readByte(highReg);
  return high << 8 | low;
}

function readLux(gain, ms) {
  var d0 = readDoubleReg(TSL2561_REG_DATA_0_L, TSL2561_REG_DATA_0_H);
  var d1 = readDoubleReg(TSL2561_REG_DATA_1_L, TSL2561_REG_DATA_1_H);

  // We will need the ratio for subsequent calculations
  var ratio = d1 / d0;
  
  // Normalize for integration time
  d0 *= (402.0/integration);
  d1 *= (402.0/integration);

  // Normalize for gain
  if (!gain) {
    d0 *= 16;
    d1 *= 16;
  }

  // Determine lux per datasheet equations:
	
  if (ratio < 0.5) {
    return 0.0304 * d0 - 0.062 * d0 * Math.pow(ratio,1.4);
  }

  if (ratio < 0.61) {
    return lux = 0.0224 * d0 - 0.031 * d1;
  }

  if (ratio < 0.80) {
    return 0.0128 * d0 - 0.0153 * d1;
  }

  if (ratio < 1.30) {
	 return 0.00146 * d0 - 0.00112 * d1;
  }
    
  return 0;
}

setInterval(function() {
    mqtt.publish('edison/lux/0', readLux(false, integration) + '');
}, 1000);


//i2c.writeReg(char('0xf4'), char('0x2e'));

//var data = i2c.read();  
//console.log( ">> I2C value: " + data);  

mqtt.on('connect', function() {
    console.log('connected to mqtt'); 
    mqtt.subscribe('edison/led');
});

mqtt.on('message', function(topic, payload) {
    
    payload = payload.toString();
    if (payload === 'on') {
        myOnboardLed.write(1);
    } else {
        myOnboardLed.write(0);
    }
});

