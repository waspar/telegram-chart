function TelegramChart(_container, _data, _options) {

	// defaults
	var def = {

		colors: {
			telegram: '#0088cc'
		},


		themes: {

			light: {
				circle: '#ffffff',
				line: '#f2f4f5',
				text: '#96a2aa',
				alpha: 0.8,
				preview: {
					base: '#eef2f5',
					border: '#b6cfe1',
					alpha: 0.5
				}
			},

			dark: {
				circle: '#242f3e',
				line: '#293544',
				text: '#546778',
				alpha: 0.8,
				preview: {
					base: '#152435',
					border: '#5a7e9f',
					alpha: 0.5
				}
			}

		},

		theme: 'light'
	};
	// \defaults

	// locale*
	var loc = {
		month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
	};
	// \locale*

	// utilities
	var utl = {

		minmax: function (_arr, _ifrom, _ito) {
			var r = {min: false, max: false, imin: false, imax: false};

			if (_arr.length > 0) {

				if (!_ifrom) _ifrom = 0; // Number.MIN_VALUE;
				if (!_ito) _ito = _arr.length - 1;// Number.MAX_VALUE;

				r.min = _arr[_ifrom];
				r.max = _arr[_ito];
				r.imin = _ifrom;
				r.imax = _ito;

				for (var i = _ifrom; i <= _ito; i++) {
					var v = _arr[i];
					if (v < r.min) {
						r.min = v;
						r.imin = i;
					} else if (v > r.max) {
						r.max = v;
						r.imax = i;
					}
				}

			}

			return r;
		},

		minmaxedge: function (_arr, _ifrom, _ito) {
			var r = {min: false, max: false, imin: false, imax: false};

			if (_arr.length > 0) {

				if (!_ifrom) _ifrom = 0;
				if (!_ito) _ito = _arr.length - 1;

				r.min = _arr[_ifrom];
				r.max = _arr[_ito];
				r.imin = _ifrom;
				r.imax = _ito;

			}

			return r;
		},

		compressNumber: function (_n) {
			var abs = Math.abs(_n);

			switch (true) {

				case (abs > 1000000000): // 1 000 000 000
					return (_n / 1000000000).toFixed(2) + 'B';

				case (abs > 1000000): // 1 000 000
					return (_n / 1000000).toFixed(2) + 'M';

				case (abs > 1000): // 1 000
					return (_n / 1000).toFixed(1) + 'K';

				default:
					return _n;

			}

		},

		formatNumber: function (_n) {

			var abs = Math.abs(_n);
			var n = abs.toFixed(0);
			var result = '';

			if (abs > 1 && n.length > 3) {
				result = _n < 0 ? '-' : '';
				for (var i = 0; i < n.length; i++) {
					result += n.charAt(i);
					if ((n.length - 1 - i) % 3 === 0) result += ' ';
				}
			}

			return result;
		},

		formatDate: function (_t, _day) {

			var oDate = new Date(_t);
			var result = '';

			if (_day) {
				result += loc.day[oDate.getDay()] + ', ';
			}

			return result += loc.month[oDate.getMonth()] + ' ' + oDate.getDate();
		},

		createElement: function (_parent, _tag, _classes, _attrs, _styles) {
			var el = document.createElement(_tag);

			if (_classes) el.classList.add(_classes);
			if (_attrs) {
				for (var attr in _attrs) {
					el.setAttribute(attr, _attrs[attr]);
				}
			}
			if (_styles) {
				for (var style in _styles) {
					el.style[style] = _styles[style]
				}
			}
			_parent.appendChild(el);

			return el;
		},

		addEventListener: function (_el, event, listener) {
			_el.addEventListener(event, listener, false);
		},

		removeEventListener: function (_el, event, listener) {
			_el.removeEventListener(event, listener);
		}

	};
	// \utilities

	// settings | states | sizes
	var s = {
		ratio: window.devicePixelRatio
	};
	// \sizes

	// elements
	var e = {
		h1: utl.createElement(_container, 'h1'),
		canvas: utl.createElement(_container, 'canvas'),
		controls: utl.createElement(_container, 'div', 'controls'),
		popup: utl.createElement(_container, 'div', 'popup', false, {'display': 'none'})
	};
	// \elements

	// draw?
	var draw = {
		all: false,
		main: true,
		axis_x: true,
		axis_y: true,
		preview: true
	};
	// \draw?

	// canvas
	var canvas = {
		bounds: {},
		width: 0,
		height: 0
	};
	var ctx = e.canvas.getContext('2d');

	// current theme
	var theme = {};

	// popup condition
	var popup = {
		title: ''
	};

	// mouse condition
	var mouse = {};

	// main chart params
	var main = {
		height: 0,
		width: 0,
		line: 1 * s.ratio,
		line_height: 45 * s.ratio,
		circle: 3 * s.ratio,
		font: 10 * s.ratio,
		font_family: 'Arial'
	};

	// preview params
	var preview = {
		height: 38 * s.ratio,
		mt: 32 * s.ratio,
		width: 0, // calc
		sensitivity: 20 * s.ratio
	};

	var range = {
		width: 9 * s.ratio,
		border: 2 * s.ratio
	};

	// axis params
	var axis = {
		x: {
			width: 30 * s.ratio,
			count: 6,
			marginv: 16 * s.ratio,
			name: null
		},
		y: {
			height: 45 * s.ratio,
			marginv: -5 * s.ratio,
			count: 6,
			names: [],
			types: [],
			min: 0,
			max: Number.MIN_VALUE
		}
	};

	// processed chart`s data
	var data = {
		x: {}, // column
		y: [] // []
	};


	// api
	this.switchTheme = function (_theme) {
		if (_theme && def.themes.hasOwnProperty(_theme)) {
			theme = def.themes[_theme];
			draw.all = true;
			return true;
		}
		return false;
	};
	this.setData = function (charts) {
		console.log('>setData');

		zero();

		for (var t in  charts.types) {
			switch (charts.types[t]) {

				case 'x':
					axis.x.name = charts.types[t];
					break;

				case 'line':
					axis.y.names.push(t);
					axis.y.types.push(charts.types[t]);
					break;

			}
		}

		for (var c = 0; c < charts.columns.length; c++) {

			var column = {};
			var column_name = charts.columns[c][0];

			switch (true) {

				// x
				case (axis.x.name === column_name):
					column = {
						name: column_name,
						display: true,
						data: charts.columns[c],
						length: charts.columns[c].length - 1,
						type: charts.types[column_name],
						min: charts.columns[c][1],
						max: charts.columns[c][charts.columns[c].length - 1]
					};
					data.x = column;
					break;

				// y
				case (axis.y.names.indexOf(column_name) !== -1):
					column = {
						code: column_name,
						name: charts.names[column_name],
						display: true,
						data: charts.columns[c],
						type: charts.types[column_name],
						length: charts.columns[c].length - 1,
						color: charts.colors[column_name]
					};
					var minmax = utl.minmax(charts.columns[c], 1);
					column.min = minmax.min;
					column.max = minmax.max;
					if (axis.y.min > column.min) axis.y.min = column.min;
					if (axis.y.max < column.max) axis.y.max = column.max;
					data.y.push(column);
					break;
			}

		}

		init();

	};
	// \api


	// common functions
	function initDom() {
		e.h1.innerText = _options.title ? _options.title : 'Chart';
	}

	function zeroDom() {
		// TODO remove all dom elements
	}

	function zeroData() {
		data.x = {};
		data.y = [];
	}

	function zero() {
		zeroData();
		zeroDom();
	}

	function init() {
		console.log('>init');
		initDom();
	}

	// \common functions


	// render
	function render(_t) {
		console.log('>render');

		resize();

		if (data) {

			if (draw.all) {
				draw.main = true;
				draw.preview = true;
				draw.all = false;
			}

			// TODO - tmp
			//ctx.rect(0, 0, canvas.width, canvas.height);
			//ctx.strokeStyle = '#ff0000';
			//ctx.stroke();

			if (draw.main) {
				renderMain();
				draw.main = true;
			}
			if (draw.preview) {
				renderPreview();
				draw.main = true;
			}

		}

		return;
		requestAnimationFrame(render);
	}

	function renderPreview() {
		ctx.clearRect(preview.rect[0], preview.rect[1], preview.rect[2], preview.rect[3]);
		// TODO - tmp
		ctx.fillStyle = '#d903ff';
		ctx.fillRect(preview.rect[0], preview.rect[1], preview.rect[2], preview.rect[3]);
	}

	function renderMain() {
		ctx.clearRect(main.rect[0], main.rect[1], main.rect[2], main.rect[3]);
		renderGrid();
		renderPaths();
	}

	function renderGrid() {

		calcAxisX();
		calcAxisY();

		renderLinesY();

		renderTextX();
		renderTextY();

	}

	function renderPaths() {

		for(var i in data.y){
			renderPath(data.y[i]);
		}

	}
	
	function renderPath(_path) {
		ctx.strokeStyle = _path.color;
		ctx.beginPath();
		ctx.lineJoin = 'bevel';
		ctx.lineCap = 'butt';

		console.log(axis.y);
		//var x = data.x[data.x.ifrom];
		//var y = data.x[data.y.ifrom];
		//context.moveTo(firstX * scaleX + offsetX, firstY * scaleY + offsetY);

	}

	function renderLinesY() {

		ctx.lineJoin = 'bevel';
		ctx.lineCap = 'butt';
		ctx.globalAlpha = 1;
		ctx.strokeStyle = theme.line;
		ctx.lineWidth = main.line;

		for (var i = 0; i < axis.y.count; i++) {

			var y = main.height - (axis.y.height * i);
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(main.width, y);
			ctx.stroke();

		}
	}

	function renderTextY() {
		console.log('>renderTextY');

		ctx.fillStyle = theme.text;
		ctx.font = main.font + 'px ' + main.font_family;

		for (var i = 0; i < axis.y.count; i++) {

			var y = main.height - (axis.y.height * i) + axis.y.marginv;
			var text = axis.y.min + axis.y.delta * i;

			ctx.fillText(utl.compressNumber(text, true), 0, y);

		}

	}

	function renderTextX() {
		console.log('>renderTextX');
		var verbose = false;
		var count = 0;
		var offset = main.width;

		ctx.fillStyle = theme.text;
		ctx.font = main.font + 'px ' + main.font_family;

		for (var i = data.x.ito; i >= data.x.ifrom; i -= axis.x.delta) {
			var value = data.x.data[i];
			if(!value) continue;
			if(count > 0){
				offset -= Math.round((axis.x.delta * axis.x.interval_width));
			}
			if(verbose) console.log('offset - '+offset);
			var x = Math.round(offset + (axis.x.width / 2));
			if(verbose) console.log('x - '+x);
			var y = main.height + axis.x.marginv;

			ctx.fillText(utl.formatDate(value, false), x,  y);
			count++;
		}

	}

	function resize() {
		console.log('>resize');

		canvas.bounds = e.canvas.getBoundingClientRect();
		var w = Math.round(canvas.bounds.width * s.ratio);
		var h = Math.round(canvas.bounds.height * s.ratio);

		if (canvas.width !== w && canvas.height !== h) {

			canvas.width = w;
			canvas.height = h;

			e.canvas.setAttribute('width', canvas.width);
			e.canvas.setAttribute('height', canvas.height);

			draw.all = true;
			calc();
		}

	}

	// \render


	// calculation
	function calc() { // - common data calculation without limits (from/to)

		main.height = canvas.height - preview.height - preview.mt;
		main.width = preview.width = canvas.width;

		main.rect = [
			0,
			0,
			main.width,
			main.height
		];

		preview.rect = [
			0,
			canvas.height - preview.height,
			main.width,
			preview.height
		];

	}

	function calcAxisX(){
		console.log('>calcAxisX');
		setXFromTo(1, null); // TODO - limit here
		axis.x.count = Math.max(1, Math.floor(canvas.width / (axis.x.width * 2)));
		axis.x.interval = Math.abs(data.x.data[2] - data.x.data[1]);
		axis.x.range = data.x.to - data.x.from;
		axis.x.irange = data.x.ito - data.x.ifrom;
		axis.x.interval_width = main.width / axis.x.irange;
		axis.x.delta = Math.floor(axis.x.range / axis.x.interval / axis.x.count);

		console.log('axis.x.count - '+axis.x.count);
		console.log('axis.x.range - '+axis.x.range);
		console.log('axis.x.irange - '+axis.x.irange);
		console.log('axis.x.interval - '+axis.x.interval);
		console.log('axis.x.delta - '+axis.x.delta);
		console.log('axis.x.interval_width - '+axis.x.interval_width);
	}

	function calcAxisY(){
		console.log('>calcAxisY');
		axis.y.count = Math.max(1, Math.floor(main.height / axis.y.height));
		axis.y.delta = Math.round(axis.y.max / axis.y.count);

		for(var i in data.y){
			if(data.y[i].display){
				data.y.minmax = utl.minmax(data.y[i].data, data.x.ifrom, data.x.ito);
			}
		}

	}

	function setXFromTo(_from, _to) {

		if (!_from) _from = 1;
		var minmax = utl.minmaxedge(data.x.data, _from, _to);

		data.x.from = minmax.min;
		data.x.ifrom = minmax.imin;
		data.x.to = minmax.max;
		data.x.ito = minmax.imax;

	}

	// \calculation


	// exe
	this.switchTheme(def.theme);
	this.setData(_data);
	requestAnimationFrame(render);

}
