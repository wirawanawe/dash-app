"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import * as XLSX from "xlsx";

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [facilityCode, setFacilityCode] = useState("");
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { start: fmt(start), end: fmt(end) };
  });
  const [clinics, setClinics] = useState([]);
  const [visitsRows, setVisitsRows] = useState([]);
  const [diagnosisRows, setDiagnosisRows] = useState([]);
  const [employeeStatus, setEmployeeStatus] = useState(""); // Filter for employee status

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/clinics?limit=10000');
        if (res.ok) {
          const data = await res.json();
          setClinics(data.data || []);
        }
      } catch {}
    })();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      sp.append('start', period.start);
      sp.append('end', period.end);
      if (facilityCode) sp.append('facility_code', facilityCode);
      if (employeeStatus) sp.append('employee_status', employeeStatus);

      const [visitsRes, diagRes] = await Promise.all([
        fetch(`/api/reports/visits-per-month?${sp.toString()}`),
        fetch(`/api/reports/diagnoses-per-month?${sp.toString()}`)
      ]);
      if (!visitsRes.ok) throw new Error('Gagal mengambil report kunjungan');
      if (!diagRes.ok) throw new Error('Gagal mengambil report diagnosis');
      const visitsJson = await visitsRes.json();
      const diagJson = await diagRes.json();
      if (!visitsJson.success) throw new Error(visitsJson.message || 'Report kunjungan gagal');
      if (!diagJson.success) throw new Error(diagJson.message || 'Report diagnosis gagal');
      setVisitsRows(visitsJson.data || []);
      setDiagnosisRows(diagJson.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityCode, period.start, period.end, employeeStatus]);

  const monthsInRange = useMemo(() => {
    const s = new Date(period.start);
    const e = new Date(period.end);
    const out = [];
    const d = new Date(s.getFullYear(), s.getMonth(), 1);
    while (d <= e) {
      out.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
      });
      d.setMonth(d.getMonth() + 1);
    }
    return out;
  }, [period]);

  const visitsPivot = useMemo(() => {
    // Pivot: rows = facilityName, columns = month, value = count
    const map = new Map();
    visitsRows.forEach(r => {
      const fn = r.facilityName || '-';
      if (!map.has(fn)) map.set(fn, {});
      map.get(fn)[r.month] = Number(r.count) || 0;
    });
    const rows = Array.from(map.entries()).map(([facilityName, byMonth]) => {
      const entry = { facilityName };
      let total = 0;
      monthsInRange.forEach(m => { const v = byMonth[m.key] || 0; entry[m.key] = v; total += v; });
      entry.total = total;
      return entry;
    }).filter(r => r.total > 0);
    return rows;
  }, [visitsRows, monthsInRange]);

  const diagnosisPivot = useMemo(() => {
    // Pivot: rows = diagnosis, columns = month, value = count
    const map = new Map();
    diagnosisRows.forEach(r => {
      const dx = r.diagnosis || '-';
      if (!map.has(dx)) map.set(dx, {});
      map.get(dx)[r.month] = Number(r.count) || 0;
    });
    const rows = Array.from(map.entries()).map(([diagnosis, byMonth]) => {
      const entry = { diagnosis };
      let total = 0;
      monthsInRange.forEach(m => { const v = byMonth[m.key] || 0; entry[m.key] = v; total += v; });
      entry.total = total;
      return entry;
    }).filter(r => r.total > 0);
    return rows;
  }, [diagnosisRows, monthsInRange]);

  const exportExcel = (filename, headers, rows) => {
    // Create worksheet data
    const worksheetData = [
      headers,
      ...rows.map(r => headers.map(h => r[h] || ''))
    ];
    
    // Create workbook and worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    // Set column widths
    const colWidths = headers.map(h => ({
      wch: Math.max(h.length, 15)
    }));
    worksheet['!cols'] = colWidths;
    
    // Write file
    XLSX.writeFile(workbook, filename);
  };

  const visitsExcel = () => {
    const headers = ['Faskes', ...monthsInRange.map(m => m.label), 'Total'];
    const rows = visitsPivot.map(r => {
      const obj = { 'Faskes': r.facilityName };
      monthsInRange.forEach(m => { obj[m.label] = r[m.key]; });
      obj['Total'] = r.total;
      return obj;
    });
    exportExcel('report-kunjungan.xlsx', headers, rows);
  };

  const diagnosisExcel = () => {
    const headers = ['Diagnosis', ...monthsInRange.map(m => m.label), 'Total'];
    const rows = diagnosisPivot.map(r => {
      const obj = { 'Diagnosis': r.diagnosis };
      monthsInRange.forEach(m => { obj[m.label] = r[m.key]; });
      obj['Total'] = r.total;
      return obj;
    });
    exportExcel('report-diagnosis.xlsx', headers, rows);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow">
          <h1 className="text-2xl font-bold mb-2">Reports</h1>
          <p className="text-gray-600">Unduh data perbulan untuk kunjungan dan diagnosis.</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Faskes</label>
              <select value={facilityCode} onChange={(e) => setFacilityCode(e.target.value)} className="w-full border rounded px-3 py-2 text-black bg-white">
                <option value="">Semua</option>
                {clinics.map(c => (
                  <option key={c.id} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status Pegawai</label>
              <select value={employeeStatus} onChange={(e) => setEmployeeStatus(e.target.value)} className="w-full border rounded px-3 py-2 text-black bg-white">
                <option value="">Semua</option>
                <option value="Pegawai Aktif">Pegawai Aktif</option>
                <option value="Pensiunan">Pensiunan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Mulai</label>
              <input type="date" value={period.start} onChange={(e) => setPeriod(p => ({ ...p, start: e.target.value }))} className="w-full border rounded px-3 py-2 text-black bg-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Selesai</label>
              <input type="date" value={period.end} onChange={(e) => setPeriod(p => ({ ...p, end: e.target.value }))} className="w-full border rounded px-3 py-2 text-black bg-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">1. Report Kunjungan (per Faskes per Bulan)</h2>
            <button onClick={visitsExcel} className="px-4 py-2 rounded bg-blue-600 text-white">Download XLSX</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="border px-3 py-2 text-left">Nama Faskes</th>
                  {monthsInRange.map(m => (
                    <th key={m.key} className="border px-3 py-2 text-right">{m.label}</th>
                  ))}
                  <th className="border px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {visitsPivot.length === 0 ? (
                  <tr><td className="border px-3 py-4 text-center" colSpan={monthsInRange.length + 2}>{loading ? 'Memuat...' : 'Tidak ada data'}</td></tr>
                ) : visitsPivot.map((r) => (
                  <tr key={r.facilityName}>
                    <td className="border px-3 py-2">{r.facilityName}</td>
                    {monthsInRange.map(m => (
                      <td key={m.key} className="border px-3 py-2 text-right">{r[m.key]}</td>
                    ))}
                    <td className="border px-3 py-2 text-right font-semibold">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">2. Report Diagnosis per Bulan</h2>
            <button onClick={diagnosisExcel} className="px-4 py-2 rounded bg-blue-600 text-white">Download XLSX</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="border px-3 py-2 text-left">Diagnosis</th>
                  {monthsInRange.map(m => (
                    <th key={m.key} className="border px-3 py-2 text-right">{m.label}</th>
                  ))}
                  <th className="border px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {diagnosisPivot.length === 0 ? (
                  <tr><td className="border px-3 py-4 text-center" colSpan={monthsInRange.length + 2}>{loading ? 'Memuat...' : 'Tidak ada data'}</td></tr>
                ) : diagnosisPivot.map((r) => (
                  <tr key={r.diagnosis}>
                    <td className="border px-3 py-2">{r.diagnosis}</td>
                    {monthsInRange.map(m => (
                      <td key={m.key} className="border px-3 py-2 text-right">{r[m.key]}</td>
                    ))}
                    <td className="border px-3 py-2 text-right font-semibold">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2">Catatan: Diagnosis berasal dari field `diagnosis` kunjungan.</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">3. Report Obat-obatan per Bulan</h2>
            <button disabled className="px-4 py-2 rounded bg-gray-300 text-gray-600 cursor-not-allowed">Dalam Pengembangan</button>
          </div>
          <p className="text-gray-600">Belum tersedia karena data obat belum tersedia.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}


