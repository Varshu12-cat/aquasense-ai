import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  UploadCloud,
  FileCheck,
  AlertCircle,
  CheckCircle,
  FileText,
  Calendar,
  Layers,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';

export const DataManagement: React.FC = () => {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('default-campus-90days');
  const [preview, setPreview] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDatasetList();
  }, []);

  useEffect(() => {
    if (selectedDatasetId) {
      loadPreview(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const loadDatasetList = async () => {
    setLoading(true);
    try {
      const list = await api.listDatasets();
      setDatasets(list);
      if (list.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(list[0].dataset_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async (id: string) => {
    try {
      const data = await api.previewDataset(id);
      setPreview(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadError('Invalid file type. Only CSV (.csv) files are permitted.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File size exceeds 25 MB limit.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const res = await api.uploadDataset(file);
      setUploadSuccess(res.message);
      await loadDatasetList();
      setSelectedDatasetId(res.dataset_id);
    } catch (err: any) {
      setUploadError(err.message || 'File upload and validation failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Database className="w-5 h-5 text-teal-400" />
            <span>Telemetry Ingestion & Dataset Quality Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Schema verification, duplicate removal, chronological sorting, and cloud staging validation
          </p>
        </div>

        <button
          onClick={loadDatasetList}
          className="flex items-center space-x-1 text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Registry</span>
        </button>
      </div>

      {/* Upload Zone */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center space-x-2">
          <UploadCloud className="w-4 h-4 text-teal-400" />
          <span>Ingest New Telemetry CSV Batch</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Accepts smart meter telemetry CSV. Mandatory columns: <code className="text-teal-300">timestamp</code>, <code className="text-teal-300">meter_id</code>, <code className="text-teal-300">water_consumption_liters</code>. Optional: <code className="text-slate-300">location</code>, <code className="text-slate-300">temperature_c</code>.
        </p>

        <div className="border-2 border-dashed border-slate-700/80 hover:border-teal-500/50 rounded-xl p-8 text-center transition bg-slate-950/40">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload-input"
          />
          <label htmlFor="csv-upload-input" className="cursor-pointer space-y-2 block">
            <UploadCloud className="w-10 h-10 text-teal-400 mx-auto" />
            <div className="text-sm font-medium text-white">
              {uploading ? 'Validating & Ingesting Dataset...' : 'Click to Browse or Drag CSV File Here'}
            </div>
            <div className="text-xs text-slate-500">Maximum file size: 25 MB</div>
          </label>
        </div>

        {uploadError && (
          <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}
      </div>

      {/* Quality Summary & Dataset Details */}
      {preview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400">Total Records</span>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {preview.info.total_records.toLocaleString()}
            </div>
            <span className="text-[11px] text-teal-400 font-medium">Validated schema</span>
          </div>

          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400">Time Span</span>
            <div className="text-xs font-mono text-slate-300 mt-1 truncate">
              {new Date(preview.info.min_date).toLocaleDateString()} - {new Date(preview.info.max_date).toLocaleDateString()}
            </div>
            <span className="text-[11px] text-cyan-400 font-medium">90 Days Monitored</span>
          </div>

          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400">Missing Values</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {Object.values(preview.missing_values as Record<string, number>).reduce((a, b) => a + b, 0)}
            </div>
            <span className="text-[11px] text-slate-500">Zero unhandled NaNs</span>
          </div>

          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400">Duplicate Timestamps</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {preview.duplicates_found}
            </div>
            <span className="text-[11px] text-slate-500">De-duplicated per meter</span>
          </div>
        </div>
      )}

      {/* Dataset Preview Table */}
      {preview && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Data Preview (First 15 Validated Records)
              </h3>
              <p className="text-xs text-slate-400">
                File: <code className="text-teal-300">{preview.info.filename}</code> • Size: {(preview.info.file_size_bytes / 1024).toFixed(1)} KB
              </p>
            </div>
            <span className="text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded">
              Active Ingestion Source
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[11px]">
                  {preview.columns.map((col: string) => (
                    <th key={col} className="py-2.5 px-4 font-mono">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {preview.preview_rows.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    {preview.columns.map((col: string) => (
                      <td key={col} className="py-2 px-4 whitespace-nowrap text-slate-300">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
