"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import * as XLSX from "xlsx";

export default function ReportsVisitsPage() {
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

      const res = await fetch(`/api/reports/visits-per-month?${sp.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil report kunjungan');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Report kunjungan gagal');
      setVisitsRows(json.data || []);
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

  const exportExcel = () => {
    const headers = ['Faskes', ...monthsInRange.map(m => m.label), 'Total'];
    const rows = visitsPivot.map(r => {
      const obj = { 'Faskes': r.facilityName };
      monthsInRange.forEach(m => { obj[m.label] = r[m.key]; });
      obj['Total'] = r.total;
      return obj;
    });
    
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
    XLSX.writeFile(workbook, 'report-kunjungan.xlsx');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-black">
        <div className="bg-white rounded-2xl p-6 shadow">
          <h1 className="text-2xl font-bold mb-2">Report Kunjungan</h1>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm mb-1">Faskes</label>
              <select value={facilityCode} onChange={(e) => setFacilityCode(e.target.value)} className="w-full border rounded px-3 py-2 text-black bg-white">
                <option value="">Semua</option>
                {clinics.map(c => (
                  <option key={c.id} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Status Pegawai</label>
              <select value={employeeStatus} onChange={(e) => setEmployeeStatus(e.target.value)} className="w-full border rounded px-3 py-2 text-black bg-white">
                <option value="">Semua</option>
                <option value="Pegawai Aktif">Pegawai Aktif</option>
                <option value="Pensiunan">Pensiunan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Mulai</label>
              <input type="date" value={period.start} onChange={(e) => setPeriod(p => ({ ...p, start: e.target.value }))} className="w-full border rounded px-3 py-2 text-black bg-white" />
            </div>
            <div>
              <label className="block text-sm mb-1">Selesai</label>
              <input type="date" value={period.end} onChange={(e) => setPeriod(p => ({ ...p, end: e.target.value }))} className="w-full border rounded px-3 py-2 text-black bg-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Kunjungan per Faskes per Bulan</h2>
            <button onClick={exportExcel} className="px-4 py-2 rounded bg-blue-600 text-white">Download XLSX</button>
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
      </div>
    </DashboardLayout>
  );
}


