//
// SimcirJS - basicset
//
// Copyright (c) 2014 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

// includes following device types:
//  DC
//  LED
//  PushOff
//  PushOn
//  Toggle
//  BUF
//  NOT
//  AND
//  NAND
//  OR
//  NOR
//  EOR
//  ENOR
//  OSC
//  7seg
//  16seg
//  4bit7seg
//  RotaryEncoder
//  BusIn
//  BusOut

!function($s) {

  'use strict';

  var $ = $s.$;

  // unit size
  var unit = $s.unit;

  // red/black
  var defaultLEDColor = '#ff0000';
  var defaultLEDBgColor = '#000000';

  var multiplyColor = function() {
    var HEX = '0123456789abcdef';
    var toIColor = function(sColor) {
      if (!sColor) {
        return 0;
      }
      sColor = sColor.toLowerCase();
      if (sColor.match(/^#[0-9a-f]{3}$/i) ) {
        var iColor = 0;
        for (var i = 0; i < 6; i += 1) {
          iColor = (iColor << 4) | HEX.indexOf(sColor.charAt( (i >> 1) + 1) );
        }
        return iColor;
      } else if (sColor.match(/^#[0-9a-f]{6}$/i) ) {
        var iColor = 0;
        for (var i = 0; i < 6; i += 1) {
          iColor = (iColor << 4) | HEX.indexOf(sColor.charAt(i + 1) );
        }
        return iColor;
      }
      return 0;
    };
    var toSColor = function(iColor) {
      var sColor = '#';
      for (var i = 0; i < 6; i += 1) {
        sColor += HEX.charAt( (iColor >>> (5 - i) * 4) & 0x0f);
      }
      return sColor;
    };
    var toRGB = function(iColor) {
      return {
        r: (iColor >>> 16) & 0xff,
        g: (iColor >>> 8) & 0xff,
        b: iColor & 0xff};
    };
    var multiplyColor = function(iColor1, iColor2, ratio) {
      var c1 = toRGB(iColor1);
      var c2 = toRGB(iColor2);
      var mc = function(v1, v2, ratio) {
        return ~~Math.max(0, Math.min( (v1 - v2) * ratio + v2, 255) );
      };
      return (mc(c1.r, c2.r, ratio) << 16) |
        (mc(c1.g, c2.g, ratio) << 8) | mc(c1.b, c2.b, ratio);
    };
    return function(color1, color2, ratio) {
      return toSColor(multiplyColor(
          toIColor(color1), toIColor(color2), ratio) );
    };
  }();

  // symbol draw functions
  var drawBUF = function(g, x, y, width, height) {
    g.moveTo(x, y);
    g.lineTo(x + width, y + height / 2);
    g.lineTo(x, y + height);
    g.lineTo(x, y);
    g.closePath(true);
  };
  var drawAND = function(g, x, y, width, height) {
    g.moveTo(x, y);
    g.curveTo(x + width, y, x + width, y + height / 2);
    g.curveTo(x + width, y + height, x, y + height);
    g.lineTo(x, y);
    g.closePath(true);
  };
  var drawOR = function(g, x, y, width, height) {
    var depth = width * 0.2;
    g.moveTo(x, y);
    g.curveTo(x + width - depth, y, x + width, y + height / 2);
    g.curveTo(x + width - depth, y + height, x, y + height);
    g.curveTo(x + depth, y + height, x + depth, y + height / 2);
    g.curveTo(x + depth, y, x, y);
    g.closePath(true);
  };
  var drawEOR = function(g, x, y, width, height) {
    drawOR(g, x + 3, y, width - 3, height);
    var depth = (width - 3) * 0.2;
    g.moveTo(x, y + height);
    g.curveTo(x + depth, y + height, x + depth, y + height / 2);
    g.curveTo(x + depth, y, x, y);
    g.closePath();
  };
  var drawNOT = function(g, x, y, width, height) {
    drawBUF(g, x - 1, y, width - 2, height);
    g.drawCircle(x + width - 1, y + height / 2, 2);
  };
  var drawNAND = function(g, x, y, width, height) {
    drawAND(g, x - 1, y, width - 2, height);
    g.drawCircle(x + width - 1, y + height / 2, 2);
  };
  var drawNOR = function(g, x, y, width, height) {
    drawOR(g, x - 1, y, width - 2, height);
    g.drawCircle(x + width - 1, y + height / 2, 2);
  };
  var drawENOR = function(g, x, y, width, height) {
    drawEOR(g, x - 1, y, width - 2, height);
    g.drawCircle(x + width - 1, y + height / 2, 2);
  };
  // logical functions
  var AND = function(a, b) { return a & b; };
  var OR = function(a, b) { return a | b; };
  var EOR = function(a, b) { return a ^ b; };
  var BUF = function(a) { return (a == 1)? 1 : 0; };
  var NOT = function(a) { return (a == 1)? 0 : 1; };

  var onValue = 1;
  var offValue = null;
  var isHot = function(v) { return v != null; };
  var intValue = function(v) { return isHot(v)? 1 : 0; };

  var createSwitchFactory = function(type) {
    return function(device) {
      var in1 = device.addInput();
      var out1 = device.addOutput();
      var on = (type == 'PushOff');

      if (type == 'Toggle' && device.deviceDef.state) {
        on = device.deviceDef.state.on;
      }
      device.getState = function() {
        return type == 'Toggle'? { on : on } : null;
      };

      device.$ui.on('inputValueChange', function() {
        if (on) {
          out1.setValue(in1.getValue() );
        }
      });
      var updateOutput = function() {
        out1.setValue(on? in1.getValue() : null);
      };
      updateOutput();

      var super_createUI = device.createUI;
      device.createUI = function() {
        super_createUI();
        var size = device.getSize();
        var $button = $s.createSVGElement('rect').
          attr({x: size.width / 4, y: size.height / 4,
            width: size.width / 2, height: size.height / 2,
            rx: 2, ry: 2});
        $button.addClass('simcir-basicset-switch-button');
        if (type == 'Toggle' && on) {
          $button.addClass('simcir-basicset-switch-button-pressed');
        }
        device.$ui.append($button);
        var button_mouseDownHandler = function(event) {
          event.preventDefault();
          event.stopPropagation();
          if (type == 'PushOn') {
            on = true;
            $button.addClass('simcir-basicset-switch-button-pressed');
          } else if (type == 'PushOff') {
            on = false;
            $button.addClass('simcir-basicset-switch-button-pressed');
          } else if (type == 'Toggle') {
            on = !on;
            $button.addClass('simcir-basicset-switch-button-pressed');
          }
          updateOutput();
          $(document).on('mouseup', button_mouseUpHandler);
          $(document).on('touchend', button_mouseUpHandler);
        };
        var button_mouseUpHandler = function(event) {
          if (type == 'PushOn') {
            on = false;
            $button.removeClass('simcir-basicset-switch-button-pressed');
          } else if (type == 'PushOff') {
            on = true;
            $button.removeClass('simcir-basicset-switch-button-pressed');
          } else if (type == 'Toggle') {
            // keep state
            if (!on) {
              $button.removeClass('simcir-basicset-switch-button-pressed');
            }
          }
          updateOutput();
          $(document).off('mouseup', button_mouseUpHandler);
          $(document).off('touchend', button_mouseUpHandler);
        };
        device.$ui.on('deviceAdd', function() {
          $s.enableEvents($button, true);
          $button.on('mousedown', button_mouseDownHandler);
          $button.on('touchstart', button_mouseDownHandler);
        });
        device.$ui.on('deviceRemove', function() {
          $s.enableEvents($button, false);
          $button.off('mousedown', button_mouseDownHandler);
          $button.off('touchstart', button_mouseDownHandler);
        });
        device.$ui.addClass('simcir-basicset-switch');
      };
    };
  };

  var createLogicGateFactory = function(op, out, draw) {
    return function(device) {
      var numInputs = (op == null)? 1 :
        Math.max(2, device.deviceDef.numInputs || 2);
      device.halfPitch = numInputs > 2;
      for (var i = 0; i < numInputs; i += 1) {
        device.addInput();
      }
      device.addOutput();
      var inputs = device.getInputs();
      var outputs = device.getOutputs();
      device.$ui.on('inputValueChange', function() {
        var b = intValue(inputs[0].getValue() );
        if (op != null) {
          for (var i = 1; i < inputs.length; i += 1) {
            b = op(b, intValue(inputs[i].getValue() ) );
          }
        }
        b = out(b);
        outputs[0].setValue( (b == 1)? 1 : null);
      });
      var super_createUI = device.createUI;
      device.createUI = function() {
        super_createUI();
        var size = device.getSize();
        var g = $s.graphics(device.$ui);
        g.attr['class'] = 'simcir-basicset-symbol';
        draw(g, 
          (size.width - unit) / 2,
          (size.height - unit) / 2,
          unit, unit);
        if (op != null) {
          device.doc = {
            params: [
              {name: 'numInputs', type: 'number',
                defaultValue: 2,
                description: 'number of inputs.'}
            ],
            code: '{"type":"' + device.deviceDef.type + '","numInputs":2}'
          };
        }
      };
    };
  };

  /*
  var segBase = function() {
    return {
      width: 0,
      height: 0,
      allSegments: '',
      drawSegment: function(g, segment, color) {},
      drawPoint: function(g, color) {}
    };
  };
  */
  
  var _7Seg = function() {
    var _SEGMENT_DATA = {
      a: [575, 138, 494, 211, 249, 211, 194, 137, 213, 120, 559, 120],
      b: [595, 160, 544, 452, 493, 500, 459, 456, 500, 220, 582, 146],
      c: [525, 560, 476, 842, 465, 852, 401, 792, 441, 562, 491, 516],
      d: [457, 860, 421, 892, 94, 892, 69, 864, 144, 801, 394, 801],
      e: [181, 560, 141, 789, 61, 856, 48, 841, 96, 566, 148, 516],
      f: [241, 218, 200, 453, 150, 500, 115, 454, 166, 162, 185, 145],
      g: [485, 507, 433, 555, 190, 555, 156, 509, 204, 464, 451, 464]
    };
    return {
      width: 636,
      height: 1000,
      allSegments: 'abcdefg',
      drawSegment: function(g, segment, color) {
        if (!color) {
          return;
        }
        var data = _SEGMENT_DATA[segment];
        var numPoints = data.length / 2;
        g.attr['fill'] = color;
        for (var i = 0; i < numPoints; i += 1) {
          var x = data[i * 2];
          var y = data[i * 2 + 1];
          if (i == 0) {
            g.moveTo(x, y);
          } else {
            g.lineTo(x, y);
          }
        }
        g.closePath(true);
      },
      drawPoint: function(g, color) {
        if (!color) {
          return;
        }
        g.attr['fill'] = color;
        g.drawCircle(542, 840, 46);
      }
    };
  }();

  var _16Seg = function() {
    var _SEGMENT_DATA = {
      a: [255, 184, 356, 184, 407, 142, 373, 102, 187, 102],
      b: [418, 144, 451, 184, 552, 184, 651, 102, 468, 102],
      c: [557, 190, 507, 455, 540, 495, 590, 454, 656, 108],
      d: [487, 550, 438, 816, 506, 898, 573, 547, 539, 507],
      e: [281, 863, 315, 903, 500, 903, 432, 821, 331, 821],
      f: [35, 903, 220, 903, 270, 861, 236, 821, 135, 821],
      g: [97, 548, 30, 897, 129, 815, 180, 547, 147, 507],
      h: [114, 455, 148, 495, 198, 454, 248, 189, 181, 107],
      i: [233, 315, 280, 452, 341, 493, 326, 331, 255, 200],
      j: [361, 190, 334, 331, 349, 485, 422, 312, 445, 189, 412, 149],
      k: [430, 316, 354, 492, 432, 452, 522, 334, 547, 200],
      l: [354, 502, 408, 542, 484, 542, 534, 500, 501, 460, 434, 460],
      m: [361, 674, 432, 805, 454, 691, 405, 550, 351, 509],
      n: [265, 693, 242, 816, 276, 856, 326, 815, 353, 676, 343, 518],
      o: [255, 546, 165, 671, 139, 805, 258, 689, 338, 510],
      p: [153, 502, 187, 542, 254, 542, 338, 500, 278, 460, 203, 460]
    };
    return {
      width: 690,
      height: 1000,
      allSegments: 'abcdefghijklmnop',
      drawSegment: function(g, segment, color) {
        if (!color) {
          return;
        }
        var data = _SEGMENT_DATA[segment];
        var numPoints = data.length / 2;
        g.attr['fill'] = color;
        for (var i = 0; i < numPoints; i += 1) {
          var x = data[i * 2];
          var y = data[i * 2 + 1];
          if (i == 0) {
            g.moveTo(x, y);
          } else {
            g.lineTo(x, y);
          }
        }
        g.closePath(true);
      },
      drawPoint: function(g, color) {
        if (!color) {
          return;
        }
        g.attr['fill'] = color;
        g.drawCircle(610, 900, 30);
      }
    };
  }();

  var drawSeg = function(seg, g, pattern, hiColor, loColor, bgColor) {
    g.attr['stroke'] = 'none';
    if (bgColor) {
      g.attr['fill'] = bgColor;
      g.drawRect(0, 0, seg.width, seg.height);
    }
    var on;
    for (var i = 0; i < seg.allSegments.length; i += 1) {
      var c = seg.allSegments.charAt(i);
      on = (pattern != null && pattern.indexOf(c) != -1);
      seg.drawSegment(g, c, on? hiColor : loColor);
    }
    on = (pattern != null && pattern.indexOf('.') != -1);
    seg.drawPoint(g, on? hiColor : loColor);
  };

  var createSegUI = function(device, seg) {
    var size = device.getSize();
    var sw = seg.width;
    var sh = seg.height;
    var dw = size.width - unit;
    var dh = size.height - unit;
    var scale = (sw / sh > dw / dh)? dw / sw : dh / sh;
    var tx = (size.width - seg.width * scale) / 2;
    var ty = (size.height - seg.height * scale) / 2;
    return $s.createSVGElement('g').
      attr('transform', 'translate(' + tx + ' ' + ty + ')' +
          ' scale(' + scale + ') ');
  };

  var createLEDSegFactory = function(seg) {
    return function(device) {
      var hiColor = device.deviceDef.color || defaultLEDColor;
      var bgColor = device.deviceDef.bgColor || defaultLEDBgColor;
      var loColor = multiplyColor(hiColor, bgColor, 0.25);
      var allSegs = seg.allSegments + '.';
      device.halfPitch = true;
      for (var i = 0; i < allSegs.length; i += 1) {
        device.addInput();
      }

      var super_getSize = device.getSize;
      device.getSize = function() {
        var size = super_getSize();
        return {width: unit * 4, height: size.height};
      };

      var super_createUI = device.createUI;
      device.createUI = function() {
        super_createUI();

        var $seg = createSegUI(device, seg);
        device.$ui.append($seg);

        var update = function() {
          var segs = '';
          for (var i = 0; i < allSegs.length; i += 1) {
            if (isHot(device.getInputs()[i].getValue() ) ) {
              segs += allSegs.charAt(i);
            }
          }
          $seg.children().remove();
          drawSeg(seg, $s.graphics($seg), segs,
              hiColor, loColor, bgColor);
        };
        device.$ui.on('inputValueChange', update);
        update();
        device.doc = {
          params: [
            {name: 'color', type: 'string',
              defaultValue: defaultLEDColor,
              description: 'color in hexadecimal.'},
            {name: 'bgColor', type: 'string',
              defaultValue: defaultLEDBgColor,
              description: 'background color in hexadecimal.'}
          ],
          code: '{"type":"' + device.deviceDef.type +
          '","color":"' + defaultLEDColor + '"}'
        };
      };
    };
  };

  var createLED4bitFactory = function() {

    var _PATTERNS = {
      0: 'abcdef',
      1: 'bc',
      2: 'abdeg',
      3: 'abcdg',
      4: 'bcfg',
      5: 'acdfg',
      6: 'acdefg',
      7: 'abc',
      8: 'abcdefg',
      9: 'abcdfg', 
      a: 'abcefg',
      b: 'cdefg',
      c: 'adef',
      d: 'bcdeg',
      e: 'adefg',
      f: 'aefg'
    };

    var getPattern = function(value) {
      return _PATTERNS['0123456789abcdef'.charAt(value)];
    };

    var seg = _7Seg;

    return function(device) {
      var hiColor = device.deviceDef.color || defaultLEDColor;
      var bgColor = device.deviceDef.bgColor || defaultLEDBgColor;
      var loColor = multiplyColor(hiColor, bgColor, 0.25);
      for (var i = 0; i < 4; i += 1) {
        device.addInput();
      }

      var super_getSize = device.getSize;
      device.getSize = function() {
        var size = super_getSize();
        return {width: unit * 4, height: size.height};
      };

      var super_createUI = device.createUI;
      device.createUI = function() {
        super_createUI();

        var $seg = createSegUI(device, seg);
        device.$ui.append($seg);
  
        var update = function() {
          var value = 0;
          for (var i = 0; i < 4; i += 1) {
            if (isHot(device.getInputs()[i].getValue() ) ) {
              value += (1 << i);
            }
          }
          $seg.children().remove();
          drawSeg(seg, $s.graphics($seg), getPattern(value),
              hiColor, loColor, bgColor);
        };
        device.$ui.on('inputValueChange', update);
        update();
        device.doc = {
          params: [
            {name: 'color', type: 'string',
              defaultValue: defaultLEDColor,
              description: 'color in hexadecimal.'},
            {name: 'bgColor', type: 'string',
              defaultValue: defaultLEDBgColor,
              description: 'background color in hexadecimal.'}
          ],
          code: '{"type":"' + device.deviceDef.type +
          '","color":"' + defaultLEDColor + '"}'
        };
      };
    };
  };


  var createRSFlipFlopFactory = function() {
    return function(device) {
        device.addInput(); // R input
        device.addInput(); // S input
        var out1 = device.addOutput(); // Q output
        var out2 = device.addOutput(); // Q' output

        var reset = false;
        var set = false;

        device.$ui.on('inputValueChange', function() {
            var r = device.getInputs()[0].getValue();
            var s = device.getInputs()[1].getValue();
            
            // Handling the behavior of RS flip-flop
            if (r == 1 && s == 0) {
                reset = true;
                set = false;
            } else if (r == 0 && s == 1) {
                reset = false;
                set = true;
            } else if (r == 0 && s == 0) {
                // Hold state
            } else {
                // Invalid state (both inputs high), do nothing
            }

            // Output values based on the inputs
            out1.setValue(reset ? 0 : 1);
            out2.setValue(set ? 0 : 1);
        });

        var super_createUI = device.createUI;
        device.createUI = function() {
            super_createUI();
            // Create SVG representation of the RS flip-flop
            var size = device.getSize();
            var $svg = device.$ui.find('svg');

            // Drawing the RS flip-flop
            var $rect = $s.createSVGElement('rect')
                .attr({
                    x: 0,
                    y: 0,
                    width: size.width,
                    height: size.height,
                    fill: '#ffffff',
                    stroke: '#000000'
                });
            $svg.append($rect);

            var $text = $s.createSVGElement('text')
                .attr({
                    x: size.width / 2,
                    y: size.height / 2,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle'
                })
                .text('RS');
            $svg.append($text);
        };
    };
};

var createJKFlipFlopFactory = function() {
    return function(device) {
        device.addInput(); // J input
        device.addInput(); // K input
        var out1 = device.addOutput(); // Q output
        var out2 = device.addOutput(); // Q' output

        var q = false;
        var qBar = true;

        device.$ui.on('inputValueChange', function() {
            var j = device.getInputs()[0].getValue();
            var k = device.getInputs()[1].getValue();
            
            // Handling the behavior of JK flip-flop
            if (j == 1 && k == 0) {
                q = true;
                qBar = false;
            } else if (j == 0 && k == 1) {
                q = false;
                qBar = true;
            } else if (j == 1 && k == 1) {
                q = !q;
                qBar = !q;
            } else {
                // Hold state
            }

            // Output values based on the inputs
            out1.setValue(q ? 1 : 0);
            out2.setValue(qBar ? 1 : 0);
        });

        var super_createUI = device.createUI;
        device.createUI = function() {
            super_createUI();
            // Create SVG representation of the JK flip-flop
            var size = device.getSize();
            var $svg = device.$ui.find('svg');

            // Drawing the JK flip-flop
            var $rect = $s.createSVGElement('rect')
                .attr({
                    x: 0,
                    y: 0,
                    width: size.width,
                    height: size.height,
                    fill: '#ffffff',
                    stroke: '#000000'
                });
            $svg.append($rect);

            var $text = $s.createSVGElement('text')
                .attr({
                    x: size.width / 2,
                    y: size.height / 2,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle'
                })
                .text('JK');
            $svg.append($text);
        };
    };
};

// Usage:
  var rsFlipFlopFactory = createRSFlipFlopFactory();
  var jkFlipFlopFactory = createJKFlipFlopFactory();

   // OSC (Oscillator)
  var createOscillatorFactory = function() {
      return function(device) {
          var interval;
          var state = false;
          device.getState = function() {
              return { state: state };
          };
          device.setState = function(s) {
              state = s.state;
              if (state) {
                  interval = setInterval(function() {
                      device.getOutputs()[0].setValue(state ? 1 : 0);
                      state = !state;
                  }, 500); // Change frequency as needed
              } else {
                  clearInterval(interval);
              }
          };
          device.createUI = function() {
              // Create SVG representation of the oscillator
              var size = device.getSize();
              var $svg = device.$ui.find('svg');
  
              // Drawing the oscillator
              var $circle = $s.createSVGElement('circle')
                  .attr({
                      cx: size.width / 2,
                      cy: size.height / 2,
                      r: Math.min(size.width, size.height) / 2 - 2,
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append($circle);
  
              var $text = $s.createSVGElement('text')
                  .attr({
                      x: size.width / 2,
                      y: size.height / 2,
                      'text-anchor': 'middle',
                      'dominant-baseline': 'middle'
                  })
                  .text('OSC');
              $svg.append($text);
              // Enable dragging functionality
            $s.enableDrag(device.$ui, null, device.$ui);

            // Add class for styling
            device.$ui.addClass('simcir-basicset-switch');
          };
      };
  };
  
  // 4-bit 7-segment Display
  var create4Bit7SegFactory = function() {
      return function(device) {
          for (var i = 0; i < 4; i++) {
              device.addInput();
          }
  
          var segments = [
              [1, 1, 1, 1, 1, 1, 0], // 0
              [0, 1, 1, 0, 0, 0, 0], // 1
              // Define other segments for digits 2-9
              // Example: [1, 1, 0, 1, 1, 0, 1], // 2
          ];
  
          device.$ui.on('inputValueChange', function() {
              var value = 0;
              var inputs = device.getInputs();
              for (var i = 0; i < 4; i++) {
                  value |= (inputs[i].getValue() ? 1 : 0) << i;
              }
              updateSegments(segments[value]);
          });
  
          var updateSegments = function(segmentValues) {
              var outputs = device.getOutputs();
              for (var i = 0; i < 7; i++) {
                  outputs[i].setValue(segmentValues[i]);
              }
          };
  
          device.createUI = function() {
              // Create SVG representation of the 4-bit 7-segment display
              var size = device.getSize();
              var $svg = device.$ui.find('svg');
  
              // Drawing the display
              // Example: Draw 7 segments
              // var $segment1 = $s.createSVGElement('line').attr({...});
              // var $segment2 = $s.createSVGElement('line').attr({...});
              // var $segment3 = $s.createSVGElement('line').attr({...});
              // ...
              // $svg.append($segment1, $segment2, $segment3, ...);
          };
      };
  };
  
  // You can follow similar patterns for other devices like T-FF, D-FF, 8-bit Counter, Half Adder, Full Adder, 4-bit Adder,
  // 4-to-1 Binary Decoder, 8-to-1 Binary Decoder, 16-to-1 Binary Decoder, Alternate Full Adder, Transmitter, Delay, NumSrc, NumDsp, DSO.
 var create4Bit7SegFactory = function() {
      return function(device) {
          // Add four inputs for the 4 b Edits
          for (var i = 0; i < 4; i++) {
              device.addInput();
          }
  
          // Define the segments for each digit
          var segments = [
              [1, 1, 1, 1, 1, 1, 0], // 0
              [0, 1, 1, 0, 0, 0, 0], // 1
              [1, 1, 0, 1, 1, 0, 1], // 2
              [1, 1, 1, 1, 0, 0, 1], // 3
              [0, 1, 1, 0, 0, 1, 1], // 4
              [1, 0, 1, 1, 0, 1, 1], // 5
              [1, 0, 1, 1, 1, 1, 1], // 6
              [1, 1, 1, 0, 0, 0, 0], // 7
              [1, 1, 1, 1, 1, 1, 1], // 8
              [1, 1, 1, 1, 0, 1, 1]  // 9
          ];
  
          // Update segment display when input values change
          device.$ui.on('inputValueChange', function() {
              var value = 0;
              var inputs = device.getInputs();
              for (var i = 0; i < 4; i++) {
                  value |= (inputs[i].getValue() ? 1 : 0) << i;
              }
              updateSegments(segments[value]);
          });
  
          // Update segment display based on segment values
          var updateSegments = function(segmentValues) {
              var outputs = device.getOutputs();
              for (var i = 0; i < 7; i++) {
                  outputs[i].setValue(segmentValues[i]);
              }
          };
  
          // Create UI for the 4-bit 7-segment display
          device.createUI = function() {
              // Create SVG representation of the 4-bit 7-segment display
              var size = device.getSize();
              var $svg = device.$ui.find('svg');
  
              // Draw segments
              var segmentWidth = size.width / 16;
              var segmentHeight = size.height / 4;
              var segmentPadding = 1;
  
              for (var i = 0; i < 7; i++) {
                  var x = (i % 3) * (segmentWidth + segmentPadding);
                  var y = Math.floor(i / 3) * (segmentHeight + segmentPadding);
                  var segment = $s.createSVGElement('rect')
                      .attr({
                          x: x,
                          y: y,
                          width: segmentWidth,
                          height: segmentHeight,
                          fill: '#ffffff'
                      });
                  $svg.append(segment);
              }
  
              // Add labels for segments
              var labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
              for (var i = 0; i < 7; i++) {
                  var x = (i % 3) * (segmentWidth + segmentPadding) + segmentWidth / 2;
                  var y = Math.floor(i / 3) * (segmentHeight + segmentPadding) + segmentHeight / 2;
                  var label = $s.createSVGElement('text')
                      .attr({
                          x: x,
                          y: y,
                          'text-anchor': 'middle',
                          'dominant-baseline': 'middle'
                      })
                      .text(labels[i]);
                  $svg.append(label);
              }
          };
      };
  };
    var createTFlipFlopFactory = function() {
      return function(device) {
          // Add inputs and outputs
          var t = device.addInput();
          var clk = device.addInput();
          var q = device.addOutput();
          var notQ = device.addOutput();
  
          // Initialize state
          var state = false;
  
          // Update state on clock rising edge
          clk.on('rise', function() {
              if (t.getValue()) {
                  state = !state;
              }
              updateOutputs();
          });
  
          // Update outputs based on current state
          var updateOutputs = function() {
              q.setValue(state);
              notQ.setValue(!state);
          };
  
          // Create UI for the T flip-flop
          device.createUI = function() {
              var size = device.getSize();
              var $svg = device.$ui.find('svg');
  
              // Draw rectangle representing the flip-flop
              var rect = $s.createSVGElement('rect')
                  .attr({
                      x: 0,
                      y: 0,
                      width: size.width,
                      height: size.height,
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(rect);
  
              // Draw T input
              var tInput = $s.createSVGElement('circle')
                  .attr({
                      cx: size.width * 0.2,
                      cy: size.height * 0.3,
                      r: size.width * 0.1,
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(tInput);
  
              // Draw clock input
              var clkInput = $s.createSVGElement('circle')
                  .attr({
                      cx: size.width * 0.2,
                      cy: size.height * 0.7,
                      r: size.width * 0.1,
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(clkInput);
  
              // Draw Q output
              var qOutput = $s.createSVGElement('circle')
                  .attr({
                      cx: size.width * 0.8,
                      cy: size.height * 0.3,
                      r: size.width * 0.1,
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(qOutput);
  
              // Draw NOT Q output
              var notQOutput = $s.createSVGElement('circle')
                  .attr({
                      cx: size.width * 0.8,
                      cy: size.height * 0.7,
                      r: size.width * 0.1,
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(notQOutput);
          };
      };
  };
 var createDFlipFlopFactory = function() {
      return function(device) {
          // Add inputs and outputs
          var d = device.addInput();
          var clk = device.addInput();
          var q = device.addOutput();
          var notQ = device.addOutput();
  
          // Initialize state
          var state = false;
  
          // Update state on clock rising edge
          clk.on('rise', function() {
              state = d.getValue();
              updateOutputs();
          });
  
          // Update outputs based on current state
          var updateOutputs = function() {
              q.setValue(state);
              notQ.setValue(!state);
          };
  
          // Create UI for the D flip-flop
          device.createUI = function() {
              var size = device.getSize();
              var $svg = device.$ui.find('svg');
  
              // Draw rectangle representing the flip-flop
              var rect = $s.createSVGElement('rect')
                  .attr({
                      x: 0,
                      y: 0,
                      width: size.width,
                      height: size.height,
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(rect);
  
              // Draw D input
              var dInput = $s.createSVGElement('circle')
                  .attr({
                      cx: size.width * 0.2,
                      cy: size.height * 0.5,
                      r: size.width * 0.1,
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(dInput);
  
              // Draw clock input
              var clkInput = $s.createSVGElement('circle')
                  .attr({
                      cx: size.width * 0.8,
                      cy: size.height * 0.2,
                      r: size.width * 0.1,
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(clkInput);
  
              // Draw Q output
              var qOutput = $s.createSVGElement('circle')
                  .attr({
                      cx: size.width * 0.8,
                      cy: size.height * 0.8,
                      r: size.width * 0.1,
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(qOutput);
  
              // Draw NOT Q output
              var notQOutput = $s.createSVGElement('circle')
                  .attr({
                      cx: size.width * 0.2,
                      cy: size.height * 0.8,
                      r: size.width * 0.1,
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(notQOutput);
          };
      };
  };
 var create8BitCounterFactory = function() {
      return function(device) {
          // Define inputs and outputs
          var clk = device.addInput();
          var reset = device.addInput();
          var out = [];
          for (var i = 0; i < 8; i++) {
              out[i] = device.addOutput();
          }
  
          // Initialize counter value
          var counter = 0;
  
          // Update counter value on rising edge of clock
          clk.on('rise', function() {
              if (reset.getValue()) {
                  counter = 0;
              } else {
                  counter = (counter + 1) % 256; // Modulus 256 for 8-bit counter
              }
              updateOutputs();
          });
  
          // Update outputs based on counter value
          var updateOutputs = function() {
              for (var i = 0; i < 8; i++) {
                  out[i].setValue((counter >> i) & 1);
              }
          };
  
          // Create UI for the 8-bit counter
          device.createUI = function() {
              var size = device.getSize();
              var $svg = device.$ui.find('svg');
  
              // Draw rectangle representing the counter
              var rect = $s.createSVGElement('rect')
                  .attr({
                      x: 0,
                      y: 0,
                      width: size.width,
                      height: size.height,
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(rect);
  
              // Draw clock input
              var clkInput = $s.createSVGElement('circle')
                  .attr({
                      cx: size.width * 0.2,
                      cy: size.height * 0.5,
                      r: size.width * 0.1,
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(clkInput);
  
              // Draw reset input
              var resetInput = $s.createSVGElement('circle')
                  .attr({
                      cx: size.width * 0.8,
                      cy: size.height * 0.5,
                      r: size.width * 0.1,
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(resetInput);
  
              // Draw outputs
              for (var i = 0; i < 8; i++) {
                  var output = $s.createSVGElement('circle')
                      .attr({
                          cx: size.width * (i + 2) * 0.1,
                          cy: size.height * 0.8,
                          r: size.width * 0.1,
                          fill: '#ffffff',
                          stroke: '#000000'
                      });
                  $svg.append(output);
              }
          };
      };
  };
 var createHalfAdderFactory = function() {
      return function(device) {
          // Define inputs and outputs
          var in1 = device.addInput();
          var in2 = device.addInput();
          var sum = device.addOutput();
          var carry = device.addOutput();
  
          // Calculate sum and carry
          var calculate = function() {
              var a = in1.getValue();
              var b = in2.getValue();
              sum.setValue(a ^ b); // XOR gate for sum
              carry.setValue(a & b); // AND gate for carry
          };
  
          // Update outputs when inputs change
          in1.on('change', calculate);
          in2.on('change', calculate);
  
          // Create UI for the Half Adder
          device.createUI = function() {
              var size = device.getSize();
              var $svg = device.$ui.find('svg');
  
              // Draw XOR gate for sum
              var xorGate = $s.createSVGElement('path')
                  .attr({
                      d: 'M ' + size.width * 0.1 + ',' + size.height * 0.3 +
                          ' L ' + size.width * 0.3 + ',' + size.height * 0.3 +
                          ' L ' + size.width * 0.5 + ',' + size.height * 0.5 +
                          ' L ' + size.width * 0.3 + ',' + size.height * 0.7 +
                          ' L ' + size.width * 0.1 + ',' + size.height * 0.7 +
                          ' L ' + size.width * 0.1 + ',' + size.height * 0.3 +
                          ' Z',
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(xorGate);
  
              // Draw AND gate for carry
              var andGate = $s.createSVGElement('path')
                  .attr({
                      d: 'M ' + size.width * 0.7 + ',' + size.height * 0.3 +
                          ' L ' + size.width * 0.9 + ',' + size.height * 0.3 +
                          ' L ' + size.width * 0.9 + ',' + size.height * 0.7 +
                          ' L ' + size.width * 0.7 + ',' + size.height * 0.7 +
                          ' L ' + size.width * 0.7 + ',' + size.height * 0.3 +
                          ' Z',
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(andGate);
  
              // Draw connections
              var connection1 = $s.createSVGElement('path')
                  .attr({
                      d: 'M ' + size.width * 0.5 + ',' + size.height * 0.1 +
                          ' L ' + size.width * 0.5 + ',' + size.height * 0.3,
                      stroke: '#000000'
                  });
              $svg.append(connection1);
  
              var connection2 = $s.createSVGElement('path')
                  .attr({
                      d: 'M ' + size.width * 0.5 + ',' + size.height * 0.7 +
                          ' L ' + size.width * 0.5 + ',' + size.height * 0.9,
                      stroke: '#000000'
                  });
              $svg.append(connection2);
  
              var connection3 = $s.createSVGElement('path')
                  .attr({
                      d: 'M ' + size.width * 0.1 + ',' + size.height * 0.5 +
                          ' L ' + size.width * 0.3 + ',' + size.height * 0.5,
                      stroke: '#000000'
                  });
              $svg.append(connection3);
  
              var connection4 = $s.createSVGElement('path')
                  .attr({
                      d: 'M ' + size.width * 0.7 + ',' + size.height * 0.5 +
                          ' L ' + size.width * 0.9 + ',' + size.height * 0.5,
                      stroke: '#000000'
                  });
              $svg.append(connection4);
          };
      };
  };
 var createFullAdderFactory = function() {
      return function(device) {
          // Define inputs and outputs
          var in1 = device.addInput();
          var in2 = device.addInput();
          var cin = device.addInput();
          var sum = device.addOutput();
          var cout = device.addOutput();
  
          // Calculate sum and carry
          var calculate = function() {
              var a = in1.getValue();
              var b = in2.getValue();
              var c = cin.getValue();
  
              var sumValue = (a ^ b) ^ c; // XOR gate for sum
              var carryValue = (a & b) | (c & (a ^ b)); // OR gate for carry
  
              sum.setValue(sumValue);
              cout.setValue(carryValue);
          };
  
          // Update outputs when inputs change
          in1.on('change', calculate);
          in2.on('change', calculate);
          cin.on('change', calculate);
  
          // Create UI for the Full Adder
          device.createUI = function() {
              var size = device.getSize();
              var $svg = device.$ui.find('svg');
  
              // Draw XOR gate for sum
              var xorGate1 = $s.createSVGElement('path')
                  .attr({
                      d: 'M ' + size.width * 0.1 + ',' + size.height * 0.3 +
                          ' L ' + size.width * 0.3 + ',' + size.height * 0.3 +
                          ' L ' + size.width * 0.5 + ',' + size.height * 0.5 +
                          ' L ' + size.width * 0.3 + ',' + size.height * 0.7 +
                          ' L ' + size.width * 0.1 + ',' + size.height * 0.7 +
                          ' L ' + size.width * 0.1 + ',' + size.height * 0.3 +
                          ' Z',
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(xorGate1);
  
              var xorGate2 = $s.createSVGElement('path')
                  .attr({
                      d: 'M ' + size.width * 0.7 + ',' + size.height * 0.3 +
                          ' L ' + size.width * 0.9 + ',' + size.height * 0.3 +
                          ' L ' + size.width * 0.9 + ',' + size.height * 0.7 +
                          ' L ' + size.width * 0.7 + ',' + size.height * 0.7 +
                          ' L ' + size.width * 0.7 + ',' + size.height * 0.3 +
                          ' Z',
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(xorGate2);
  
              // Draw AND gate for carry
              var andGate = $s.createSVGElement('path')
                  .attr({
                      d: 'M ' + size.width * 0.5 + ',' + size.height * 0.7 +
                          ' L ' + size.width * 0.5 + ',' + size.height * 0.9 +
                          ' L ' + size.width * 0.7 + ',' + size.height * 0.9 +
                          ' L ' + size.width * 0.7 + ',' + size.height * 0.7 +
                          ' Z',
                      fill: '#ffffff',
                      stroke: '#000000'
                  });
              $svg.append(andGate);
  
              // Draw connections
              var connection1 = $s.createSVGElement('path')
                  .attr({
                      d: 'M ' + size.width * 0.5 + ',' + size.height * 0.1 +
                          ' L ' + size.width * 0.5 + ',' + size.height * 0.3,
                      stroke: '#000000'
                  });
              $svg.append(connection1);
  
              var connection2 = $s.createSVGElement('path')
                  .attr({
                      d: 'M ' + size.width * 0.1 + ',' + size.height * 0.5 +
                          ' L ' + size.width * 0.3 + ',' + size.height * 0.5,
                      stroke: '#000000'
                  });
              $svg.append(connection2);
  
              var connection3 = $s.createSVGElement('path')
                  .attr({
                      d: 'M ' + size.width * 0.7 + ',' + size.height * 0.5 +
                          ' L ' + size.width * 0.9 + ',' + size.height * 0.5,
                      stroke: '#000000'
                  });
              $svg.append(connection3);
  
              var connection4 = $s.createSVGElement('path')
                  .attr({
                      d: 'M ' + size.width * 0.5 + ',' + size.height * 0.9 +
                          ' L ' + size.width * 0.5 + ',' + size.height * 0.7,
                      stroke: '#000000'
                  });
              $svg.append(connection4);
          };
      };
  };
// Define function to create a 4-bit adder to 4-bit binary decoder
  var create4BitAdderTo4BinaryDecoderFactory = function() {
      return function(device) {
          // Define inputs and outputs for the 4-bit adder
          var inA = [];
          var inB = [];
          var cin = device.addInput();
          var sum = [];
          var cout = device.addOutput();
  
          // Define inputs and outputs for the 4-bit binary decoder
          var decoderInputs = [];
          var decoderOutputs = [];
          for (var i = 0; i < 4; i++) {
              decoderInputs.push(device.addInput());
              decoderOutputs.push(device.addOutput());
          }
  
          // Create the 4-bit adder
          var adder = device.addPart(simcir.logic.adder4Bit);
  
          // Connect inputs and outputs of the 4-bit adder
          for (var i = 0; i < 4; i++) {
              inA.push(adder.addInput());
              inB.push(adder.addInput());
              sum.push(adder.addOutput());
          }
          cin.connect(adder.addInput());
          cout.connect(adder.addOutput());
  
          // Connect the outputs of the 4-bit adder to the inputs of the 4-bit binary decoder
          for (var i = 0; i < 4; i++) {
              decoderInputs[i].connect(sum[i]);
          }
  
          // Connect the carry output of the 4-bit adder to the inputs of the 4-bit binary decoder
          cout.connect(decoderInputs[4]);
  
          // Define the behavior of the 4-bit binary decoder
          var updateDecoderOutputs = function() {
              var value = [];
              for (var i = 0; i < 4; i++) {
                  value.push(decoderInputs[i].getValue());
              }
              var decimalValue = simcir.logic.binary2Decimal(value);
              for (var i = 0; i < 4; i++) {
                  decoderOutputs[i].setValue((i === decimalValue) ? 1 : 0);
              }
          };
  
          // Update the decoder outputs when the inputs change
          for (var i = 0; i < 4; i++) {
              decoderInputs[i].on('change', updateDecoderOutputs);
          }
  
          // Update the decoder outputs initially
          updateDecoderOutputs();
  
          // Create UI for the 4-bit adder to 4-bit binary decoder
          device.createUI = function() {
              // Create UI for the 4-bit adder
              adder.createUI();
          };
      };
  };
  // Define function to create a 4-bit adder to 8-bit binary decoder
  var create4BitAdderTo8BitBinaryDecoderFactory = function() {
      return function(device) {
          // Define inputs and outputs for the 4-bit adder
          var inA = [];
          var inB = [];
          var cin = device.addInput();
          var sum = [];
          var cout = device.addOutput();
  
          // Define inputs and outputs for the 8-bit binary decoder
          var decoderInputs = [];
          var decoderOutputs = [];
          for (var i = 0; i < 8; i++) {
              decoderInputs.push(device.addInput());
              decoderOutputs.push(device.addOutput());
          }
  
          // Create the 4-bit adder
          var adder = device.addPart(simcir.logic.adder4Bit);
  
          // Connect inputs and outputs of the 4-bit adder
          for (var i = 0; i < 4; i++) {
              inA.push(adder.addInput());
              inB.push(adder.addInput());
              sum.push(adder.addOutput());
          }
          cin.connect(adder.addInput());
          cout.connect(adder.addOutput());
  
          // Connect the outputs of the 4-bit adder to the inputs of the 8-bit binary decoder
          for (var i = 0; i < 8; i++) {
              if (i < 4) {
                  decoderInputs[i].connect(sum[i]);
              } else {
                  decoderInputs[i].connect(cout);
              }
          }
  
          // Define the behavior of the 8-bit binary decoder
          var updateDecoderOutputs = function() {
              var value = [];
              for (var i = 0; i < 8; i++) {
                  value.push(decoderInputs[i].getValue());
              }
              var decimalValue = simcir.logic.binary2Decimal(value);
              for (var i = 0; i < 8; i++) {
                  decoderOutputs[i].setValue((i === decimalValue) ? 1 : 0);
              }
          };
  
          // Update the decoder outputs when the inputs change
          for (var i = 0; i < 8; i++) {
              decoderInputs[i].on('change', updateDecoderOutputs);
          }
  
          // Update the decoder outputs initially
          updateDecoderOutputs();
  
          // Create UI for the 4-bit adder to 8-bit binary decoder
          device.createUI = function() {
              // Create UI for the 4-bit adder
              adder.createUI();
          };
      };
  };
 // Define function to create a 4-bit adder to 16-bit binary decoder
  var create4BitAdderTo16BitBinaryDecoderFactory = function() {
      return function(device) {
          // Define inputs and outputs for the 4-bit adder
          var inA = [];
          var inB = [];
          var cin = device.addInput();
          var sum = [];
          var cout = device.addOutput();
  
          // Define inputs and outputs for the 16-bit binary decoder
          var decoderInputs = [];
          var decoderOutputs = [];
          for (var i = 0; i < 16; i++) {
              decoderInputs.push(device.addInput());
              decoderOutputs.push(device.addOutput());
          }
  
          // Create the 4-bit adder
          var adder = device.addPart(simcir.logic.adder4Bit);
  
          // Connect inputs and outputs of the 4-bit adder
          for (var i = 0; i < 4; i++) {
              inA.push(adder.addInput());
              inB.push(adder.addInput());
              sum.push(adder.addOutput());
          }
          cin.connect(adder.addInput());
          cout.connect(adder.addOutput());
  
          // Connect the outputs of the 4-bit adder to the inputs of the 16-bit binary decoder
          for (var i = 0; i < 16; i++) {
              if (i < 4) {
                  decoderInputs[i].connect(sum[i]);
              } else {
                  decoderInputs[i].connect(cout);
              }
          }
  
          // Define the behavior of the 16-bit binary decoder
          var updateDecoderOutputs = function() {
              var value = [];
              for (var i = 0; i < 16; i++) {
                  value.push(decoderInputs[i].getValue());
              }
              var decimalValue = simcir.logic.binary2Decimal(value);
              for (var i = 0; i < 16; i++) {
                  decoderOutputs[i].setValue((i === decimalValue) ? 1 : 0);
              }
          };
  
          // Update the decoder outputs when the inputs change
          for (var i = 0; i < 16; i++) {
              decoderInputs[i].on('change', updateDecoderOutputs);
          }
  
          // Update the decoder outputs initially
          updateDecoderOutputs();
  
          // Create UI for the 4-bit adder to 16-bit binary decoder
          device.createUI = function() {
              // Create UI for the 4-bit adder
              adder.createUI();
          };
      };
  };
   // Define function to create an alternate full adder
  var createAltFullAdderFactory = function() {
      return function(device) {
          // Define inputs, outputs, and internal nodes
          var a = device.addInput();
          var b = device.addInput();
          var cin = device.addInput();
          var sum = device.addOutput();
          var cout = device.addOutput();
  
          // Internal nodes
          var xor1Out = device.addCircuitPart(simcir.logic.xorGate);
          var xor2Out = device.addCircuitPart(simcir.logic.xorGate);
          var and1Out = device.addCircuitPart(simcir.logic.andGate);
          var and2Out = device.addCircuitPart(simcir.logic.andGate);
          var orOut = device.addCircuitPart(simcir.logic.orGate);
  
          // Connect components
          a.connect(xor1Out, 0);
          b.connect(xor1Out, 1);
          xor1Out.connect(xor2Out);
          cin.connect(xor2Out, 1);
          xor1Out.connect(and1Out, 0);
          cin.connect(and1Out, 1);
          a.connect(and2Out, 0);
          b.connect(and2Out, 1);
          and1Out.connect(orOut, 0);
          and2Out.connect(orOut, 1);
          xor2Out.connect(sum);
          orOut.connect(cout);
  
          // Create UI for the alternate full adder
          device.createUI = function() {
              // Create UI for inputs and outputs
              a.createUI();
              b.createUI();
              cin.createUI();
              sum.createUI();
              cout.createUI();
  
              // Create UI for internal gates
              xor1Out.createUI();
              xor2Out.createUI();
              and1Out.createUI();
              and2Out.createUI();
              orOut.createUI();
  
              // Position the components
              a.$ui.attr({ transform: 'translate(0, 20)' });
              b.$ui.attr({ transform: 'translate(0, 50)' });
              cin.$ui.attr({ transform: 'translate(0, 80)' });
              sum.$ui.attr({ transform: 'translate(160, 50)' });
              cout.$ui.attr({ transform: 'translate(320, 50)' });
  
              xor1Out.$ui.attr({ transform: 'translate(80, 35)' });
              xor2Out.$ui.attr({ transform: 'translate(240, 35)' });
              and1Out.$ui.attr({ transform: 'translate(160, 20)' });
              and2Out.$ui.attr({ transform: 'translate(160, 80)' });
              orOut.$ui.attr({ transform: 'translate(400, 50)' });
          };
      };
  };
  // Define function to create a NumSrc (Numeric Source)
  var createNumSrcFactory = function() {
      return function(device) {
          // Define output
          var out1 = device.addOutput();
  
          // Create UI for the NumSrc
          device.createUI = function() {
              // Define SVG elements
              var size = device.getSize();
              var $numSrc = $s.createSVGElement('g');
              var $rect = $s.createSVGElement('rect');
              var $text = $s.createSVGElement('text');
  
              // Set attributes for SVG elements
              $numSrc.append($rect);
              $numSrc.append($text);
  
              $numSrc.attr('class', 'simcir-basicset-symbol');
              $rect.attr({ x: 0, y: 0, width: size.width, height: size.height });
              $text.attr({ x: size.width / 2, y: size.height / 2, 'text-anchor': 'middle', 'dominant-baseline': 'middle' })
                   .text('0');
  
              // Append SVG elements to device UI
              device.$ui.append($numSrc);
  
              // Position the components
              $numSrc.attr('transform', 'translate(0, 0)');
  
              // Update output value
              device.updateOutput = function(value) {
                  out1.setValue(value);
                  $text.text(value);
              };
  
              // Enable dragging functionality
              $s.enableDrag(device.$ui, null, device.$ui);
  
              // Add class for styling
              device.$ui.addClass('simcir-basicset-symbol');
          };
  
          // Set default output value to 0
          device.updateOutput(0);
      };
  };
  // Define function to create a NumDsp (Numeric Display)
  var createNumDspFactory = function() {
      return function(device) {
          // Define input
          var in1 = device.addInput();
  
          // Create UI for the NumDsp
          device.createUI = function() {
              // Define SVG elements
              var size = device.getSize();
              var $numDsp = $s.createSVGElement('g');
              var $rect = $s.createSVGElement('rect');
              var $text = $s.createSVGElement('text');
  
              // Set attributes for SVG elements
              $numDsp.append($rect);
              $numDsp.append($text);
  
              $numDsp.attr('class', 'simcir-basicset-symbol');
              $rect.attr({ x: 0, y: 0, width: size.width, height: size.height });
              $text.attr({ x: size.width / 2, y: size.height / 2, 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
  
              // Append SVG elements to device UI
              device.$ui.append($numDsp);
  
              // Position the components
              $numDsp.attr('transform', 'translate(0, 0)');
  
              // Update display value based on input
              device.$ui.on('inputValueChange', function() {
                  var value = in1.getValue();
                  $text.text(value);
              });
  
              // Enable dragging functionality
              $s.enableDrag(device.$ui, null, device.$ui);
  
              // Add class for styling
              device.$ui.addClass('simcir-basicset-symbol');
          };
      };
  };
   // Define function to create a Delay circuit
  var createDelayFactory = function() {
      return function(device) {
          // Define input and output
          var in1 = device.addInput();
          var out1 = device.addOutput();
  
          // Create UI for the Delay circuit
          device.createUI = function() {
              // Define SVG elements
              var size = device.getSize();
              var $delay = $s.createSVGElement('g');
              var $rect = $s.createSVGElement('rect');
  
              // Set attributes for SVG elements
              $delay.append($rect);
              $delay.attr('class', 'simcir-basicset-symbol');
              $rect.attr({ x: 0, y: 0, width: size.width, height: size.height });
  
              // Append SVG elements to device UI
              device.$ui.append($delay);
  
              // Position the components
              $delay.attr('transform', 'translate(0, 0)');
  
              // Update output value after a delay
              device.$ui.on('inputValueChange', function() {
                  var value = in1.getValue();
                  setTimeout(function() {
                      out1.setValue(value);
                  }, 1000); // Set delay time in milliseconds (e.g., 1000 milliseconds = 1 second)
              });
  
              // Enable dragging functionality
              $s.enableDrag(device.$ui, null, device.$ui);
  
              // Add class for styling
              device.$ui.addClass('simcir-basicset-symbol');
          };
      };
  };
   // Define function to create a DSO circuit
  // Define SVG icon for the DSO gate
  var createDSOFactory = function() {
    return function(device) {
        var unit = 20; // Adjust size as needed

        // Draw function for DSO symbol
        var drawDSO = function(g, x, y, w, h) {
            g.drawRect(x, y, w, h);
            // Customize the drawing of the DSO symbol here
            // Example: Draw lines, shapes, or text to represent the DSO
        };

        // Call createLogicGateFactory to create DSO gate
        createLogicGateFactory(null, function(b) {
            return b; // Output value
        }, drawDSO)(device);
    };
};

// Register the DSO gate
$s.registerDevice('DSO', createDSOFactory());

  var createRotaryEncoderFactory = function() {
    var _MIN_ANGLE = 45;
    var _MAX_ANGLE = 315;
    // var thetaToAngle = function(theta) {
    //   var angle = (theta - Math.PI / 2) / Math.PI * 180;
    //   while (angle < 0) {
    //     angle += 360;
    //   }
    //   while (angle > 360) {
    //     angle -= 360;
    //   }
    //   return angle;
    // };
    // return function(device) {
    //   var numOutputs = Math.max(2, device.deviceDef.numOutputs || 4);
    //   device.halfPitch = numOutputs > 4;
    //   device.addInput();
    //   for (var i = 0; i < numOutputs; i += 1) {
    //     device.addOutput();
    //   }

    //   var super_getSize = device.getSize;
    //   device.getSize = function() {
    //     var size = super_getSize();
    //     return {width: unit * 4, height: size.height};
    //   };

    //   var super_createUI = device.createUI;
    //   device.createUI = function() {
    //     super_createUI();
    //     var size = device.getSize();
        
    //     var $knob = $s.createSVGElement('g').
    //       attr('class', 'simcir-basicset-knob').
    //       append($s.createSVGElement('rect').
    //           attr({x:-10,y:-10,width:20,height:20}));
    //     var r = Math.min(size.width, size.height) / 4 * 1.5;
    //     var g = $s.graphics($knob);
    //     g.drawCircle(0, 0, r);
    //     g.attr['class'] = 'simcir-basicset-knob-mark';
    //     g.moveTo(0, 0);
    //     g.lineTo(r, 0);
    //     g.closePath();
    //     device.$ui.append($knob);
  
    //     var _angle = _MIN_ANGLE;
    //     var setAngle = function(angle) {
    //       _angle = Math.max(_MIN_ANGLE, Math.min(angle, _MAX_ANGLE) );
    //       update();
    //     };
  
    //     var dragPoint = null;
    //     var knob_mouseDownHandler = function(event) {
    //       event.preventDefault();
    //       event.stopPropagation();
    //       dragPoint = {x: event.pageX, y: event.pageY};
    //       $(document).on('mousemove', knob_mouseMoveHandler);
    //       $(document).on('mouseup', knob_mouseUpHandler);
    //     };
    //     var knob_mouseMoveHandler = function(event) {
    //       var off = $knob.parent('svg').offset();
    //       var pos = $s.offset($knob);
    //       var cx = off.left + pos.x;
    //       var cy = off.top + pos.y;
    //       var dx = event.pageX - cx;
    //       var dy = event.pageY - cy;
    //       if (dx == 0 && dy == 0) return;
    //       setAngle(thetaToAngle(Math.atan2(dy, dx) ) );
    //     };
    //     var knob_mouseUpHandler = function(event) {
    //       $(document).off('mousemove', knob_mouseMoveHandler);
    //       $(document).off('mouseup', knob_mouseUpHandler);
    //     };
    //     device.$ui.on('deviceAdd', function() {
    //       $s.enableEvents($knob, true);
    //       $knob.on('mousedown', knob_mouseDownHandler);
    //     });
    //     device.$ui.on('deviceRemove', function() {
    //       $s.enableEvents($knob, false);
    //       $knob.off('mousedown', knob_mouseDownHandler);
    //     });
  
    //     var update = function() {
    //       $s.transform($knob, size.width / 2,
    //           size.height / 2, _angle + 90);
    //       var max = 1 << numOutputs;
    //       var value = Math.min( ( (_angle - _MIN_ANGLE) /
    //           (_MAX_ANGLE - _MIN_ANGLE) * max), max - 1);
    //       for (var i = 0; i < numOutputs; i += 1) {
    //         device.getOutputs()[i].setValue( (value & (1 << i) )?
    //             device.getInputs()[0].getValue() : null);
    //       }
    //     };
    //     device.$ui.on('inputValueChange', update);
    //     update();
    //     device.doc = {
    //       params: [
    //         {name: 'numOutputs', type: 'number', defaultValue: 4,
    //           description: 'number of outputs.'}
    //       ],
    //       code: '{"type":"' + device.deviceDef.type + '","numOutputs":4}'
    //     };
    //   };
    // };
    var thetaToAngle = function(theta) {
      var angle = (theta - Math.PI / 2) / Math.PI * 180;
      while (angle < 0) {
          angle += 360;
      }
      while (angle > 360) {
          angle -= 360;
      }
      return angle;
  };
  
  var _MIN_ANGLE = 45;
  var _MAX_ANGLE = 315;
  
  return function(device) {
      var numOutputs = Math.max(2, device.deviceDef.numOutputs || 4);
      device.halfPitch = numOutputs > 4;
      device.addInput();
      for (var i = 0; i < numOutputs; i += 1) {
          device.addOutput();
      }
  
      var super_getSize = device.getSize;
      device.getSize = function() {
          var size = super_getSize();
          return { width: unit * 4, height: size.height };
      };
  
      var super_createUI = device.createUI;
      device.createUI = function() {
          super_createUI();
          var size = device.getSize();
  
          var $knob = $s.createSVGElement('g')
              .attr('class', 'simcir-basicset-knob')
              .append($s.createSVGElement('rect')
                  .attr({ x: -10, y: -10, width: 20, height: 20 }));
          var r = Math.min(size.width, size.height) / 4 * 1.5;
          var g = $s.graphics($knob);
          g.drawCircle(0, 0, r);
          g.attr['class'] = 'simcir-basicset-knob-mark';
          g.moveTo(0, 0);
          g.lineTo(r, 0);
          g.closePath();
          device.$ui.append($knob);
  
          var $deleteButton = $s.createSVGElement('g')
              .attr('class', 'simcir-basicset-delete-button')
              .append($s.createSVGElement('rect')
                  .attr({ x: size.width - 20, y: -10, width: 20, height: 20 })
                  .on('click', function() {
                      // Trigger remove event for the device
                      device.trigger('remove');
                  }))
              .append($s.createSVGElement('text')
                  .attr({ x: size.width - 12, y: 5 })
                  .text('❌'));
          device.$ui.append($deleteButton);
  
          // Add event listener to handle removal of the device
          device.on('remove', function() {
              // Remove the device from the circuit
              device.remove();
          });
  
          var _angle = _MIN_ANGLE;
          var setAngle = function(angle) {
              _angle = Math.max(_MIN_ANGLE, Math.min(angle, _MAX_ANGLE));
              update();
          };
  
          var dragPoint = null;
          var knob_mouseDownHandler = function(event) {
              event.preventDefault();
              event.stopPropagation();
              dragPoint = { x: event.pageX, y: event.pageY };
              $(document).on('mousemove', knob_mouseMoveHandler);
              $(document).on('mouseup', knob_mouseUpHandler);
          };
          var knob_mouseMoveHandler = function(event) {
              var off = $knob.parent('svg').offset();
              var pos = $s.offset($knob);
              var cx = off.left + pos.x;
              var cy = off.top + pos.y;
              var dx = event.pageX - cx;
              var dy = event.pageY - cy;
              if (dx == 0 && dy == 0) return;
              setAngle(thetaToAngle(Math.atan2(dy, dx)));
          };
          var knob_mouseUpHandler = function(event) {
              $(document).off('mousemove', knob_mouseMoveHandler);
              $(document).off('mouseup', knob_mouseUpHandler);
          };
          device.$ui.on('deviceAdd', function() {
              $s.enableEvents($knob, true);
              $knob.on('mousedown', knob_mouseDownHandler);
          });
          device.$ui.on('deviceRemove', function() {
              $s.enableEvents($knob, false);
              $knob.off('mousedown', knob_mouseDownHandler);
          });
  
          var update = function() {
              $s.transform($knob, size.width / 2,
                  size.height / 2, _angle + 90);
          };
          update();
          device.doc = {
              params: [
                  { name: 'numOutputs', type: 'number', defaultValue: 4, description: 'Number of output pins.' }
              ],
              code: '{"type":"' + device.deviceDef.type + '","numOutputs":4}'
          };
      };
  };
  };

  // register direct current source
  $s.registerDevice('DC', function(device) {
    device.addOutput();
    var super_createUI = device.createUI;
    device.createUI = function() {
      super_createUI();
      device.$ui.addClass('simcir-basicset-dc');
    };
    device.$ui.on('deviceAdd', function() {
      device.getOutputs()[0].setValue(onValue);
    });
    device.$ui.on('deviceRemove', function() {
      device.getOutputs()[0].setValue(null);
    });
  });

  // register simple LED
  $s.registerDevice('LED', function(device) {
    var in1 = device.addInput();
    var super_createUI = device.createUI;
    device.createUI = function() {
      super_createUI();
      var hiColor = device.deviceDef.color || defaultLEDColor;
      var bgColor = device.deviceDef.bgColor || defaultLEDBgColor;
      var loColor = multiplyColor(hiColor, bgColor, 0.25);
      var bLoColor = multiplyColor(hiColor, bgColor, 0.2);
      var bHiColor = multiplyColor(hiColor, bgColor, 0.8);
      var size = device.getSize();
      var $ledbase = $s.createSVGElement('circle').
        attr({cx: size.width / 2, cy: size.height / 2, r: size.width / 4}).
        attr('stroke', 'none').
        attr('fill', bLoColor);
      device.$ui.append($ledbase);
      var $led = $s.createSVGElement('circle').
        attr({cx: size.width / 2, cy: size.height / 2, r: size.width / 4 * 0.8}).
        attr('stroke', 'none').
        attr('fill', loColor);
      device.$ui.append($led);
      device.$ui.on('inputValueChange', function() {
        $ledbase.attr('fill', isHot(in1.getValue() )? bHiColor : bLoColor);
        $led.attr('fill', isHot(in1.getValue() )? hiColor : loColor);
      });
      device.doc = {
        params: [
          {name: 'color', type: 'string',
            defaultValue: defaultLEDColor,
            description: 'color in hexadecimal.'},
          {name: 'bgColor', type: 'string',
            defaultValue: defaultLEDBgColor,
            description: 'background color in hexadecimal.'}
        ],
        code: '{"type":"' + device.deviceDef.type +
        '","color":"' + defaultLEDColor + '"}'
      };
    };
  });

  // register switches
  $s.registerDevice('PushOff', createSwitchFactory('PushOff') );
  $s.registerDevice('PushOn', createSwitchFactory('PushOn') );
  $s.registerDevice('Toggle', createSwitchFactory('Toggle') );

  // register logic gates
  $s.registerDevice('BUF', createLogicGateFactory(null, BUF, drawBUF) );
  $s.registerDevice('NOT', createLogicGateFactory(null, NOT, drawNOT) );
  $s.registerDevice('AND', createLogicGateFactory(AND, BUF, drawAND) );
  $s.registerDevice('NAND', createLogicGateFactory(AND, NOT, drawNAND) );
  $s.registerDevice('OR', createLogicGateFactory(OR, BUF, drawOR) );
  $s.registerDevice('NOR', createLogicGateFactory(OR, NOT, drawNOR) );
  $s.registerDevice('XOR', createLogicGateFactory(EOR, BUF, drawEOR) );
  $s.registerDevice('XNOR', createLogicGateFactory(EOR, NOT, drawENOR) );
  // deprecated. not displayed in the default toolbox.
  $s.registerDevice('EOR', createLogicGateFactory(EOR, BUF, drawEOR), true);
  $s.registerDevice('ENOR', createLogicGateFactory(EOR, NOT, drawENOR), true);

  // register Oscillator
  $s.registerDevice('OSC', function(device) {
    var freq = device.deviceDef.freq || 10;
    var delay = ~~(500 / freq);
    var out1 = device.addOutput();
    var timerId = null;
    var on = false;
    device.$ui.on('deviceAdd', function() {
      timerId = window.setInterval(function() {
        out1.setValue(on? onValue : offValue);
        on = !on;
      }, delay);
    });
    device.$ui.on('deviceRemove', function() {
      if (timerId != null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    });
    var super_createUI = device.createUI;
    device.createUI = function() {
      super_createUI();
      device.$ui.addClass('simcir-basicset-osc');
      device.doc = {
        params: [
          {name: 'freq', type: 'number', defaultValue: '10',
            description: 'frequency of an oscillator.'}
        ],
        code: '{"type":"' + device.deviceDef.type + '","freq":10}'
      };
    };
  });

  // register LED seg
  $s.registerDevice('7seg', createLEDSegFactory(_7Seg) );
  $s.registerDevice('16seg', createLEDSegFactory(_16Seg) );
  $s.registerDevice('4bit7seg', createLED4bitFactory() );

  // register Rotary Encoder
  $s.registerDevice('RotaryEncoder', createRotaryEncoderFactory() );

  $s.registerDevice('BusIn', function(device) {
    var numOutputs = Math.max(2, device.deviceDef.numOutputs || 8);
    device.halfPitch = true;
    device.addInput('', 'x' + numOutputs);
    for (var i = 0; i < numOutputs; i += 1) {
      device.addOutput();
    }
    var extractValue = function(busValue, i) {
      return (busValue != null && typeof busValue == 'object' &&
          typeof busValue[i] != 'undefined')? busValue[i] : null;
    };
    device.$ui.on('inputValueChange', function() {
      var busValue = device.getInputs()[0].getValue();
      for (var i = 0; i < numOutputs; i += 1) {
        device.getOutputs()[i].setValue(extractValue(busValue, i) );
      }
    });
    var super_createUI = device.createUI;
    device.createUI = function() {
      super_createUI();
      device.doc = {
        params: [
          {name: 'numOutputs', type: 'number', defaultValue: 8,
            description: 'number of outputs.'}
        ],
        code: '{"type":"' + device.deviceDef.type + '","numOutputs":8}'
      };
    };
  });

  simcir.registerDevice("MyBreadboard", {
  width: 840,
  height: 330,
  setup: function() {
    // Create pins for power rails and signal lines
    var pins = [];
    for (var i = 0; i < 63; i++) {
      pins.push({name: i, label: i});
    }
    for (var i = 0; i < 4; i++) {
      pins.push({name: "pwr" + i, label: "Pwr " + i, type: "power"});
    }
    for (var i = 0; i < 4; i++) {
      pins.push({name: "gnd" + i, label: "Gnd " + i, type: "ground"});
    }

    // Add pins to device object
    this.pins = pins;
  },
  init: function() {
    // Initialize breadboard state
    this.breadboardState = {
      rows: [],
      cols: []
    };
    for (var i = 0; i < 63; i++) {
      this.breadboardState.cols.push([]);
    }
    for (var i = 0; i < 30; i++) {
      this.breadboardState.rows.push([]);
    }
  },
  toggleConnection: function(pin) {
    // Toggle connection state of breadboard hole
    var row = Math.floor(pin / 5);
    var col = pin % 5;
    this.breadboardState.rows[row][col] = !this.breadboardState.rows[row][col];
    this.breadboardState.cols[pin].forEach(function(connected, i) {
      this.breadboardState.cols[pin][i] = !connected;
    }.bind(this));
  },
  draw: function(g) {
    // Draw breadboard holes
    g.drawRect(0, 0, this.width, this.height);
    var holeSize = 8;
    for (var row = 0; row < 30; row++) {
      for (var col = 0; col < 63; col++) {
        var x = col * holeSize + holeSize / 2;
        var y = row * holeSize + holeSize / 2;
        var color = this.breadboardState.rows[row][col % 5] ? "#f00" : "#000";
        g.drawCircle(x, y, holeSize / 2, color);
      }
    }
  }
});


  $s.registerDevice('BusOut', function(device) {
    var numInputs = Math.max(2, device.deviceDef.numInputs || 8);
    device.halfPitch = true;
    for (var i = 0; i < numInputs; i += 1) {
      device.addInput();
    }
    device.addOutput('', 'x' + numInputs);
    device.$ui.on('inputValueChange', function() {
      var busValue = [];
      var hotCount = 0;
      for (var i = 0; i < numInputs; i += 1) {
        var value = device.getInputs()[i].getValue();
        if (isHot(value) ) {
          hotCount += 1;
        }
        busValue.push(value);
      }
      device.getOutputs()[0].setValue(
          (hotCount > 0)? busValue : null);
    });
    var super_createUI = device.createUI;
    device.createUI = function() {
      super_createUI();
      device.doc = {
        params: [
          {name: 'numInputs', type: 'number', defaultValue: 8,
            description: 'number of inputs.'}
        ],
        code: '{"type":"' + device.deviceDef.type + '","numInputs":8}'
      };
    };
  });

}(simcir);
