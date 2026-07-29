# qsshmst
器材管理系統

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Camera, Package, Clock, CheckCircle2, Wrench, 
  Plus, Search, RefreshCw, ArrowUpRight, 
  ArrowDownLeft, BarChart2, FileText, 
  Trash2, Edit3, ShieldAlert, X, Users, Download, Database
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- 預設社團器材資料 (初次使用時自動寫入 LocalStorage) ---
const INITIAL_DATA = [
  { id: 'eq-1', name: 'Sony FX3 攝影機', category: '攝影機', status: 'borrowed', code: 'CAM-01', location: '器材櫃 A1', borrower: '張小明 (301)', returnDate: '2026-07-30', activity: '開學典禮彩排', note: '含雙原廠電池、手把' },
  { id: 'eq-2', name: 'Sony A7IV 照相機', category: '攝影機', status: 'available', code: 'CAM-02', location: '器材櫃 A2', borrower: '', returnDate: '', activity: '', note: '' },
  { id: 'eq-3', name: 'Sennheiser 無線領夾麥克風組', category: '音訊設備', status: 'available', code: 'MIC-01', location: '防潮箱 B1', borrower: '', returnDate: '', activity: '', note: '' },
  { id: 'eq-4', name: 'Rode VideoMic Pro+ Shotgun', category: '音訊設備', status: 'borrowed', code: 'MIC-02', location: '防潮箱 B2', borrower: '李華 (205)', returnDate: '2026-07-31', activity: '社團團照拍攝', note: '' },
  { id: 'eq-5', name: 'Aputure Amaran 200d 補光燈', category: '燈光設備', status: 'maintenance', code: 'LGT-01', location: '器材櫃 C1', borrower: '', returnDate: '', activity: '', note: '燈珠閃爍送修中' },
  { id: 'eq-6', name: 'Manfrotto 504HD 重型油壓腳架', category: '腳架/支架', status: 'available', code: 'TRP-01', location: '器材區底層', borrower: '', returnDate: '', activity: '', note: '' },
  { id: 'eq-7', name: 'HDMI 傳輸線 (10m)', category: '線材/配件', status: 'available', code: 'CAB-01', location: '抽屜 D1', borrower: '', returnDate: '', activity: '', note: '' },
  { id: 'eq-8', name: 'Blackmagic ATEM Mini Pro 切換台', category: '導播設備', status: 'available', code: 'SWI-01', location: '防潮箱 C2', borrower: '', returnDate: '', activity: '', note: '' },
];

const CATEGORIES = ['全部', '攝影機', '音訊設備', '燈光設備', '腳架/支架', '導播設備', '線材/配件'];

