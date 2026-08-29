'use client';

import React, { useState, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LineController, // Added to fix the Uncaught Error
  BarController,  // Added to fix the Uncaught Error
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController
);

// --- TYPES ---
interface InventoryItem {
  id: number;
  name: string;
  price: number;
}

interface ExpenseItem {
  id: number;
  name: string;
  amount: number;
}

// --- INITIAL CORRECTED DATA ---
const initialInventory: InventoryItem[] = [
  { id: 1, name: 'Cabaayd', price: 21 }, { id: 2, name: 'Cabaayd', price: 20 },
  { id: 3, name: 'Toob', price: 13 }, { id: 4, name: 'Cabaayd', price: 20 },
  { id: 5, name: 'Googarad + Dirac', price: 22 }, { id: 6, name: 'Cabaayad', price: 18 },
  { id: 7, name: 'Cabaayd', price: 20 }, { id: 8, name: 'Dirac Wil', price: 15 },
  { id: 9, name: 'Googarad', price: 8 }, { id: 10, name: 'Googarad + Dirac', price: 23 },
  { id: 11, name: 'Galbiyad', price: 16 }, { id: 12, name: 'Toob', price: 13 },
  { id: 13, name: 'Cabaayd', price: 20 }, { id: 14, name: 'Galbiyad', price: 16 },
  { id: 15, name: 'Cabaayad', price: 21 }, { id: 16, name: 'Toob', price: 13 },
  { id: 17, name: 'Toob', price: 13 }, { id: 18, name: 'Cabaayad', price: 21 },
  { id: 19, name: 'Cabaayad', price: 21 }, { id: 20, name: 'Cabaayad Yar', price: 16 },
  { id: 21, name: 'Shalmad', price: 6 }, { id: 22, name: 'Cabaayad', price: 28 },
  { id: 23, name: 'Cabaayad Yar', price: 18 }, { id: 24, name: 'Cabaayad Yar', price: 20 },
  { id: 25, name: 'Cabaayad', price: 25 }, { id: 26, name: 'Cabaayad Yar', price: 19 },
  { id: 27, name: 'Cabaayad Yar', price: 18 }, { id: 28, name: 'Cabaayad Yar', price: 18 },
  { id: 29, name: 'Cabaayad Yar', price: 18 }, { id: 30, name: 'Cabaayad Yar', price: 18 },
  { id: 31, name: 'Cabaayad Yar', price: 19 }, { id: 32, name: 'Cabaayad', price: 20 },
  { id: 33, name: 'Cabaayad', price: 21 }, { id: 34, name: 'Cabaayad Yar', price: 19 },
  { id: 35, name: 'Cabaayad Yar', price: 18 }, { id: 36, name: 'Cabaayad Yar', price: 18 },
  { id: 37, name: 'Toob', price: 12 }, { id: 38, name: 'Cabaayad Yar', price: 21 },
  { id: 39, name: 'Cabaayad Yar', price: 21 }, { id: 40, name: 'Toob', price: 12 },
  { id: 41, name: 'Cabaayad', price: 21 }, { id: 42, name: 'Cabaayad Yar', price: 20 },
  { id: 43, name: 'Cabaayad Yar', price: 20 }, { id: 44, name: 'Cabaayad', price: 21 },
  { id: 45, name: 'Cabaayad', price: 22 }, { id: 46, name: 'Cabaayad Yar', price: 18 },
  { id: 47, name: 'Cabaayad', price: 23 }, { id: 48, name: 'Cabaayad', price: 20 },
  { id: 49, name: 'Cabaayad', price: 20 }, { id: 50, name: 'Body', price: 6 },
  { id: 51, name: 'Body', price: 5 }, { id: 52, name: 'Cabaayad', price: 20 },
  { id: 53, name: 'Galbiyad', price: 17 }, { id: 54, name: 'Galbiyad', price: 17 },
  { id: 55, name: 'Cabaayad', price: 21 }, { id: 56, name: 'Cabaayad', price: 22 },
  { id: 57, name: 'Cabaayad', price: 25 }, { id: 58, name: 'Toob', price: 10 },
  { id: 59, name: 'Shaal', price: 9 }, { id: 60, name: 'Cabaayad', price: 17 },
  { id: 61, name: 'Cabaayad', price: 18 }, { id: 62, name: 'Shaal', price: 9 },
  { id: 63, name: 'Cabaayad', price: 16 }, { id: 64, name: 'Cabaayad', price: 22 },
  { id: 65, name: 'Toob', price: 14 }, { id: 66, name: 'Toob', price: 14.5 },
  { id: 67, name: 'Cabaayad', price: 21 }, { id: 68, name: 'Toob', price: 14 },
  { id: 69, name: 'Toob', price: 14 }, { id: 70, name: 'Cabaayad', price: 23 },
  { id: 71, name: 'Galbiyad', price: 17 }, { id: 72, name: 'Cabaayad', price: 22 },
  { id: 73, name: 'Galbiyad', price: 17 }, { id: 74, name: 'Cabaayad', price: 23 },
  { id: 75, name: 'Cabaayad', price: 22 }, { id: 76, name: 'Cabaayad', price: 47 },
  { id: 77, name: 'Cabaayad', price: 20 }, { id: 78, name: 'Cabaayad', price: 45 },
  { id: 79, name: 'Cabaayad', price: 16 }, { id: 80, name: 'Cabaayad', price: 20 },
  { id: 81, name: 'Cabaayad', price: 12 }, { id: 82, name: 'Cabaayad', price: 20 },
  { id: 83, name: 'Sad', price: 35 }, { id: 84, name: 'Cabaayad', price: 20 },
  { id: 85, name: 'Cabaayad', price: 32 }, { id: 86, name: 'Cabaayad', price: 21 },
  { id: 87, name: 'Toob', price: 45 }, { id: 88, name: 'Cabaayad', price: 16 },
  { id: 89, name: 'Cabaayad', price: 32 }, { id: 90, name: 'Toob', price: 46.5 },
  { id: 91, name: 'Toob', price: 31 }, { id: 92, name: 'Toob', price: 31 },
  { id: 93, name: 'Cabaayad', price: 21 }, { id: 94, name: 'Body', price: 6 },
  { id: 95, name: 'cabaayad yar', price: 17 }, { id: 96, name: 'cabaayad yar', price: 18 },
  { id: 97, name: 'cabaayad yar', price: 16 }, { id: 98, name: 'cabaayad yar', price: 19 },
  { id: 99, name: 'cabaayad yar', price: 17 }, { id: 100, name: 'cabaayad yar', price: 18 },
  { id: 101, name: 'cabaayad yar', price: 18 }, { id: 102, name: 'body', price: 5 },
  { id: 103, name: 'body', price: 5 }, { id: 104, name: 'toob', price: 10 },
  { id: 105, name: 'cabaayad yar', price: 17 }, { id: 106, name: 'cabaayad yar', price: 18 },
  { id: 107, name: 'cabaayad', price: 17 }, { id: 108, name: 'toob', price: 13 },
  { id: 109, name: 'cabaayad yar', price: 17 },
  { id: 110, name: 'Toob', price: 14 }, { id: 111, name: 'Toob', price: 15 },
  { id: 112, name: 'Toob', price: 16 }, { id: 113, name: 'Dirac Wil', price: 16 },
  { id: 114, name: 'Cabaayad', price: 23 }, { id: 115, name: 'Cabaayad', price: 21 },
  { id: 116, name: 'Body', price: 6 }, { id: 117, name: 'Shaal', price: 8 },
  { id: 118, name: 'Cabaayad', price: 23 }, { id: 119, name: 'Cabaayad', price: 21 },
  { id: 120, name: 'Cabaayad Yar', price: 16 }, 
];

