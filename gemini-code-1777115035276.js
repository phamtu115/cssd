"use client";
import { useState, useEffect } from 'react';
import { Package, Thermometer, RefreshCw, PlusCircle } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch('/api/process');
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const runAction = async (action, extra = {}) => {
    if (selected.length === 0 && action !== 'NHAN_MOI') return alert("Hãy chọn dụng cụ!");
    await fetch('/api/process', {
      method: 'POST',
      body: JSON.stringify({ action, payload: { ids: selected, ...extra } })
    });
    setSelected([]); fetchData();
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen p-4 pb-32">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-black text-blue-800">HỆ THỐNG CSSD</h1>
        <button onClick={fetchData} className={`${loading ? 'animate-spin' : ''}`}><RefreshCw size={20}/></button>
      </div>

      <div className="mb-6">
        <input 
          onKeyDown={(e) => { if(e.key === 'Enter') { runAction('NHAN_MOI', { ten_bo: e.target.value }); e.target.value = ''; }}}
          placeholder="Quét mã QR tại đây..." 
          className="w-full p-4 rounded-2xl border-none shadow-inner bg-white text-lg focus:ring-2 ring-blue-500 outline-none"
        />
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} onClick={() => setSelected(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])}
               className={`p-4 rounded-2xl transition-all border-2 ${selected.includes(item.id) ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white shadow-sm'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-slate-800">{item.ten_bo_dung_cu}</p>
                <p className="text-[10px] text-slate-500 uppercase font-medium mt-1 tracking-wider">{item.trang_thai.replace(/_/g, ' ')}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${item.trang_thai === 'DANG_XU_LY' ? 'bg-yellow-400' : item.trang_thai === 'DONG_GOI' ? 'bg-blue-400' : 'bg-green-400'}`}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-6 left-4 right-4 bg-slate-900 rounded-3xl p-4 flex justify-around shadow-2xl shadow-blue-200">
        <button onClick={() => runAction('DONG_GOI')} className="flex flex-col items-center text-white opacity-90 hover:opacity-100">
          <Package size={24}/> <span className="text-[10px] mt-1 font-bold">ĐÓNG GÓI</span>
        </button>
        <button onClick={() => {
          const pass = prompt("Nhập mã vận hành:");
          if(pass === "123456") runAction('TIET_KHUAN', { may: 'MAY_1', minutes: 70 });
        }} className="flex flex-col items-center text-orange-400">
          <Thermometer size={24}/> <span className="text-[10px] mt-1 font-bold">HẤP SẤY</span>
        </button>
      </div>
    </div>
  );
}