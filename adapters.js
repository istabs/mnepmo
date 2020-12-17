// An AirTable table adapter for Google Charts
function mneAdapter(airtableData, presenter) {
	var rows = []
	airtableData.records.forEach(item => {
		if (item.fields["Sumário"]) {
			var fim = new Date(item.fields["Fim"])
			fim.setDate(fim.getDate() + 1)
			deps = ""
			if (item.fields["Predecessor"])
				item.fields["Predecessor"].forEach(pred => deps += "," + pred)
			deps = deps.substring(1)
			rows.push([
				item.id, // Task ID
				item.fields["Atividade"], // Task Name
				item.fields["Classificação"],
				new Date(item.fields["Inicio"]), // Start Date
				fim, // End Date
				0, // Duration
				item.fields["Progresso"], // Percent Complete
				deps, // Dependencies
			]);
		}
	});
	presenter(rows);
}

// An AirTable table adapter for Google Charts
function detailsAdapter(id, airtableData, presenter, options={chart_subtitle: 'chart_subtitle'}) {
	var rows = []
	var classificacao = ""
	var summary = ""
	var classifications = {}
	const SUMARIO = ': Sumário'
	airtableData.records.forEach(item => {
		if (item.id === id) {
			classificacao = item.fields["Classificação"];
			if (item.fields && item.fields["Atividade"] && item.fields["Atividade"].includes(SUMARIO)) {
				document.getElementById(options.chart_subtitle).textContent = item.fields["Atividade"].replace(SUMARIO,'');
				summary = item.id
			}
		}
		classifications[item.id] = item.fields.Atividade;
	})
	airtableData.records.forEach(item => {
		if (item.id === id || (item.fields["Classificação"] && item.fields["Classificação"] === classificacao)) {
			if (item.fields.Inicio && item.fields.Fim) {
				let fim = new Date(item.fields["Fim"])
				fim.setDate(fim.getDate() + 1)
				let classification = '';
				if (item.fields.Predecessores && item.fields.Predecessores[0]) {
					classification = classifications[item.fields.Predecessores[0]]
					if (classification.includes(SUMARIO)) {
						classification = classifications[item.id]
					}
				}
				rows.push([
					item.id, // Task ID
					item.fields["Atividade"], // Task Name
					classification,
					new Date(item.fields["Inicio"]), // Start Date
					fim, // End Date
					0, // Duration
					item.fields["Progresso"], // Percent Complete
					null, // Dependencies
				]);
			} else {
				console.log('missing date on ' + item.id + ', ' + item.fields.Atividade)
			}
		}
	});
	presenter(rows);
}

// An AirTable table adapter for Google Charts
function prrAdapter(airtableData, presenter) {
	var rows = []
	airtableData.records.forEach(item => {
		var fim = new Date(item.fields["Fim"])
		fim.setDate(fim.getDate() + 1)
		rows.push([
			item.id, // Task ID
			item.fields["Projeto"], // Task Name
			item.fields["Criticidade"], // Group (string)
			new Date(item.fields["Inicio"]), // Start Date
			fim, // End Date
			0, // Duration (number)
			0, // Percent Complete (number)
			null, // Dependencies (string / comma separated)
		]);
	});
	presenter(rows);
}

// An AirTable table adapter for Google Charts
function integratedAdapter(airtableData, presenter) {
	var rows = []
	airtableData.records.sort((a, b) => Date.parse(a.fields.Inicio[0]) - Date.parse(b.fields.Inicio[0])).forEach(item => {
		if (item.fields["Sumário"]) {
			var preds = item.fields.Predecessores ? item.fields.Predecessores[0] : null;
			var fim = new Date(item.fields["Fim"])
			fim.setDate(fim.getDate() + 1)
			if (item.fields.Inicio && item.fields.Fim) {
				rows.push([
					item.id, // Task ID
					item.fields["Atividade"], // Task Name
					item.fields["Classificação"], // Group (string)
					new Date(item.fields["Inicio"]), // Start Date
					fim, // End Date
					0, // Duration (number)
					0, // Percent Complete (number)
					preds, // Dependencies (string / comma separated)
				]);
			}
		}
	});
	presenter(rows);
}

var firebaseRead = false;
var authorization = ""
var projectKey = ""

function fbCache(stuff, ...params) {
	if (firebaseRead) {
		stuff(params);
	} else {
		var dbRef = firebase.database().ref("/mne-pmo");
		dbRef.once('value', snap => {
			firebaseRead = true;
			authorization = snap.child('data').child('authorization').val();
			projectKey = snap.child('data').child('projectKey').val();
			stuff(params);
		});
	}
}

