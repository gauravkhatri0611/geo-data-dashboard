// src/App.js
import React, { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export default function App() {
  const [earthquakes, setEarthquakes] = useState([]);
  const [selectedMagRange, setSelectedMagRange] = useState(null);
  const [xAxis, setXAxis] = useState("mag");
  const [yAxis, setYAxis] = useState("depth");
  const scatterChartRef = useRef(null);
  const barChartRef = useRef(null);
  console.log(earthquakes, "earthquakes");

  useEffect(() => {
    fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
    )
      .then((res) => res.json())
      .then((data) => {
        setEarthquakes(
          data.features.map((f) => ({
            id: f.id,
            place: f.properties.place,
            mag: f.properties.mag,
            depth: f.geometry.coordinates[2],
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0],
            time: f.properties.time,
          }))
        );
        console.log(data.features, "data");
      });
  }, []);

  const magRanges = [
    { label: "0-1", min: 0, max: 1 },
    { label: "1-2", min: 1, max: 2 },
    { label: "2-3", min: 2, max: 3 },
    { label: "3-4", min: 3, max: 4 },
    { label: "4-5", min: 4, max: 5 },
    { label: "5+", min: 5, max: 10 },
  ];

  // Bar Chart Setup
  useEffect(() => {
    if (!barChartRef.current) return;

    const ctx = barChartRef.current.getContext("2d");

    const counts = magRanges.map(
      ({ min, max }) =>
        earthquakes.filter((eq) => eq.mag >= min && eq.mag < max).length
    );

    if (Chart.getChart(barChartRef.current)) {
      Chart.getChart(barChartRef.current).destroy();
    }

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: magRanges.map((r) => r.label),
        datasets: [
          {
            label: "Number of Earthquakes",
            data: counts,
            backgroundColor: "rgba(75,192,192,0.6)",
          },
        ],
      },
      options: {
        onClick: (e, elements) => {
          if (!elements.length) {
            setSelectedMagRange(null);
            return;
          }
          const index = elements[0].index;
          setSelectedMagRange(magRanges[index]);
        },
      },
    });
  }, [earthquakes, magRanges]);

  // Scatter Plot Setup
  useEffect(() => {
    if (!scatterChartRef.current) return;

    const ctx = scatterChartRef.current.getContext("2d");

    const scatterData = earthquakes
      .filter(
        (eq) => typeof eq[xAxis] === "number" && typeof eq[yAxis] === "number"
      )
      .map((eq) => ({
        x: eq[xAxis],
        y: eq[yAxis],
        label: eq.place,
      }));

    if (Chart.getChart(scatterChartRef.current)) {
      Chart.getChart(scatterChartRef.current).destroy();
    }

    new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          {
            label: `${yAxis} vs ${xAxis}`,
            data: scatterData,
            backgroundColor: "rgba(255, 99, 132, 0.6)",
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: { display: true, text: xAxis },
          },
          y: {
            title: { display: true, text: yAxis },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const point = scatterData[ctx.dataIndex];
                return `${point.label} | ${xAxis}: ${point.x}, ${yAxis}: ${point.y}`;
              },
            },
          },
        },
      },
    });
  }, [earthquakes, xAxis, yAxis]);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Earthquake Data Dashboard</h1>

      {/* Bar Chart */}
      <div style={{ maxWidth: 600, marginBottom: 30 }}>
        <canvas ref={barChartRef}></canvas>
        {selectedMagRange && (
          <p>
            Filtering by magnitude:{" "}
            <b>
              {selectedMagRange.min} - {selectedMagRange.max}
            </b>{" "}
            <button onClick={() => setSelectedMagRange(null)}>Clear</button>
          </p>
        )}
      </div>

      {/* Responsive Two-Panel Layout */}
      <div style={{ display: "flex", gap: 20, height: "60vh" }}>
        {/* Scatter Plot Panel */}
        <div style={{ flex: 1 }}>
          <h2>Scatter Plot</h2>
          <div>
            <label>
              X-Axis:
              <select
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
                style={{ marginLeft: 10 }}
              >
                <option value="mag">Magnitude</option>
                <option value="depth">Depth</option>
                <option value="lat">Latitude</option>
                <option value="lon">Longitude</option>
              </select>
            </label>
            <label style={{ marginLeft: 20 }}>
              Y-Axis:
              <select
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                style={{ marginLeft: 10 }}
              >
                <option value="depth">Depth</option>
                <option value="mag">Magnitude</option>
                <option value="lat">Latitude</option>
                <option value="lon">Longitude</option>
              </select>
            </label>
          </div>
          <canvas ref={scatterChartRef} style={{ marginTop: 20 }}></canvas>
        </div>

        {/* Data Table Panel */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            border: "1px solid #ccc",
            padding: 10,
          }}
        >
          <h2>Data Table</h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.9rem",
            }}
          >
            <thead style={{ backgroundColor: "#f0f0f0" }}>
              <tr>
                <th>Place</th>
                <th>Magnitude</th>
                <th>Depth</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {earthquakes.map((eq) => (
                <tr key={eq.id}>
                  <td>{eq.place}</td>
                  <td>{eq.mag}</td>
                  <td>{eq.depth}</td>
                  <td>{new Date(eq.time).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