// --- 抽象化 API 服務層 (未來接 GitHub + 自建 API 時只需替換此處) ---
const equipmentApi = {
  // 取得所有器材
  getItems: async () => {
    // 未來替換為: const res = await fetch('https://your-api.com/equipments'); return await res.json();
    const local = localStorage.getItem('cshs_equipments');
    if (!local) {
      localStorage.setItem('cshs_equipments', JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    }
    return JSON.parse(local);
  },

  // 儲存/更新所有器材
  saveItems: async (items) => {
    localStorage.setItem('cshs_equipments', JSON.stringify(items));
  },

  // 取得異動日誌
  getLogs: async () => {
    const local = localStorage.getItem('cshs_equipment_logs');
    return local ? JSON.parse(local) : [];
  },

  // 新增日誌
  addLog: async (log) => {
    const local = localStorage.getItem('cshs_equipment_logs');
    const logs = local ? JSON.parse(local) : [];
    const newLogs = [log, ...logs];
    localStorage.setItem('cshs_equipment_logs', JSON.stringify(newLogs));
    return newLogs;
  }
};

export default function App() {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI 狀態
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, stats, logs
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('ALL'); 
  
  // Modal 彈窗狀態
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // 表單狀態
  const [newItem, setNewItem] = useState({ name: '', code: '', category: '攝影機', location: '', note: '' });
  const [editItem, setEditItem] = useState({ id: '', name: '', code: '', category: '攝影機', location: '', note: '' });
  const [borrowForm, setBorrowForm] = useState({ borrower: '', borrowerId: '', activity: '', returnDate: '' });

  // 初始化載入資料
  useEffect(() => {
    async function initData() {
      setLoading(true);
      const data = await equipmentApi.getItems();
      const historyLogs = await equipmentApi.getLogs();
      setItems(data);
      setLogs(historyLogs);
      setLoading(false);
    }
    initData();
  }, []);

  // 紀錄操作紀錄
  const recordLog = async (action, itemName, code, detail) => {
    const logEntry = {
      id: 'log-' + Date.now(),
      action, // 'BORROW', 'RETURN', 'ADD', 'EDIT', 'MAINTENANCE', 'DELETE'
      itemName,
      code,
      detail,
      timestamp: new Date().toISOString()
    };
    const updatedLogs = await equipmentApi.addLog(logEntry);
    setLogs(updatedLogs);
  };

  // 1. 新增器材
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.code) return;

    const itemToAdd = {
      id: 'eq-' + Date.now(),
      ...newItem,
      status: 'available',
      borrower: '',
      returnDate: '',
      activity: ''
    };

    const updated = [itemToAdd, ...items];
    setItems(updated);
    await equipmentApi.saveItems(updated);
    await recordLog('ADD', newItem.name, newItem.code, '新增器材入庫');
    
    setNewItem({ name: '', code: '', category: '攝影機', location: '', note: '' });
    setShowAddModal(false);
  };

  // 2. 編輯器材
  const handleEditItemSubmit = async (e) => {
    e.preventDefault();
    if (!editItem.name || !editItem.code) return;

    const updated = items.map(item => item.id === editItem.id ? { ...item, ...editItem } : item);
    setItems(updated);
    await equipmentApi.saveItems(updated);
    await recordLog('EDIT', editItem.name, editItem.code, '更新器材基本資訊');

    setShowEditModal(false);
    setSelectedItem(null);
  };

  // 3. 辦理借出
  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || !borrowForm.borrower) return;

    const borrowerText = `${borrowForm.borrower} (${borrowForm.borrowerId || '未填學號'})`;
    const updated = items.map(item => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          status: 'borrowed',
          borrower: borrowerText,
          activity: borrowForm.activity,
          returnDate: borrowForm.returnDate
        };
      }
      return item;
    });

    setItems(updated);
    await equipmentApi.saveItems(updated);
    await recordLog('BORROW', selectedItem.name, selectedItem.code, `借用人: ${borrowerText} | 活動: ${borrowForm.activity || '無'}`);

    setShowBorrowModal(false);
    setSelectedItem(null);
    setBorrowForm({ borrower: '', borrowerId: '', activity: '', returnDate: '' });
  };

  // 4. 辦理歸還
  const handleReturnItem = async (item) => {
    const updated = items.map(i => {
      if (i.id === item.id) {
        return { ...i, status: 'available', borrower: '', returnDate: '', activity: '' };
      }
      return i;
    });

    setItems(updated);
    await equipmentApi.saveItems(updated);
    await recordLog('RETURN', item.name, item.code, `原借用人: ${item.borrower}`);
  };

  // 5. 切換維修狀態
  const handleToggleMaintenance = async (item) => {
    const nextStatus = item.status === 'maintenance' ? 'available' : 'maintenance';
    const updated = items.map(i => {
      if (i.id === item.id) {
        return { ...i, status: nextStatus, borrower: '', returnDate: '', activity: '' };
      }
      return i;
    });

    setItems(updated);
    await equipmentApi.saveItems(updated);
    await recordLog('MAINTENANCE', item.name, item.code, nextStatus === 'maintenance' ? '標記為維修中' : '維修完成恢復正常');
  };

  // 6. 刪除器材
  const handleDeleteItem = async (item) => {
    if (confirm(`確定要刪除 ${item.name} (${item.code}) 嗎？此動作無法復原。`)) {
      const updated = items.filter(i => i.id !== item.id);
      setItems(updated);
      await equipmentApi.saveItems(updated);
      await recordLog('DELETE', item.name, item.code, '刪除此器材資料');
    }
  };

  // 7. 匯出 CSV 功能
  const exportToCSV = () => {
    const headers = ["器材編號,器材名稱,類別,狀態,存放位置,借用人,預計歸還日期,用途活動,備註\n"];
    const rows = items.map(i => 
      `"${i.code}","${i.name}","${i.category}","${i.status}","${i.location}","${i.borrower}","${i.returnDate}","${i.activity}","${i.note}"\n`
    );
    const blob = new Blob(["\uFEFF" + headers.concat(rows).join("")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `清水高中媒體服務隊_器材清單_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 篩選過濾後的器材
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.borrower.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === '全部' || item.category === selectedCategory;
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, statusFilter]);

  // 統計數據
  const stats = useMemo(() => {
    const total = items.length;
    const borrowed = items.filter(i => i.status === 'borrowed').length;
    const available = items.filter(i => i.status === 'available').length;
    const maintenance = items.filter(i => i.status === 'maintenance').length;

    const categoryCounts = {};
    items.forEach(i => {
      categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
    });
    const chartData = Object.keys(categoryCounts).map(cat => ({
      name: cat,
      count: categoryCounts[cat]
    }));

    return { total, borrowed, available, maintenance, chartData };
  }, [items]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* 頂部導航列 */}
      <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-xl shadow-lg shadow-cyan-500/20">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg sm:text-xl tracking-wide bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                清水高中媒體服務隊
              </h1>
              <p className="text-xs text-cyan-400 font-medium">器材管理系統 Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportToCSV}
              title="匯出 CSV 報表"
              className="flex items-center space-x-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg text-sm font-medium transition"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">匯出報表</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition shadow-md shadow-cyan-600/30"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">新增器材</span>
            </button>
          </div>
        </div>
      </header>

      {/* 主要內容區 */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        
        {/* 左側選單 */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-3">
          <nav className="bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50 space-y-1">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'inventory' 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                  : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5" />
                <span>器材庫存總覽</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                {items.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'stats' 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                  : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <BarChart2 className="w-5 h-5" />
                <span>分析與統計</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'logs' 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                  : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5" />
                <span>異動紀錄日誌</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                {logs.length}
              </span>
            </button>
          </nav>

          {/* 數據小卡 */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">即時狀態概覽</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center text-emerald-400 text-xs mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  可借用
                </div>
                <div className="text-xl font-bold text-slate-100">{stats.available}</div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center text-amber-400 text-xs mb-1">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  借出中
                </div>
                <div className="text-xl font-bold text-slate-100">{stats.borrowed}</div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 col-span-2">
                <div className="flex items-center text-rose-400 text-xs mb-1">
                  <Wrench className="w-3.5 h-3.5 mr-1" />
                  維修中 / 待檢修
                </div>
                <div className="text-xl font-bold text-slate-100">{stats.maintenance}</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-800/20 border border-slate-800 rounded-xl flex items-center space-x-2 text-slate-500 text-xs">
            <Database className="w-4 h-4 text-cyan-500" />
            <span>儲存模式: 本地快取 (相容 REST API)</span>
          </div>
        </aside>

        {/* 右側主要內容 */}
        <main className="flex-1 space-y-6">
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              {/* 搜尋與過濾工具列 */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="搜尋器材名稱、編號、借用人..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-700 text-slate-100 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-500 transition"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-900/80 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="ALL">所有狀態</option>
                      <option value="available">🟢 可借用</option>
                      <option value="borrowed">🟡 借出中</option>
                      <option value="maintenance">🔴 維修中</option>
                    </select>
                  </div>
                </div>

                {/* 分類標籤頁 */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1 text-xs">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition ${
                        selectedCategory === cat
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-medium'
                          : 'bg-slate-900/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 器材列表卡片 */}
              {loading ? (
                <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-800">
                  <RefreshCw className="w-8 h-8 animate-spin text-cyan-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">正在載入器材資料...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-800">
                  <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-slate-300 font-medium mb-1">找不到相關器材</h3>
                  <p className="text-slate-500 text-sm">請嘗試更換搜尋關鍵字或調整篩選條件</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/80 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-black/20 group"
                    >
                      <div>
                        {/* 編號與狀態標籤 */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-700 text-slate-300 font-mono">
                            {item.code}
                          </span>
                          
                          {item.status === 'available' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                              可借用
                            </span>
                          )}
                          {item.status === 'borrowed' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>
                              借出中
                            </span>
                          )}
                          {item.status === 'maintenance' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5 animate-pulse"></span>
                              維修中
                            </span>
                          )}
                        </div>

                        {/* 名稱與位置 */}
                        <h3 className="text-base font-semibold text-slate-100 group-hover:text-cyan-300 transition mb-1">
                          {item.name}
                        </h3>
                        <p className="text-xs text-slate-400 mb-3 flex items-center gap-2">
                          <span>存放位址: <strong className="text-slate-300">{item.location || '未標示'}</strong></span>
                          <span>•</span>
                          <span>{item.category}</span>
                        </p>

                        {/* 借用狀態詳細資訊 */}
                        {item.status === 'borrowed' && (
                          <div className="bg-slate-900/60 rounded-xl p-3 mb-4 text-xs space-y-1 border border-slate-800">
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-400">借用人:</span>
                              <span className="font-medium text-amber-300">{item.borrower}</span>
                            </div>
                            {item.activity && (
                              <div className="flex justify-between text-slate-300">
                                <span className="text-slate-400">使用活動:</span>
                                <span>{item.activity}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-400">預計歸還:</span>
                              <span className="text-rose-400 font-mono">{item.returnDate || '未定'}</span>
                            </div>
                          </div>
                        )}

                        {item.note && item.status !== 'borrowed' && (
                          <p className="text-xs text-slate-400 italic bg-slate-900/40 p-2.5 rounded-lg mb-4 border border-slate-800/80">
                            「{item.note}」
                          </p>
                        )}
                      </div>

                      {/* 卡片底部操作按鈕 */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-700/40 mt-2">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => {
                              setEditItem(item);
                              setShowEditModal(true);
                            }}
                            title="編輯資訊"
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleMaintenance(item)}
                            title={item.status === 'maintenance' ? "設為正常" : "報修/維修"}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 rounded-lg transition"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            title="刪除器材"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          {item.status === 'available' && (
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setShowBorrowModal(true);
                              }}
                              className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-medium transition flex items-center gap-1"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              登記借出
                            </button>
                          )}

                          {item.status === 'borrowed' && (
                            <button
                              onClick={() => handleReturnItem(item)}
                              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition flex items-center gap-1"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                              辦理歸還
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 分頁: 統計資料 */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-cyan-400" />
                  器材類別數量統計圖
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} 
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {stats.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981'][index % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    維修與保養建議
                  </h4>
                  <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                    <li>單眼攝影機與高單價鏡頭請於使用完畢後確實歸位並放入防潮箱。</li>
                    <li>若發現器材故障損壞，請點選「維修」按鈕記錄，利於後續追蹤。</li>
                    <li>充電設備、無線麥克風使用後請協助補滿電量再歸還。</li>
                  </ul>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    社團使用規範
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    凡清水高中媒體服務隊隊員，因學校活動、社團紀錄或課業需求借用器材，必須在此系統登錄。未登記私自攜出視為違規，歸還需由幹部現場點交確認。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 分頁: 歷史日誌 */}
          {activeTab === 'logs' && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
              <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                器材異動歷史紀錄
              </h3>

              {logs.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">目前尚無任何異動紀錄</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div key={log.id} className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl flex items-start justify-between text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {log.action === 'BORROW' && <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">借出</span>}
                          {log.action === 'RETURN' && <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">歸還</span>}
                          {log.action === 'ADD' && <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-medium">新增</span>}
                          {log.action === 'EDIT' && <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">編輯</span>}
                          {log.action === 'MAINTENANCE' && <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-medium">維修</span>}
                          {log.action === 'DELETE' && <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-medium">刪除</span>}
                          
                          <span className="text-slate-200 font-semibold">{log.itemName}</span>
                          <span className="text-slate-500 font-mono">({log.code})</span>
                        </div>
                        <p className="text-slate-400">{log.detail}</p>
                      </div>

                      <span className="text-slate-500 text-[11px] font-mono whitespace-nowrap ml-4">
                        {new Date(log.timestamp).toLocaleString('zh-TW', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* 彈窗: 借用登記 */}
      {showBorrowModal && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="font-semibold text-lg text-slate-100">登記借用器材</h3>
              <button onClick={() => setShowBorrowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-400">借用項目</p>
              <p className="text-slate-200 font-medium text-sm">{selectedItem.name} <span className="text-cyan-400 font-mono">({selectedItem.code})</span></p>
            </div>

            <form onSubmit={handleBorrowSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-300 text-xs mb-1">借用人姓名 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：陳大明"
                  value={borrowForm.borrower}
                  onChange={(e) => setBorrowForm({ ...borrowForm, borrower: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs mb-1">班級 / 學號</label>
                <input
                  type="text"
                  placeholder="例如：203班 15號"
                  value={borrowForm.borrowerId}
                  onChange={(e) => setBorrowForm({ ...borrowForm, borrowerId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs mb-1">使用用途 / 活動名稱</label>
                <input
                  type="text"
                  placeholder="例如：校慶紀錄 / 課業拍攝"
                  value={borrowForm.activity}
                  onChange={(e) => setBorrowForm({ ...borrowForm, activity: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs mb-1">預計歸還日期</label>
                <input
                  type="date"
                  value={borrowForm.returnDate}
                  onChange={(e) => setBorrowForm({ ...borrowForm, returnDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBorrowModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-medium transition shadow-md shadow-cyan-600/30"
                >
                  確認借出
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 彈窗: 新增器材 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="font-semibold text-lg text-slate-100">新增器材入庫</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-300 text-xs mb-1">器材名稱 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：Sony FX3 攝影機"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs mb-1">財產編號 / 自訂編號 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：CAM-03"
                  value={newItem.code}
                  onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs mb-1">器材類別</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  {CATEGORIES.filter(c => c !== '全部').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-xs mb-1">預設存放地點</label>
                <input
                  type="text"
                  placeholder="例如：器材櫃 A1 / 防潮箱 B"
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs mb-1">備註 / 配件說明</label>
                <textarea
                  placeholder="例如：含原廠電池x2、充電器x1"
                  value={newItem.note}
                  onChange={(e) => setNewItem({ ...newItem, note: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none h-20 resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-medium transition shadow-md shadow-cyan-600/30"
                >
                  儲存並新增
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 彈窗: 編輯器材 */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="font-semibold text-lg text-slate-100">編輯器材資料</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditItemSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-300 text-xs mb-1">器材名稱 *</label>
                <input
                  type="text"
                  required
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs mb-1">編號 *</label>
                <input
                  type="text"
                  required
                  value={editItem.code}
                  onChange={(e) => setEditItem({ ...editItem, code: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs mb-1">類別</label>
                <select
                  value={editItem.category}
                  onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  {CATEGORIES.filter(c => c !== '全部').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-xs mb-1">存放地點</label>
                <input
                  type="text"
                  value={editItem.location}
                  onChange={(e) => setEditItem({ ...editItem, location: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs mb-1">備註說明</label>
                <textarea
                  value={editItem.note}
                  onChange={(e) => setEditItem({ ...editItem, note: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none h-20 resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-medium transition shadow-md shadow-cyan-600/30"
                >
                  更新儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 頁尾 */}
      <footer className="bg-slate-900 border-t border-slate-800 text-center py-4 text-xs text-slate-500">
        清水高中媒體服務隊 Equipment Management System © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