const initialExpenses: ExpenseItem[] = [
  { id: 1, name: 'Rent', amount: 600 },
  { id: 2, name: 'Cashuur', amount: 22 },
  { id: 3, name: 'Masaxaad', amount: 16 },
  { id: 4, name: 'Laydh', amount: 22 },
  { id: 5, name: 'Laydh', amount: 43 },
  { id: 6, name: 'Quful laba midh', amount: 5 },
  { id: 7, name: 'Saleebaan', amount: 17 },
  { id: 8, name: 'Binan iyo cinjiro', amount: 4 },
  { id: 9, name: 'Bir salax', amount: 6 },
  { id: 10, name: 'Xaqal ciid', amount: 30 },
  { id: 11, name: 'Masaariif (15 Apr - 17 Jun)', amount: 833 },
  { id: 12, name: 'Masaariif (17 Jun - 29 Jul)', amount: 546 }
];

export default function Tracker() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses);
  const [activeTab, setActiveTab] = useState<'inventory' | 'expenses' | 'analytics'>('inventory');
  
  // PDF Printing State
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Form states
  const [newInvName, setNewInvName] = useState('');
  const [newInvPrice, setNewInvPrice] = useState('');
  const [newExpName, setNewExpName] = useState('');
  const [newExpPrice, setNewExpPrice] = useState('');

  // Calculations
  const totalIncome = useMemo(() => inventory.reduce((sum, item) => sum + (Number(item.price) || 0), 0), [inventory]);
  const totalExpense = useMemo(() => expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0), [expenses]);
  const netBalance = totalIncome - totalExpense;
  const isNegative = netBalance < 0;

  // Handlers for Inventory
  const handleAddInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName || !newInvPrice) return;
    setInventory([...inventory, { id: Date.now(), name: newInvName.trim(), price: parseFloat(newInvPrice) }]);
    setNewInvName('');
    setNewInvPrice('');
  };

  const updateInventory = (id: number, field: 'name' | 'price', value: string) => {
    setInventory(inventory.map(item => {
      if (item.id === id) {
        return { ...item, [field]: field === 'price' ? parseFloat(value) || 0 : value };
      }
      return item;
    }));
  };

  const deleteInventory = (id: number) => setInventory(inventory.filter(i => i.id !== id));

  // Handlers for Expenses
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpName || !newExpPrice) return;
    setExpenses([...expenses, { id: Date.now(), name: newExpName.trim(), amount: parseFloat(newExpPrice) }]);
    setNewExpName('');
    setNewExpPrice('');
  };

  const updateExpense = (id: number, field: 'name' | 'amount', value: string) => {
    setExpenses(expenses.map(exp => {
      if (exp.id === id) {
        return { ...exp, [field]: field === 'amount' ? parseFloat(value) || 0 : value };
      }
      return exp;
    }));
  };

  const deleteExpense = (id: number) => setExpenses(expenses.filter(e => e.id !== id));

  // PDF Download Logic
  const handleDownloadPDF = () => {
    setIsPrinting(true);
    // Allow DOM to update and render all tabs fully
    setTimeout(async () => {
      if (!printRef.current) return;
      try {
        const canvas = await html2canvas(printRef.current, { 
          scale: 2, 
          backgroundColor: '#0f172a',
          useCORS: true 
        });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        // Create new pages if the content overflows A4 size
        while (heightLeft >= 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }

        pdf.save('Dashboard_Report.pdf');
      } catch (err) {
        console.error("PDF Generation Failed", err);
      } finally {
        setIsPrinting(false);
      }
    }, 800);
  };

  // Chart Data Preparation
  const chartData = useMemo(() => {
    const groupedInv = inventory.reduce((acc: any, item) => {
      let key = item.name.trim().toLowerCase();
      if (key === 'cabaayd') key = 'cabaayad'; 
      if (!acc[key]) acc[key] = { count: 0, totalValue: 0 };
      acc[key].count += 1;
      acc[key].totalValue += Number(item.price);
      return acc;
    }, {});

    const invLabels = Object.keys(groupedInv).map(s => s.charAt(0).toUpperCase() + s.slice(1));
    const invVals = Object.values(groupedInv).map((d: any) => d.totalValue);
    const invCounts = Object.values(groupedInv).map((d: any) => d.count);

    const expLabels = expenses.map(e => e.name);
    const expData = expenses.map(e => e.amount);
    const expColors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1'];

    return {
      inventory: {
        labels: invLabels,
        datasets: [
          {
            type: 'bar' as const,
            label: 'Total Value ($)',
            data: invVals,
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 1,
            borderRadius: 6,
            yAxisID: 'y',
          },
          {
            type: 'line' as const,
            label: 'Item Count (Qty)',
            data: invCounts,
            backgroundColor: 'rgba(192, 132, 252, 1)',
            borderColor: 'rgba(192, 132, 252, 1)',
            borderWidth: 3,
            pointBackgroundColor: '#1e293b',
            pointRadius: 4,
            yAxisID: 'y1',
          }
        ]
      },
      expenses: {
        labels: expLabels,
        datasets: [{
          data: expData,
          backgroundColor: expColors.slice(0, expData.length),
          borderColor: '#1e293b',
          borderWidth: 2,
        }]
      }
    };
  }, [inventory, expenses]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
            --bg-color: #0f172a;
            --surface-color: #1e293b;
            --surface-hover: #334155;
            --primary-color: #6366f1;
            --primary-hover: #4f46e5;
            --secondary-color: #c084fc;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --danger: #f43f5e;
            --danger-hover: #e11d48;
            --success: #10b981;
            --border: #334155;
            --radius: 12px;
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        body { background-color: var(--bg-color); color: var(--text-main); min-height: 100vh; padding: 2rem 1rem; display: flex; justify-content: center; }
        .app-container { width: 100%; max-width: 950px; background: var(--surface-color); border-radius: var(--radius); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); overflow: hidden; border: 1px solid var(--border); position: relative; }
        .header { padding: 2rem; text-align: center; background: linear-gradient(to right bottom, #1e293b, #0f172a); border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 1.5rem; }
        
        .pdf-btn { position: absolute; top: 1rem; right: 1rem; background: var(--primary-color); color: white; padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; transition: var(--transition); z-index: 10; }
        .pdf-btn:hover { background: var(--primary-hover); transform: translateY(-2px); }
        .pdf-btn:disabled { opacity: 0.7; cursor: wait; transform: none; }

        .stats-row { display: flex; justify-content: space-around; flex-wrap: wrap; gap: 1.5rem; margin-top: 1.5rem; }
        .stat-box { display: flex; flex-direction: column; align-items: center; background: rgba(15, 23, 42, 0.4); padding: 1rem 2rem; border-radius: var(--radius); border: 1px solid var(--border); flex: 1; min-width: 200px; }
        .stat-label { color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
        .stat-value { font-size: 2.25rem; font-weight: 800; }
        .money-income { background: linear-gradient(135deg, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .money-expense { color: var(--danger); }
        .money-balance { color: var(--success); }
        .money-balance.negative { color: var(--danger); }
        .tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--surface-hover); }
        .tab-btn { flex: 1; padding: 1rem; background: transparent; color: var(--text-muted); border: none; border-bottom: 3px solid transparent; cursor: pointer; font-size: 1rem; font-weight: 600; transition: var(--transition); }
        .tab-btn:hover { background: rgba(255, 255, 255, 0.05); color: var(--text-main); }
        .tab-btn.active { color: var(--primary-color); border-bottom-color: var(--primary-color); background: var(--surface-color); }
        .tab-btn.expense-tab.active { color: var(--danger); border-bottom-color: var(--danger); }
        .tab-content { padding: 2rem; animation: fadeIn 0.4s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .add-form { display: grid; grid-template-columns: 2fr 1fr auto; gap: 1rem; margin-bottom: 2rem; }
        input { background: var(--bg-color); border: 1px solid var(--border); color: var(--text-main); padding: 0.75rem 1rem; border-radius: var(--radius); font-size: 1rem; transition: var(--transition); }
        input:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); }
        .expense-input:focus { border-color: var(--danger); box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.2); }
        button.btn-add { background: var(--primary-color); color: white; border: none; padding: 0 1.5rem; border-radius: var(--radius); font-weight: 600; cursor: pointer; transition: var(--transition); }
        button.btn-add:hover { background: var(--primary-hover); transform: translateY(-2px); }
        button.btn-add-expense { background: var(--danger); }
        button.btn-add-expense:hover { background: var(--danger-hover); }
        
        .item-list { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; max-height: 400px; overflow-y: auto; padding-right: 0.5rem; }
        .item-list.print-mode { max-height: none; overflow: visible; } /* Removes scrollbar for full printing */
        .item-list::-webkit-scrollbar { width: 6px; }
        .item-list::-webkit-scrollbar-track { background: var(--bg-color); border-radius: 4px; }
        .item-list::-webkit-scrollbar-thumb { background: var(--surface-hover); border-radius: 4px; }
        
        .list-item { display: grid; grid-template-columns: 2fr 1fr auto; gap: 1rem; background: var(--bg-color); padding: 0.75rem; border-radius: var(--radius); align-items: center; border: 1px solid transparent; transition: var(--transition); }
        .list-item:hover { border-color: var(--border); background: var(--surface-color); }
        .list-item input { background: transparent; border: 1px solid transparent; padding: 0.5rem; width: 100%; }
        .list-item input:hover { background: var(--surface-hover); }
        .list-item input:focus { background: var(--bg-color); border-color: var(--primary-color); }
        
        .btn-delete { background: rgba(244, 63, 94, 0.1); color: var(--danger); border: none; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--transition); }
        .btn-delete:hover { background: var(--danger); color: white; }
        .chart-container { position: relative; height: 450px; width: 100%; margin-bottom: 2rem; }
        .chart-wrapper-dual { display: flex; flex-direction: column; gap: 2rem; }
        .tab-title-print { display: none; color: var(--text-main); font-size: 1.5rem; margin-bottom: 1rem; font-weight: bold; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;}

        /* Media Queries for full Responsiveness */
        @media (max-width: 768px) {
          .stats-row { flex-direction: column; }
          .stat-box { width: 100%; }
          .add-form { grid-template-columns: 1fr; }
          button.btn-add { padding: 1rem; }
          .list-item { grid-template-columns: 1fr; position: relative; padding-right: 50px; }
          .btn-delete { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); }
          .tabs { flex-direction: column; }
          .pdf-btn { position: relative; top: 0; right: 0; width: 100%; justify-content: center; margin-bottom: 1rem; }
          .header { padding: 1.5rem 1rem; }
          .tab-content { padding: 1rem; }
        }

        /* Print Specific Overrides */
        .printing-active .tabs, .printing-active .pdf-btn, .printing-active .add-form, .printing-active .btn-delete { display: none !important; }
        .printing-active .tab-title-print { display: block; }
        .printing-active .tab-content { padding: 1rem 2rem; border-bottom: 2px dashed var(--border); animation: none; }
      `}} />

      <div 
        ref={printRef} 
        className={`app-container ${isPrinting ? 'printing-active' : ''}`}
        style={isPrinting ? { maxWidth: '1000px', width: '1000px' } : undefined}
      >
        {!isPrinting && (
          <button className="pdf-btn" onClick={handleDownloadPDF} disabled={isPrinting}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isPrinting ? 'Generating PDF...' : 'Download PDF Report'}
          </button>
        )}

        {/* Header & Live Totals */}
        <div className="header">
          {isPrinting && <h2>Comprehensive Financial Report</h2>}
          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-label">Total Items</div>
              <div className="stat-value" style={{ color: '#f8fafc' }}>{inventory.length}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Gross Income</div>
              <div className="stat-value money-income">{totalIncome.toFixed(2)}</div>
            </div>
          </div>
          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value money-expense">{totalExpense.toFixed(2)}</div>
            </div>
            <div 
              className="stat-box" 
              style={{
                background: isNegative ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                borderColor: isNegative ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)'
              }}
            >
              <div className="stat-label" style={{ color: isNegative ? 'var(--danger)' : 'var(--success)' }}>
                Left (Net Balance)
              </div>
              <div className={`stat-value money-balance ${isNegative ? 'negative' : ''}`}>
                {netBalance.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Hidden during print) */}
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} 
            onClick={() => setActiveTab('inventory')}
          >
            Sales List & Edit
          </button>
          <button 
            className={`tab-btn expense-tab ${activeTab === 'expenses' ? 'active' : ''}`} 
            onClick={() => setActiveTab('expenses')}
          >
            Expenses
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} 
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </div>

        {/* Tab 1: Inventory (Always visible if printing) */}
        {(activeTab === 'inventory' || isPrinting) && (
          <div className="tab-content">
            <h3 className="tab-title-print">Sales Record</h3>
            <form className="add-form" onSubmit={handleAddInventory}>
              <input 
                type="text" 
                placeholder="Item Name (e.g. Cabaayad)" 
                value={newInvName} 
                onChange={(e) => setNewInvName(e.target.value)} 
                required 
              />
              <input 
                type="number" 
                placeholder="Price" 
                step="0.01" 
                value={newInvPrice} 
                onChange={(e) => setNewInvPrice(e.target.value)} 
                required 
              />
              <button type="submit" className="btn-add">Add Sale</button>
            </form>
            <ul className={`item-list ${isPrinting ? 'print-mode' : ''}`}>
              {inventory.map(item => (
                <li key={item.id} className="list-item">
                  <input 
                    type="text" 
                    value={item.name} 
                    onChange={(e) => updateInventory(item.id, 'name', e.target.value)} 
                    readOnly={isPrinting}
                  />
                  <input 
                    type="number" 
                    step="0.01" 
                    value={item.price} 
                    onChange={(e) => updateInventory(item.id, 'price', e.target.value)} 
                    readOnly={isPrinting}
                  />
                  <button type="button" className="btn-delete" onClick={() => deleteInventory(item.id)}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tab 2: Expenses (Always visible if printing) */}
        {(activeTab === 'expenses' || isPrinting) && (
          <div className="tab-content">
            <h3 className="tab-title-print">Expenses Record</h3>
            <form className="add-form" onSubmit={handleAddExpense}>
              <input 
                type="text" 
                className="expense-input" 
                placeholder="Expense Name (e.g. Rent)" 
                value={newExpName} 
                onChange={(e) => setNewExpName(e.target.value)} 
                required 
              />
              <input 
                type="number" 
                className="expense-input" 
                placeholder="Cost" 
                step="0.01" 
                value={newExpPrice} 
                onChange={(e) => setNewExpPrice(e.target.value)} 
                required 
              />
              <button type="submit" className="btn-add btn-add-expense">Add Expense</button>
            </form>
            <ul className={`item-list ${isPrinting ? 'print-mode' : ''}`}>
              {expenses.map(exp => (
                <li key={exp.id} className="list-item">
                  <input 
                    type="text" 
                    className="expense-input" 
                    value={exp.name} 
                    onChange={(e) => updateExpense(exp.id, 'name', e.target.value)} 
                    readOnly={isPrinting}
                  />
                  <input 
                    type="number" 
                    className="expense-input" 
                    step="0.01" 
                    value={exp.amount} 
                    onChange={(e) => updateExpense(exp.id, 'amount', e.target.value)} 
                    readOnly={isPrinting}
                  />
                  <button type="button" className="btn-delete" onClick={() => deleteExpense(exp.id)}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tab 3: Analytics (Always visible if printing) */}
        {(activeTab === 'analytics' || isPrinting) && (
          <div className="tab-content">
            <h3 className="tab-title-print">Analytics Overview</h3>
            <div className="chart-wrapper-dual">
              <div className="chart-container" style={{ height: '300px' }}>
                <h3 style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '10px' }}>Sales Breakdown</h3>
                <Bar 
                  data={chartData.inventory as any} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#f8fafc' } } },
                    scales: {
                      x: { ticks: { color: '#94a3b8' } },
                      y: { type: 'linear', position: 'left', ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                      y1: { type: 'linear', position: 'right', ticks: { color: '#94a3b8', stepSize: 1 }, grid: { display: false } }
                    }
                  }} 
                />
              </div>
              <hr style={{ border: 0, borderTop: '1px solid var(--border)' }} />
              <div className="chart-container" style={{ height: '350px' }}>
                <h3 style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '10px' }}>Expenses Breakdown</h3>
                <Doughnut 
                  data={chartData.expenses} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'right', labels: { color: '#f8fafc', font: { size: 11 } } },
                      tooltip: {
                        callbacks: {
                          label: function(context: any) {
                            let val = context.raw;
                            let total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            let percentage = ((val / total) * 100).toFixed(1) + "%";
                            return ` $${val.toFixed(2)} (${percentage})`;
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}