// An AirTable table adapter for Google Charts
function execucaoAdapter(airtableData, presenter) {
	fbCache(() => 
		$.ajax({
			url: target.resourcesUrl,
			beforeSend: function (xhr) {
				xhr.setRequestHeader("Authorization", authorization)
			},
			success: function (rawData) {
				prr = {};
				rawData.records.forEach(item => prr[item.id] = item.fields.Projeto);
				var rows = []
				airtableData.records
							.sort((a, b) => Date.parse(a.fields.Inicio[0]) - Date.parse(b.fields.Inicio[0]))
							.sort((a, b) => Date.parse(a.fields.Grupo) - Date.parse(b.fields.Grupo))
							.forEach(item => {
					var fim = new Date(item.fields["Fim"])
					var preds = item.fields['Finish-Start'] ? item.fields['Finish-Start'][0] : null;
					fim.setDate(fim.getDate() + 1)
					rows.push([
						item.id, // Task ID
						item.fields["Projeto"], // Task Name
						prr[item.fields["PRR"][0]], // Group (string)
						new Date(item.fields["Inicio"]), // Start Date
						fim, // End Date
						null, // Duration (number)
						0, // Percent Complete (number)
						preds, // Dependencies (string / comma separated)
					]);
				});
				presenter(rows);
			}
		})
	, airtableData, presentGantt)
}

// An AirTable table adapter for Google Charts
function contratacaoAdapter(airtableData, presenter) {
	fbCache(() => 
		$.ajax({
			url: target.resourcesUrl,
			beforeSend: function (xhr) {
				xhr.setRequestHeader("Authorization", authorization)
			},
			success: function (rawData) {
				resources = {};
				rawData.records.forEach(item => resources[item.id] = item.fields.Procedimento);
				var rows = []
				airtableData.records.sort((a, b) => a.fields.Inicio[0] < b.fields.Inicio[0]).forEach(item => {
					var fim = new Date(item.fields["Fim"])
					fim.setDate(fim.getDate() + 1)
					rows.push([
						item.id, // Task ID
						item.fields["Projeto"], // Task Name
						resources[item.fields["Procedimento"][0]], // Group (string)
						new Date(item.fields["Inicio"]), // Start Date
						fim, // End Date
						null, // Duration (number)
						item.fields["Progresso"], // Percent Complete
						null, // Dependencies (string / comma separated)
					]);
				});
				presenter(rows);
			}
		})
	, airtableData, presentGantt)
}

function resetChart(ganttTag, chrtOptions={chart: 'chart', chart_title: 'chart_title', chart_subtitle: 'chart_subtitle', }) {
	fbCache(() => {

		setMenu(ganttTag)

		if (target && target.title) {
			document.getElementById(chrtOptions.chart_title).textContent = target.title + (target.subtitle ? " - " + target.subtitle : "");
			document.getElementById(chrtOptions.chart_subtitle).textContent = "";
			document.getElementById(chrtOptions.chart).innerHTML = "";
		}
		let url = target.url;
		$.ajax({
			url: url,
			beforeSend: function (xhr) {
				xhr.setRequestHeader("Authorization", authorization)
			},
			success: function (rawData) {
				if (rawData.offset) {
					let newUrl = url + '?offset=' + rawData.offset
					$.ajax({
						url: newUrl,
						beforeSend: function (xhr) {
							xhr.setRequestHeader("Authorization", authorization)
						},
						success: function (rawData1) {
							const HTML_POSITION = chrtOptions.chart;
							
							rawData1.records.forEach((record) => {
								rawData.records.push(record)
							})

							var gantt = {
								sortTasks: true,
								criticalPathEnabled: false,
								criticalPathStyle: { strokeWidth: 0, stroke: '#e64a19', },
								arrow: { width: 0, radius: 10, length: 0, spaceAfter: -275, },
							};
							if (target.palette) gantt['palette'] = target.palette;
			
							var options = {gantt: gantt, height: target.height, width: 960, };
			
							var presenter = _.partial(presentGantt, HTML_POSITION, options, rawData);
							google.charts.setOnLoadCallback(() => googleChartAirtableAdapt(rawData, target.adapt, presenter));	
						}
					})
				} else {
					const HTML_POSITION = chrtOptions.chart;

					var gantt = {
						sortTasks: true,
						criticalPathEnabled: false,
						criticalPathStyle: { strokeWidth: 0, stroke: '#e64a19', },
						arrow: { width: 0, radius: 10, length: 0, spaceAfter: -275, },
					};
					if (target.palette) gantt['palette'] = target.palette;
	
					var options = {gantt: gantt, height: target.height, width: 960, };
	
					var presenter = _.partial(presentGantt, HTML_POSITION, options, rawData);
					google.charts.setOnLoadCallback(() => googleChartAirtableAdapt(rawData, target.adapt, presenter));	
				}
			}
		})
	})
}
