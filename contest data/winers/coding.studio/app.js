var LIGHT_COLORS = {
    circleFill: '#ffffff',
    line: '#f2f4f5',
    zeroLine: '#ecf0f3',
    selectLine: '#dfe6eb',
    text: '#96a2aa',
    preview: '#eef2f5',
    previewAlpha: 0.8,
    previewBorder: '#b6cfe1',
    previewBorderAlpha: 0.5
};

var DARK_COLORS = {
    circleFill: '#242f3e',
    line: '#293544',
    zeroLine: '#313d4d',
    selectLine: '#3b4a5a',
    text: '#546778',
    preview: '#152435',
    previewAlpha: 0.8,
    previewBorder: '#5a7e9f',
    previewBorderAlpha: 0.5
};

var lightTheme = true;
var charts = [];

function onChangeTheme(e) {
    e = e || window.event;
    var target = e.target || e.srcElement;

    lightTheme = !lightTheme;
    if (lightTheme) {
        target.innerText = 'Switch to Night Mode';
        document.body.classList.remove('dark-theme');
    } else {
        target.innerText = 'Switch to Day Mode';
        document.body.classList.add('dark-theme');
    }
    for (var i in charts) {
        var chart = charts[i];
        chart.setColors(lightTheme ? LIGHT_COLORS : DARK_COLORS);
    }
}

var request = new XMLHttpRequest();
request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200) {
        document.body.removeChild(document.getElementById('preloader'));

        var data = JSON.parse(request.responseText);

        for (var i = 0; i < data.length; i++) {
            var d = data[i];
            var chartContainer = document.createElement('div');
            chartContainer.classList.add('tchart');
            document.getElementById('charts').appendChild(chartContainer);

            var h1 = document.createElement('h1');
            h1.innerText = 'Chart #' + i;
            chartContainer.appendChild(h1);

            var chart = new TChart(chartContainer);
            chart.setColors(LIGHT_COLORS);
            chart.setData(d);
            charts.push(chart);
        }
        document.getElementById('buttons').style.display = 'block';
    }
};
request.open('GET', 'chart_data.json', true);
request.send(null);
