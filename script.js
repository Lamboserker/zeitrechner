// --------------------------------------------
// script.js
// --------------------------------------------

let bundestageData;   // wird per fetch aus bundestage.json befüllt
let stundenChart;     // Chart.js-Instanz

// 1) DOM ready + bundestage.json laden
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const resp = await fetch('./bundestage.json');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        bundestageData = await resp.json();  // Jahres‑/Bundesland‑Mapping :contentReference[oaicite:1]{index=1}

        initApp();
    } catch (err) {
        console.error('Fehler beim Laden von bundestage.json:', err);
        document.getElementById('output').textContent =
            'Fehler beim Laden der Feiertagsdaten: ' + err.message;
    }
});

function initApp() {
    // 2) Defaults aus config.js (global window.config) nutzen :contentReference[oaicite:2]{index=2}
    const bundeslandSelect = document.getElementById("bundesland");
    // Falls du Länder‑Keys aus bundestageData statt config.feiertage nehmen willst:
    // Object.keys(bundestageData[new Date().getFullYear()])
    Object.keys(window.config.zuschlaege)  // Beispiel‑Init, passe nach Bedarf an
        .filter(k => ['WK', 'SA', 'SO', 'FT'].includes(k))
        .forEach(bl => {
            const opt = document.createElement('option');
            opt.value = bl;
            opt.textContent = bl;
            bundeslandSelect.appendChild(opt);
        });

    // Dark‑Mode‑Button binden
    const darkBtn = document.getElementById('darkModeBtn');
    if (darkBtn) {
        darkBtn.addEventListener('click', darkMode);
    }

    // Form‑Listener
    document.getElementById("arbeitszeitForm")
        .addEventListener("submit", onFormSubmit);

    // Optional: Reset‑/Input‑Handler, Default‑Times/Dates hier setzen…
}

// 3) Beim Absenden:
function onFormSubmit(e) {
    e.preventDefault();

    const start = new Date(document.getElementById("startDate").value);
    const end = new Date(document.getElementById("endDate").value);
    const bundesland = document.getElementById("bundesland").value;

    const intervals = {
        weekday: { start: document.getElementById("wd_start").value, end: document.getElementById("wd_end").value },
        saturday: { start: document.getElementById("sa_start").value, end: document.getElementById("sa_end").value },
        sunday: { start: document.getElementById("so_start").value, end: document.getElementById("so_end").value },
        holiday: { start: document.getElementById("ft_start").value, end: document.getElementById("ft_end").value }
    };

    const nightStart = parseTimeToMinutes(document.getElementById("night_start").value);
    const nightEnd = parseTimeToMinutes(document.getElementById("night_end").value);

    const results = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateCopy = new Date(d);
        const tag = formatDate(dateCopy);

        for (const kat of ["weekday", "saturday", "sunday", "holiday"]) {
            const times = intervals[kat];
            if (!times.start || !times.end) continue;

            const wd = dateCopy.getDay();
            const ft = isFeiertag(dateCopy, bundesland);
            const passt = (
                (kat === "weekday" && !ft && wd >= 1 && wd <= 5) ||
                (kat === "saturday" && !ft && wd === 6) ||
                (kat === "sunday" && !ft && wd === 0) ||
                (kat === "holiday" && ft)
            );
            if (!passt) continue;

            const startMin = parseTimeToMinutes(times.start);
            const endMin = parseTimeToMinutes(times.end);

            const buckMin = berechneZuschlaegeProMinute(
                startMin, endMin, dateCopy, bundesland, nightStart, nightEnd
            );
            for (const [bucket, minuten] of Object.entries(buckMin)) {
                results.push({
                    tag,
                    bucket,
                    totalMin: minuten,
                    nightMin: bucket.endsWith("_N") ? minuten : 0
                });
            }
        }
    }

    showResults(results);
}

// Hilfsfunktionen
function parseTimeToMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}
function formatDate(d) {
    return d.toISOString().split("T")[0];
}

// Feiertag prüfen gegen bundestageData
function isFeiertag(date, bundesland) {
    const y = date.getFullYear().toString();
    const iso = formatDate(date);
    return (
        bundestageData[y] &&
        Array.isArray(bundestageData[y][bundesland]) &&
        bundestageData[y][bundesland].includes(iso)
    );
}

// Zuschläge pro Minute berechnen (unverändert)
function berechneZuschlaegeProMinute(startMin, endMin, datum, bundesland, nightStartMin, nightEndMin) {
    const feiertag = isFeiertag(datum, bundesland);
    const wd = datum.getDay();
    const minutes = Array(1440).fill(null);
    const slots = (endMin >= startMin)
        ? [{ start: startMin, end: endMin }]
        : [{ start: startMin, end: 1440 }, { start: 0, end: endMin }];

    for (const { start, end } of slots) {
        for (let i = start; i < end; i++) {
            const labels = [];
            if (feiertag) labels.push("FT");
            else if (wd === 0) labels.push("SO");
            else if (wd === 6) labels.push("SA");
            else labels.push("WK");

            const isNight = nightEndMin > nightStartMin
                ? (i >= nightStartMin && i < nightEndMin)
                : (i >= nightStartMin || i < nightEndMin);
            if (isNight) labels.push(labels[0] + "_N");

            // höchsten Zuschlag wählen
            const max = labels.reduce((acc, l) => {
                const z = window.config.zuschlaege[l] || 0;
                return z > acc.zuschlag ? { bucket: l, zuschlag: z } : acc;
            }, { bucket: labels[0], zuschlag: window.config.zuschlaege[labels[0]] || 0 });
            minutes[i] = max.bucket;
        }
    }

    return minutes.reduce((res, b) => {
        if (b) res[b] = (res[b] || 0) + 1;
        return res;
    }, {});
}

// Ausgabe und Chart
function showResults(rows) {
    const out = document.getElementById("output");
    let html = "<table><tr><th>Datum</th><th>Bucket</th><th>Gesamt (h)</th><th>Nacht (h)</th></tr>";
    const sums = { WK: 0, SA: 0, SO: 0, FT: 0, N: 0 };

    rows.forEach(r => {
        html += `<tr><td>${r.tag}</td><td>${r.bucket}</td>
               <td>${(r.totalMin / 60).toFixed(2)}</td>
               <td>${(r.nightMin / 60).toFixed(2)}</td></tr>`;
        if (r.bucket.endsWith("_N")) sums.N += r.totalMin;
        else sums[r.bucket] = (sums[r.bucket] || 0) + r.totalMin;
    });
    html += "</table><h3>Summen:</h3><ul>";
    Object.entries(sums).forEach(([k, v]) => {
        html += `<li>${k}: ${(v / 60).toFixed(2)} Std</li>`;
    });
    html += "</ul>";
    out.innerHTML = html;

    // Chart.js-Pie
    const ctx = document.getElementById("stundenChart").getContext("2d");
    if (stundenChart) stundenChart.destroy();
    stundenChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Werktag', 'Samstag', 'Sonntag', 'Feiertag', 'Nacht'],
            datasets: [{
                data: [
                    sums.WK / 60, sums.SA / 60, sums.SO / 60, sums.FT / 60, sums.N / 60
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.label}: ${ctx.parsed.toFixed(2)} Std`
                    }
                }
            }
        }
    });
}

function darkMode() {
    // Nur noch Klasse togglen
    document.body.classList.toggle('dark-mode');
}
