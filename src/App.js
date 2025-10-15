// App.js (paste this entire file content or the component into your project)
import React, { useState, useRef, useEffect } from "react";

/*
  Itinerary Builder - Single-file React component (improved styling & PDF export)
  - Embedded CSS (Poppins) to match Vigovia Figma theme (purple / white)
  - Long-scroll preview that will be exported to PDF and split into A4 pages
  - PDF handling with html2canvas + jspdf and vertical slicing for multi-page export

  Install: npm install html2canvas jspdf
*/

export default function ItineraryBuilder() {
  const [meta, setMeta] = useState({
    title: "Singapore Itinerary",
    client: "Rahul",
    duration: 4,
    travelers: 2,
    departure: "Delhi (DEL)",
    arrival: "Singapore (SIN)",
    startDate: "2024-07-25",
    endDate: "2024-07-28",
    notes: "Thanks for choosing Vigovia. Have a great trip!",
  });

  const makeEmptyDay = (dayIndex) => ({
    id: Date.now() + Math.random(),
    dayIndex,
    date: "",
    morning: "",
    afternoon: "",
    evening: "",
    transport: "",
    hotels: [],
  });

  const [days, setDays] = useState(() => {
    const arr = [];
    for (let i = 1; i <= 3; i++) arr.push(makeEmptyDay(i));
    return arr;
  });

  const [payments, setPayments] = useState([
    { id: 1, amount: "70000", dueDate: "2024-06-01" },
  ]);

  const [inclusions, setInclusions] = useState([
    "Accommodation",
    "Daily Breakfast",
    "Sightseeing (as per itinerary)",
  ]);
  const [exclusions, setExclusions] = useState([
    "Personal expenses",
    "Visa fees unless mentioned",
  ]);

  const previewRef = useRef(null);

  // load Google Font (Poppins) once
  useEffect(() => {
    const id = "vigovia-poppins";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  function addDay() {
    setDays((d) => [...d, makeEmptyDay(d.length + 1)]);
  }
  function removeDay(id) {
    setDays((d) => d.filter((x) => x.id !== id));
  }
  function updateDay(id, key, value) {
    setDays((d) => d.map((x) => (x.id === id ? { ...x, [key]: value } : x)));
  }
  function addPayment() {
    setPayments((p) => [...p, { id: Date.now(), amount: "", dueDate: "" }]);
  }
  function updatePayment(id, key, val) {
    setPayments((p) => p.map((x) => (x.id === id ? { ...x, [key]: val } : x)));
  }
  function removePayment(id) {
    setPayments((p) => p.filter((x) => x.id !== id));
  }

  // PDF generation: render preview to canvas and split into A4 pages in mm
  async function generatePDF() {
    const [{ default: html2canvas }, jsPdfModule] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const { jsPDF } = jsPdfModule;

    const input = previewRef.current;
    if (!input) return;

    // Render at scale for better quality
    const scale = 2; // increase for higher DPI if needed
    const canvas = await html2canvas(input, { scale, useCORS: true, logging: false });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // A4 size in mm
    const a4WidthMm = 210;
    const a4HeightMm = 297;

    // Convert px to mm: px * 25.4 / dpi. We'll assume 96 dpi for the canvas.
    const pxToMm = (px) => (px * 25.4) / 96;

    const imgWidthMm = pxToMm(canvas.width);
    const imgHeightMm = pxToMm(canvas.height);

    // Scale factor to fit width to A4 width
    const scaleFactor = a4WidthMm / imgWidthMm;
    const scaledImgHeightMm = imgHeightMm * scaleFactor;

    const pdf = new jsPDF({ unit: "mm", format: "a4" });

    // If image fits on one page
    if (scaledImgHeightMm <= a4HeightMm) {
      pdf.addImage(imgData, "JPEG", 0, 0, a4WidthMm, scaledImgHeightMm);
    } else {
      // Slice image vertically per page
      const canvasPageHeightPx = Math.floor((a4HeightMm / scaleFactor) * (96 / 25.4));

      let position = 0;
      while (position < canvas.height) {
        // create temporary canvas for each page slice
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(canvasPageHeightPx, canvas.height - position);
        const ctx = pageCanvas.getContext("2d");
        ctx.drawImage(
          canvas,
          0,
          position,
          canvas.width,
          pageCanvas.height,
          0,
          0,
          canvas.width,
          pageCanvas.height
        );

        const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
        const pageImgHeightMm = pxToMm(pageCanvas.height) * scaleFactor;

        pdf.addImage(pageImgData, "JPEG", 0, 0, a4WidthMm, pageImgHeightMm);
        position += pageCanvas.height;
        if (position < canvas.height) pdf.addPage();
      }
    }

    pdf.save(`${(meta.title || "itinerary").replace(/\s+/g, "_")}.pdf`);
  }

  // helper small UI prompt for quick edits (keeps file small/simple)
  const quickEdit = (d, field) => {
    const value = prompt(`Enter ${field} for Day ${d.dayIndex}`, d[field] || "");
    if (value !== null) updateDay(d.id, field, value);
  };

  return (
    <div className="itb-root">
      <style>{`
        :root{
          --violet: #6b2f9b; /* Vigovia primary */
          --violet-dark: #5a1780;
          --muted: #6b7280;
          --bg: #f8fafc;
          --card: #ffffff;
          --accent: #efe5fb;
          font-family: 'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
        }
        .itb-root{padding:28px;background:var(--bg);min-height:100vh}
        .itb-wrap{max-width:960px;margin:0 auto;display:flex;gap:20px}
        .itb-panel{width:320px;background:var(--card);padding:20px;border-radius:12px;box-shadow:0 6px 18px rgba(22,23,24,0.06)}
        .itb-preview{flex:1;background:var(--card);padding:26px;border-radius:12px;box-shadow:0 6px 18px rgba(22,23,24,0.06)}

        .itb-h-brand{color:var(--violet);font-weight:700;letter-spacing:1px}
        .itb-title{font-size:22px;font-weight:700;margin-top:6px}
        .itb-sub{color:var(--muted);font-size:13px;margin-top:4px}

        /* Preview styles (this is the content that will be exported to PDF) */
        .preview-card{background:linear-gradient(180deg,#fff,#fff);padding:28px;border-radius:10px}
        .preview-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1e9fb;padding-bottom:18px}
        .preview-left{display:flex;flex-direction:column}
        .preview-right{text-align:right;color:var(--muted);font-size:13px}
        .trip-title{font-size:20px;font-weight:700;color:#2b2540}
        .trip-meta{color:var(--muted);font-size:13px;margin-top:6px}

        .day-card{display:flex;gap:18px;padding:18px;border-radius:10px;background:linear-gradient(90deg,var(--accent),#fff);border:1px solid rgba(107,47,155,0.06)}
        .day-label{width:96px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
        .day-badge{background:var(--violet);color:white;padding:8px 12px;border-radius:8px;font-weight:600}
        .day-content{flex:1}
        .day-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:8px}
        .info-title{font-size:12px;font-weight:600;color:#332a48}
        .info-text{font-size:13px;color:#3c3a4a;margin-top:6px}

        .section-title{font-size:15px;font-weight:700;margin-top:22px;color:#31283d}
        .divider{height:1px;background:#f1e9fb;margin-top:14px}

        table.itb-table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}
        table.itb-table th{font-weight:700;text-align:left;padding:10px 6px}
        table.itb-table td{padding:8px 6px;color:#3b3b45}

        .inclusion-box{display:flex;gap:10px}
        .inclusion-list{flex:1}

        .cta{display:flex;justify-content:center;margin-top:22px}
        .btn-primary{background:var(--violet);color:#fff;padding:10px 18px;border-radius:8px;border:none;font-weight:600}

        /* small inputs in left panel */
        .left-row{margin-top:10px}
        input[type=text], input[type=date], input[type=number], textarea{width:100%;padding:8px;border:1px solid #e6e6ea;border-radius:8px;font-size:14px}
        textarea{min-height:70px}

        /* responsive */
        @media (max-width:980px){
          .itb-wrap{flex-direction:column}
          .itb-panel{width:100%}
        }
      `}</style>

      <div className="itb-wrap">
        <div className="itb-panel">
          <div className="itb-h-brand">VIGOVIA</div>
          <div className="itb-title">Itinerary Builder</div>
          <div className="itb-sub">Create your tour & export PDF matching the Figma style</div>

          <div className="left-row">
            <label className="text-sm">Trip Title</label>
            <input
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            />
          </div>

          <div className="left-row" style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label className="text-sm">Duration</label>
              <input
                type="number"
                value={meta.duration}
                onChange={(e) =>
                  setMeta({ ...meta, duration: Number(e.target.value) })
                }
              />
            </div>
            <div style={{ width: 90 }}>
              <label className="text-sm">Pax</label>
              <input
                type="number"
                value={meta.travelers}
                onChange={(e) =>
                  setMeta({ ...meta, travelers: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="left-row">
            <label className="text-sm">Departure / Arrival</label>
            <input
              value={`${meta.departure} → ${meta.arrival}`}
              onChange={(e) => {
                const split = e.target.value.split("→").map((s) => s.trim());
                setMeta({
                  ...meta,
                  departure: split[0] || meta.departure,
                  arrival: split[1] || meta.arrival,
                });
              }}
            />
          </div>

          <div className="left-row" style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label className="text-sm">Start Date</label>
              <input
                type="date"
                value={meta.startDate}
                onChange={(e) => setMeta({ ...meta, startDate: e.target.value })}
              />
            </div>
            <div style={{ width: 140 }}>
              <label className="text-sm">End Date</label>
              <input
                type="date"
                value={meta.endDate}
                onChange={(e) => setMeta({ ...meta, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="left-row">
            <label className="text-sm">Inclusions (comma separated)</label>
            <input
              value={inclusions.join(", ")}
              onChange={(e) =>
                setInclusions(e.target.value.split(",").map((s) => s.trim()))
              }
            />
          </div>
          <div className="left-row">
            <label className="text-sm">Exclusions (comma separated)</label>
            <input
              value={exclusions.join(", ")}
              onChange={(e) =>
                setExclusions(e.target.value.split(",").map((s) => s.trim()))
              }
            />
          </div>

          <div className="left-row">
            <label className="text-sm">Payments</label>
            {payments.map((p) => (
              <div
                key={p.id}
                style={{ display: "flex", gap: 8, marginTop: 8 }}
              >
                <input
                  placeholder="Amount"
                  value={p.amount}
                  onChange={(e) => updatePayment(p.id, "amount", e.target.value)}
                />
                <input
                  type="date"
                  value={p.dueDate}
                  onChange={(e) => updatePayment(p.id, "dueDate", e.target.value)}
                />
                <button
                  onClick={() => removePayment(p.id)}
                  style={{
                    background: "#ff6b6b",
                    color: "#fff",
                    border: "none",
                    padding: "8px 10px",
                    borderRadius: 8,
                  }}
                >
                  Del
                </button>
              </div>
            ))}
            <div style={{ marginTop: 8 }}>
              <button
                onClick={addPayment}
                style={{
                  width: "100%",
                  background: "var(--violet)",
                  color: "#fff",
                  padding: "10px",
                  borderRadius: 8,
                  border: "none",
                }}
              >
                Add Installment
              </button>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button
              onClick={addDay}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                border: "none",
                background: "#10b981",
                color: "white",
              }}
            >
              Add Day
            </button>
            <button
              onClick={generatePDF}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                border: "none",
                background: "var(--violet)",
                color: "white",
              }}
            >
              Export PDF
            </button>
          </div>
        </div>

        <div className="itb-preview">
          <div className="preview-card" ref={previewRef} id="itinerary-preview">
            <div className="preview-header">
              <div className="preview-left">
                <div className="itb-h-brand">VIGOVIA</div>
                <div className="trip-title">Hi, {meta.client} — {meta.title}</div>
                <div className="trip-meta">
                  {meta.duration} days • {meta.travelers} pax • {meta.startDate} to {meta.endDate}
                </div>
              </div>
              <div className="preview-right">
                <div style={{ fontWeight: 700, color: "var(--violet)" }}>
                  {meta.departure} → {meta.arrival}
                </div>
                <div style={{ marginTop: 8 }}>{meta.notes}</div>
              </div>
            </div>

            {/* Days */}
            <div style={{ marginTop: 18 }}>
              {days.map((d, idx) => (
                <div key={d.id} style={{ marginBottom: 12 }}>
                  <div className="day-card">
                    <div className="day-label">
                      <div className="day-badge">Day {idx + 1}</div>
                      <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
                        {d.date || meta.startDate}
                      </div>
                      <button
                        onClick={() => removeDay(d.id)}
                        style={{
                          marginTop: 8,
                          background: "transparent",
                          color: "#e11d48",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="day-content">
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div className="info-title">Morning</div>
                          <div className="info-text">{d.morning || "—"}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="info-title">Afternoon</div>
                          <div className="info-text">{d.afternoon || "—"}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="info-title">Evening</div>
                          <div className="info-text">{d.evening || "—"}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div className="info-title">Transport</div>
                          <div className="info-text">{d.transport || "—"}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="info-title">Hotels</div>
                          <div className="info-text">
                            {d.hotels.length ? d.hotels.map((h, i) => (
                              <div key={i}>{h.name} ({h.city})</div>
                            )) : "—"}
                          </div>
                        </div>
                        <div style={{ width: 150, textAlign: "right" }}>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>Actions</div>
                          <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                            <button
                              onClick={() => quickEdit(d, "morning")}
                              style={{
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: "none",
                                background: "var(--violet)",
                                color: "white",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => quickEdit(d, "transport")}
                              style={{
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: "1px solid #e6e6ea",
                                background: "white",
                              }}
                            >
                              Transport
                            </button>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                        <input
                          type="date"
                          value={d.date}
                          onChange={(e) => updateDay(d.id, "date", e.target.value)}
                        />
                        <button
                          onClick={() => {
                            const name = prompt("Hotel name") || "";
                            const city = prompt("City") || "";
                            const checkIn = prompt("Check-in (YYYY-MM-DD)") || "";
                            const checkOut = prompt("Check-out (YYYY-MM-DD)") || "";
                            const nights = prompt("Nights") || 1;
                            if (name) {
                              setDays((ds) =>
                                ds.map((x) =>
                                  x.id === d.id
                                    ? { ...x, hotels: [...x.hotels, { name, city, checkIn, checkOut, nights }] }
                                    : x
                                )
                              );
                            }
                          }}
                          style={{
                            background: "#10b981",
                            color: "white",
                            border: "none",
                            padding: "8px 12px",
                            borderRadius: 8,
                          }}
                        >
                          Add Hotel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="divider" />

            <div>
              <div className="section-title">Flight Summary</div>
              <div style={{ display: "flex", gap: 12, marginTop: 10, color: "#4b4460" }}>
                <div>Depart: {meta.startDate} — {meta.departure} → {meta.arrival}</div>
                <div>Return: {meta.endDate} — {meta.arrival} → {meta.departure}</div>
                <div>Airline: Example Air</div>
              </div>
            </div>

            <div className="divider" />

            <div>
              <div className="section-title">Hotel Bookings</div>
              <table className="itb-table">
                <thead>
                  <tr><th>Hotel</th><th>City</th><th>Check-in</th><th>Check-out</th><th>Nights</th></tr>
                </thead>
                <tbody>
                  {days.flatMap((d) => d.hotels).map((h, i) => (
                    <tr key={i}><td>{h.name}</td><td>{h.city}</td><td>{h.checkIn}</td><td>{h.checkOut}</td><td>{h.nights}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divider" />

            <div style={{ display: "flex", gap: 18 }}>
              <div style={{ flex: 1 }}>
                <div className="section-title">Inclusions</div>
                <ul style={{ marginTop: 8 }}>
                  {inclusions.map((inc, i) => <li key={i} style={{ color: '#3b3850' }}>{inc}</li>)}
                </ul>
              </div>
              <div style={{ flex: 1 }}>
                <div className="section-title">Exclusions</div>
                <ul style={{ marginTop: 8 }}>
                  {exclusions.map((exc, i) => <li key={i} style={{ color: '#3b3850' }}>{exc}</li>)}
                </ul>
              </div>
            </div>

            <div className="divider" />

            <div style={{ marginTop: 12 }}>
              <div className="section-title">Payment Plan</div>
              <table className="itb-table">
                <thead><tr><th>Installment</th><th>Amount</th><th>Due Date</th></tr></thead>
                <tbody>
                  {payments.map((p, idx) => (
                    <tr key={p.id}><td>#{idx + 1}</td><td>₹ {p.amount}</td><td>{p.dueDate}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divider" />

            <div style={{ marginTop: 12, textAlign: "center" }}>
              <div style={{ color: "#6b687a", fontSize: 13 }}>{meta.notes}</div>
              <div className="cta"><button className="btn-primary" onClick={generatePDF}>PLAN. PACK. GO!</button></div>
            </div>
          </div>

          {/* Quick editor area below preview for fast day input */}
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            {days.map((d) => (
              <div
                key={d.id}
                style={{ flex: 1, padding: 10, borderRadius: 8, background: "#fff", border: "1px solid #f1e9fb" }}
              >
                <div style={{ fontWeight: 700 }}>Day {days.indexOf(d) + 1}</div>
                <input placeholder="Morning" value={d.morning} onChange={(e) => updateDay(d.id, "morning", e.target.value)} style={{ marginTop: 8 }} />
                <input placeholder="Afternoon" value={d.afternoon} onChange={(e) => updateDay(d.id, "afternoon", e.target.value)} style={{ marginTop: 8 }} />
                <input placeholder="Evening" value={d.evening} onChange={(e) => updateDay(d.id, "evening", e.target.value)} style={{ marginTop: 8 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
